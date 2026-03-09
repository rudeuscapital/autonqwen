import type { ChatMessage, AgentSSEEvent, OllamaChatResponse } from "@/types";
import { toolDefinitions } from "./tools/definitions";
import { executeTool } from "./tools/executor";
import { extractAndSaveFacts, buildSystemPrompt, getFacts, addMessage } from "./memory";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MAX_LOOPS = 10;

export async function runAgentStream(
  sessionId: string,
  userMessage: string,
  model: string,
  conversationHistory: ChatMessage[],
  emit: (event: AgentSSEEvent) => void
) {
  const facts = getFacts();
  const systemPrompt = buildSystemPrompt(facts);

  // Build full message list: system + history + new user message
  const newUserMsg: ChatMessage = { role: "user", content: userMessage };
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.filter((m) => m.role !== "system"),
    newUserMsg,
  ];

  // Save user message
  addMessage(sessionId, newUserMsg);

  // Working message list for this agent run
  const workingMessages: ChatMessage[] = [...messages];

  let loops = 0;

  while (loops < MAX_LOOPS) {
    loops++;
    emit({ type: "thinking", loop: loops });

    let ollamaRes: OllamaChatResponse;
    try {
      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: workingMessages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.tool_calls
              ? {
                  tool_calls: m.tool_calls.map((tc) => ({
                    function: {
                      name: tc.function.name,
                      arguments:
                        typeof tc.function.arguments === "string"
                          ? JSON.parse(tc.function.arguments)
                          : tc.function.arguments,
                    },
                  })),
                }
              : {}),
          })),
          tools: toolDefinitions,
          stream: false,
          keep_alive: "10m",
        }),
        signal: AbortSignal.timeout(300000), // 5 min for slow CPU inference
      });

      if (!res.ok) {
        const errText = await res.text();
        emit({ type: "error", message: `Ollama error ${res.status}: ${errText}` });
        return;
      }

      ollamaRes = await res.json() as OllamaChatResponse;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      emit({ type: "error", message: `Failed to reach Ollama: ${msg}` });
      return;
    }

    const assistantMsg = ollamaRes.message;

    // If tool calls present — execute them
    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      // Add assistant message with tool calls to working messages
      workingMessages.push({
        role: "assistant",
        content: assistantMsg.content || "",
        tool_calls: assistantMsg.tool_calls.map((tc, i) => ({
          id: `call_${loops}_${i}`,
          type: "function" as const,
          function: {
            name: tc.function.name,
            arguments: JSON.stringify(tc.function.arguments),
          },
        })),
      });

      // Execute each tool call
      for (let i = 0; i < assistantMsg.tool_calls.length; i++) {
        const tc = assistantMsg.tool_calls[i];
        const toolName = tc.function.name;
        const toolArgs = tc.function.arguments as Record<string, unknown>;
        const callId = `call_${loops}_${i}`;

        emit({ type: "tool_start", tool: toolName, args: toolArgs });
        const start = Date.now();

        const result = await executeTool(toolName, toolArgs);
        const elapsed = Date.now() - start;

        const resultText = result.success
          ? result.output
          : `ERROR: ${result.error}`;

        emit({ type: "tool_end", tool: toolName, result: resultText, elapsed });

        // Add tool result to working messages
        workingMessages.push({
          role: "tool",
          content: resultText,
          tool_call_id: callId,
          name: toolName,
        });
      }

      // Continue loop for next reasoning step
      continue;
    }

    // No tool calls — final response
    const finalText = assistantMsg.content || "";

    // Extract and save any [REMEMBER: ...] facts
    const savedFacts = extractAndSaveFacts(finalText);

    // Save assistant message to session
    const assistantRecord: ChatMessage = { role: "assistant", content: finalText };
    addMessage(sessionId, assistantRecord);

    emit({
      type: "done",
      text: finalText,
      savedFacts,
      usage: {
        prompt_tokens: ollamaRes.prompt_eval_count || 0,
        completion_tokens: ollamaRes.eval_count || 0,
      },
    });
    return;
  }

  // Hit max loops
  emit({ type: "error", message: `Max iterations (${MAX_LOOPS}) reached without a final answer.` });
}
