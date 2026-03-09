import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/session";
import { runAgentStream } from "@/lib/agent";
import { getSessionData, createSession } from "@/lib/memory";
import type { AgentSSEEvent } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

function encodeEvent(event: AgentSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { message: string; sessionId?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { message, model } = body;
  let { sessionId } = body;

  if (!message?.trim()) {
    return new Response("message is required", { status: 400 });
  }

  // Get or create session
  let sessionData = sessionId ? getSessionData(sessionId) : null;
  if (!sessionData) {
    sessionData = createSession(model || process.env.DEFAULT_MODEL || "qwen3:1.7b");
    sessionId = sessionData.id;
  }

  const resolvedModel = model || sessionData.model || "qwen3:1.7b";
  const history = sessionData.messages;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function emit(event: AgentSSEEvent) {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      }

      // Send sessionId immediately so client can update URL
      emit({ type: "thinking", loop: 0 });
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "session_id", sessionId })}\n\n`)
      );

      try {
        await runAgentStream(sessionId!, message, resolvedModel, history, emit);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        emit({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
