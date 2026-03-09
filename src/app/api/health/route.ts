import { NextResponse } from "next/server";

export async function GET() {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";

  let ollamaStatus = "offline";
  let models: string[] = [];

  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json() as { models: Array<{ name: string }> };
      ollamaStatus = "online";
      models = data.models?.map((m) => m.name) || [];
    }
  } catch {
    ollamaStatus = "offline";
  }

  return NextResponse.json({
    status: "ok",
    ollama: ollamaStatus,
    models,
    defaultModel: process.env.DEFAULT_MODEL || "qwen3:1.7b",
    timestamp: new Date().toISOString(),
  });
}
