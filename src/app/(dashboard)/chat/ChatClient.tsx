"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { WalletSession, Session, AgentSSEEvent } from "@/types";
import { shortAddr, formatElapsed, formatRelativeTime, cn } from "@/lib/utils";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  events?: AgentSSEEvent[];
  isStreaming?: boolean;
  timestamp: string;
}

interface Props {
  wallet: WalletSession;
  initialSessions: Session[];
}

// Per-session cache for messages and streaming state
interface SessionCache {
  messages: DisplayMessage[];
  streaming: boolean;
}

export default function ChatClient({ wallet, initialSessions }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState("qwen3:1.7b");
  const [models, setModels] = useState<string[]>(["qwen3:1.7b"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<"online" | "offline" | "checking">("checking");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; path: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cache messages per session so they survive tab switches
  const cacheRef = useRef<Map<string, SessionCache>>(new Map());
  // Track which session the current background stream targets
  const streamingSessionRef = useRef<string | null>(null);
  // Ref to track currentSessionId for use inside closures
  const currentSessionIdRef = useRef<string | null>(null);
  currentSessionIdRef.current = currentSessionId;

  // Fetch Ollama health
  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((d: { ollama: string; models: string[] }) => {
      setOllamaStatus(d.ollama === "online" ? "online" : "offline");
      if (d.models?.length > 0) setModels(d.models);
    }).catch(() => setOllamaStatus("offline"));
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Keep cache in sync with current messages
  useEffect(() => {
    if (currentSessionId) {
      cacheRef.current.set(currentSessionId, { messages, streaming: isStreaming });
    }
  }, [messages, isStreaming, currentSessionId]);

  async function loadSession(sessionId: string) {
    // Don't reload same session
    if (sessionId === currentSessionId) return;

    // Save current session to cache before switching
    if (currentSessionId) {
      cacheRef.current.set(currentSessionId, { messages, streaming: isStreaming });
    }

    // Check if target session is cached (e.g. has an active background stream)
    const cached = cacheRef.current.get(sessionId);
    if (cached) {
      setMessages(cached.messages);
      setIsStreaming(cached.streaming);
      setCurrentSessionId(sessionId);
      return;
    }

    // Load from server
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) return;
    const data = await res.json() as { messages: Array<{ role: string; content: string }> };
    const displayMessages: DisplayMessage[] = data.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m, i) => ({
        id: `loaded_${i}`,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date().toISOString(),
      }));
    setMessages(displayMessages);
    setIsStreaming(false);
    setCurrentSessionId(sessionId);
  }

  async function newSession() {
    // Save current session to cache
    if (currentSessionId) {
      cacheRef.current.set(currentSessionId, { messages, streaming: isStreaming });
    }

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    const session = await res.json() as Session;
    setSessions((prev) => [session, ...prev]);
    setCurrentSessionId(session.id);
    setMessages([]);
    setIsStreaming(false);
    inputRef.current?.focus();
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    cacheRef.current.delete(id);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
      setIsStreaming(false);
    }
  }

  // Helper to update messages for a specific session (current or background)
  function updateSessionMessages(
    targetSessionId: string,
    updater: (prev: DisplayMessage[]) => DisplayMessage[]
  ) {
    if (targetSessionId === currentSessionIdRef.current) {
      // Update live state
      setMessages(updater);
    } else {
      // Update cache for background session
      const cached = cacheRef.current.get(targetSessionId);
      if (cached) {
        cacheRef.current.set(targetSessionId, {
          ...cached,
          messages: updater(cached.messages),
        });
      }
    }
  }

  function setSessionStreaming(targetSessionId: string, streaming: boolean) {
    if (targetSessionId === currentSessionIdRef.current) {
      setIsStreaming(streaming);
    } else {
      const cached = cacheRef.current.get(targetSessionId);
      if (cached) {
        cacheRef.current.set(targetSessionId, { ...cached, streaming });
      }
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const text = await res.text();
        alert(`Upload failed (${res.status}): ${text}`);
        return;
      }
      const data = await res.json() as {
        uploaded: { name: string; path: string; size: number }[];
        errors: string[];
      };
      if (data.uploaded?.length > 0) {
        setAttachedFiles((prev) => [...prev, ...data.uploaded]);
      }
      if (data.errors?.length > 0) {
        alert(data.errors.join("\n"));
      }
    } catch (err) {
      alert("Failed to upload file: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeAttachedFile(idx: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function sendMessage() {
    const text = input.trim();
    const hasFiles = attachedFiles.length > 0;
    if ((!text && !hasFiles) || isStreaming) return;

    // Build message with file context
    let fullMessage = text;
    if (hasFiles) {
      const fileInfo = attachedFiles.map((f) =>
        `[UPLOADED_FILE name="${f.name}" path="${f.path}" size="${Math.round(f.size / 1024)}KB"]`
      ).join("\n");
      fullMessage = fileInfo + (text ? "\n\n" + text : "\n\nProcess the uploaded files above.");
    }

    setInput("");
    setAttachedFiles([]);
    setIsStreaming(true);

    // Add user message immediately
    const userMsgId = `user_${Date.now()}`;
    const asstMsgId = `asst_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: fullMessage, timestamp: new Date().toISOString() },
      { id: asstMsgId, role: "assistant", content: "", events: [], isStreaming: true, timestamp: new Date().toISOString() },
    ]);

    const streamSessionId = currentSessionId;
    streamingSessionRef.current = streamSessionId;

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullMessage, sessionId: currentSessionId, model }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // Track the actual session ID (may be assigned by server)
      let resolvedSessionId = streamSessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: { type: string; sessionId?: string; text?: string; message?: string; loop?: number; tool?: string; args?: Record<string, unknown>; result?: string; elapsed?: number };
          try {
            event = JSON.parse(line.slice(6));
          } catch { continue; }

          if (event.type === "session_id" && event.sessionId) {
            resolvedSessionId = event.sessionId;
            streamingSessionRef.current = resolvedSessionId;
            // Update currentSessionId only if user hasn't switched away
            if (streamSessionId === currentSessionIdRef.current || !streamSessionId) {
              setCurrentSessionId(resolvedSessionId);
            }
            // Migrate cache entry if session ID changed
            if (streamSessionId !== resolvedSessionId && streamSessionId) {
              const old = cacheRef.current.get(streamSessionId);
              if (old) {
                cacheRef.current.set(resolvedSessionId, old);
                cacheRef.current.delete(streamSessionId);
              }
            }
          } else if (event.type === "done") {
            updateSessionMessages(resolvedSessionId!, (prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? { ...m, content: event.text || "", isStreaming: false }
                  : m
              )
            );
            // Refresh sessions list
            fetch("/api/sessions").then((r) => r.json()).then((s) => setSessions(s as Session[]));
          } else if (event.type === "error") {
            updateSessionMessages(resolvedSessionId!, (prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? { ...m, content: `⚠ ${event.message}`, isStreaming: false }
                  : m
              )
            );
          } else {
            // tool_start, tool_end, thinking
            updateSessionMessages(resolvedSessionId!, (prev) =>
              prev.map((m) =>
                m.id === asstMsgId
                  ? { ...m, events: [...(m.events || []), event as AgentSSEEvent] }
                  : m
              )
            );
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const targetId = streamingSessionRef.current || streamSessionId;
        updateSessionMessages(targetId!, (prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? { ...m, content: `⚠ Error: ${(err as Error).message}`, isStreaming: false }
              : m
          )
        );
      }
    } finally {
      const targetId = streamingSessionRef.current || streamSessionId;
      setSessionStreaming(targetId!, false);
      streamingSessionRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false, content: m.content || "(stopped)" } : m))
    );
  }

  async function disconnect() {
    await fetch("/api/auth/connect", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-ink overflow-hidden">
      {/* SIDEBAR */}
      <aside className={cn(
        "flex flex-col bg-ink-1 border-r border-rim transition-all duration-200 flex-shrink-0",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-rim">
          <Image src="/logo.png" alt="AutonQwen" width={32} height={32} className="rounded-lg shadow-[0_0_12px_rgba(0,229,204,.3)] flex-shrink-0" />
          <span className="font-display font-extrabold text-sm">AutonQwen</span>
        </div>

        {/* New chat button */}
        <div className="p-3 border-b border-rim">
          <button onClick={newSession}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-cyan-agent/8 border border-cyan-agent/20 text-cyan-agent text-sm font-semibold hover:bg-cyan-agent/12 transition-all">
            <span className="text-lg leading-none">+</span> New Chat
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 ? (
            <p className="text-text-4 text-xs text-center py-8 px-4">No conversations yet.<br />Start by sending a message.</p>
          ) : (
            sessions.map((s) => {
              const isBgStreaming = s.id !== currentSessionId && cacheRef.current.get(s.id)?.streaming;
              return (
                <div key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={cn(
                    "group flex items-start gap-2 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all",
                    currentSessionId === s.id
                      ? "bg-ink-3 border border-rim-2"
                      : "hover:bg-ink-2"
                  )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {isBgStreaming && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-agent animate-blink-dot flex-shrink-0" />
                      )}
                      <p className="text-[13px] font-medium text-text-1 truncate">{s.title}</p>
                    </div>
                    <p className="text-[11px] text-text-3 font-mono mt-0.5">
                      {isBgStreaming ? <span className="text-cyan-agent">Agent working…</span> : <>{formatRelativeTime(s.updatedAt)} · {s.messageCount} msgs</>}
                    </p>
                  </div>
                  <button onClick={(e) => deleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-text-4 hover:text-rose-agent transition-all text-base leading-none flex-shrink-0 mt-0.5">
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Wallet info */}
        <div className="border-t border-rim p-3 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-2">
            <span className="w-2 h-2 rounded-full bg-lime-agent flex-shrink-0 animate-blink-dot" />
            <span className="font-mono text-[11px] text-text-2 truncate flex-1">{shortAddr(wallet.address)}</span>
          </div>
          <button onClick={disconnect}
            className="w-full py-2 rounded-xl text-xs text-text-3 hover:text-rose-agent hover:bg-rose-agent/5 transition-all">
            Disconnect
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-rim bg-ink-1/60 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-8 h-8 rounded-lg grid place-items-center text-text-3 hover:text-text-1 hover:bg-ink-3 transition-all">
            ☰
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
              ollamaStatus === "online" ? "bg-lime-agent animate-blink-dot"
              : ollamaStatus === "offline" ? "bg-rose-agent"
              : "bg-gold-agent animate-pulse")} />
            <span className="font-mono text-[11px] text-text-3">
              Ollama {ollamaStatus}
            </span>
          </div>

          {/* Model selector */}
          <select value={model} onChange={(e) => setModel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-ink-2 border border-rim text-text-2 font-mono text-[11px] outline-none hover:border-rim-2 transition-all cursor-pointer">
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onSend={(msg) => { setInput(msg); setTimeout(sendMessage, 0); }} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-rim bg-ink-1/80 backdrop-blur-sm p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-agent/8 border border-cyan-agent/20 text-[12px]">
                    <span className="text-cyan-agent">📎</span>
                    <span className="text-text-2 font-mono truncate max-w-[200px]">{f.name}</span>
                    <span className="text-text-4 font-mono">{Math.round(f.size / 1024)}KB</span>
                    <button onClick={() => removeAttachedFile(i)} className="text-text-4 hover:text-rose-agent transition-colors ml-1">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className={cn(
              "flex items-end gap-2 p-3 rounded-2xl border transition-all",
              isStreaming
                ? "border-cyan-agent/30 bg-ink-2"
                : "border-rim-2 bg-ink-2 focus-within:border-cyan-agent/40"
            )}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,.txt,.md,.json,.xml,.yaml,.yml,.py,.js,.ts,.html,.css,.sql,.log,.ini,.toml,.conf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || uploading}
                title="Upload file (.xlsx, .csv, .txt, .json, .py, dll)"
                className="flex-shrink-0 w-10 h-10 rounded-xl border border-rim hover:border-cyan-agent/30 hover:bg-ink-3 text-text-3 hover:text-cyan-agent transition-all grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed">
                {uploading ? <span className="animate-spin text-sm">⟳</span> : "📎"}
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder={attachedFiles.length > 0 ? "Add instructions for the file... (optional)" : "Type a message or upload a file…"}
                className="flex-1 bg-transparent text-text-1 placeholder:text-text-4 font-body text-sm outline-none resize-none min-h-[44px] max-h-[200px] leading-relaxed disabled:opacity-60"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 200) + "px";
                }}
              />
              {isStreaming ? (
                <button onClick={stopStreaming}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-agent/10 border border-rose-agent/30 text-rose-agent hover:bg-rose-agent/20 transition-all grid place-items-center">
                  ■
                </button>
              ) : (
                <button onClick={sendMessage} disabled={!input.trim() && attachedFiles.length === 0}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-agent text-black hover:bg-cyan-bright transition-all grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed">
                  ↑
                </button>
              )}
            </div>
            <p className="text-[11px] text-text-4 text-center mt-2 font-mono">
              Enter ↵ send · Shift+Enter new line · 📎 upload file · [REMEMBER: key = value] save fact
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────
function MessageBubble({ message }: { message: DisplayMessage }) {
  const [showResult, setShowResult] = useState<number | null>(null);
  const allEvents = message.events || [];
  const hasEvents = allEvents.length > 0;

  // Group events into steps for better visualization
  const thinkingEvents = allEvents.filter((e) => e.type === "thinking");
  const toolStartEvents = allEvents.filter((e) => e.type === "tool_start");
  const toolEndEvents = allEvents.filter((e) => e.type === "tool_end");
  const totalTools = toolEndEvents.length;
  const lastThinking = thinkingEvents[thinkingEvents.length - 1];

  if (message.role === "user") {
    // Parse attached file tags from content
    const fileRegex = /\[UPLOADED_FILE name="(.+?)" path=".+?" size="(\d+)KB"\]/g;
    const files: { name: string; size: string }[] = [];
    let match;
    while ((match = fileRegex.exec(message.content)) !== null) {
      files.push({ name: match[1], size: match[2] });
    }
    // Get the text portion (after file tags)
    const textContent = message.content.replace(/\[UPLOADED_FILE name=".+?" path=".+?" size="\d+KB"\]\n*/g, "").trim();

    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-ink-3 border border-rim-2 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-text-1 leading-relaxed">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-agent/8 border border-cyan-agent/15 font-mono text-[11px] text-cyan-agent">
                  📎 {f.name} <span className="text-text-4">{f.size}KB</span>
                </span>
              ))}
            </div>
          )}
          {textContent && textContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Process logs — always visible */}
      {hasEvents && (
        <div className="w-full bg-ink-2 border border-rim rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-ink-3/50 border-b border-rim">
            {message.isStreaming ? (
              <span className="w-2 h-2 rounded-full bg-cyan-agent animate-blink-dot" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-lime-agent" />
            )}
            <span className="font-mono text-[11px] text-text-2">
              {message.isStreaming ? (
                <span className="text-cyan-agent">
                  Agent processing… {lastThinking ? `loop ${lastThinking.loop}` : ""}
                  {toolStartEvents.length > toolEndEvents.length && ` → ${toolStartEvents[toolStartEvents.length - 1]?.tool}`}
                </span>
              ) : (
                <>{thinkingEvents.length} {thinkingEvents.length === 1 ? "loop" : "loops"} · {totalTools} tool {totalTools === 1 ? "call" : "calls"}</>
              )}
            </span>
          </div>

          {/* Log entries */}
          <div className="px-4 py-2.5 space-y-1 max-h-[300px] overflow-y-auto">
            {allEvents.map((ev, i) => {
              if (ev.type === "thinking") return (
                <div key={i} className="flex items-center gap-2 font-mono text-[11px] py-0.5">
                  <span className="text-gold-agent">🧠</span>
                  <span className="text-text-3">Loop {ev.loop}</span>
                  <span className="text-text-4">— thinking…</span>
                </div>
              );
              if (ev.type === "tool_start") {
                const argsStr = JSON.stringify(ev.args || {});
                const shortArgs = argsStr.length > 100 ? argsStr.slice(0, 100) + "…" : argsStr;
                return (
                  <div key={i} className="flex items-start gap-2 font-mono text-[11px] py-0.5">
                    <span className="text-cyan-agent mt-px">▶</span>
                    <div className="min-w-0">
                      <span className="text-cyan-agent font-bold">{ev.tool}</span>
                      <span className="text-text-4 ml-1">({shortArgs})</span>
                    </div>
                  </div>
                );
              }
              if (ev.type === "tool_end") {
                const hasResult = ev.result && ev.result.length > 0;
                return (
                  <div key={i} className="font-mono text-[11px] py-0.5 pl-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lime-agent">✓</span>
                      <span className="text-text-2">{ev.tool}</span>
                      <span className="text-text-4">· {formatElapsed(ev.elapsed || 0)}</span>
                      {hasResult && (
                        <button
                          onClick={() => setShowResult(showResult === i ? null : i)}
                          className="text-[10px] text-text-4 hover:text-cyan-agent transition-colors underline underline-offset-2">
                          {showResult === i ? "hide" : "view output"}
                        </button>
                      )}
                    </div>
                    {showResult === i && hasResult && (
                      <div className="mt-1 p-2 bg-ink-3 rounded-lg border border-rim text-text-3 max-h-32 overflow-y-auto whitespace-pre-wrap text-[10.5px] leading-relaxed">
                        {ev.result!.slice(0, 800)}{ev.result!.length > 800 ? "…" : ""}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Assistant response */}
      <div className="flex gap-3 items-start">
        <Image src="/logo.png" alt="AQ" width={32} height={32} className="rounded-xl flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(0,229,204,.2)]" />
        <div className="flex-1 min-w-0">
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-2 text-text-3 text-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-agent animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-agent animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-agent animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              Reasoning…
            </div>
          ) : (
            <div className="prose-agent text-sm text-text-1 leading-relaxed">
              <MarkdownContent content={message.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Minimal Markdown Renderer ─────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  // Very lightweight markdown: code blocks, inline code, bold, paragraphs
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-ink-3 border border-rim rounded-xl p-4 my-3 overflow-x-auto">
          {lang && <div className="font-mono text-[10px] text-text-4 mb-2 uppercase tracking-widest">{lang}</div>}
          <code className="font-mono text-[12px] text-text-2 whitespace-pre">{codeLines.join("\n")}</code>
        </pre>
      );
    }
    // Empty line
    else if (line.trim() === "") {
      elements.push(<br key={i} />);
    }
    // Heading
    else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="font-display font-bold text-base mt-4 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="font-display font-bold text-lg mt-5 mb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="font-display font-extrabold text-xl mt-5 mb-2">{line.slice(2)}</h1>);
    }
    // List item
    else if (line.match(/^[-*+]\s/)) {
      elements.push(<div key={i} className="flex gap-2 mb-1"><span className="text-cyan-agent text-xs mt-1">◆</span><span>{inlineFormat(line.slice(2))}</span></div>);
    }
    // Numbered list
    else if (line.match(/^\d+\.\s/)) {
      elements.push(<div key={i} className="flex gap-2 mb-1"><span className="text-text-3 text-xs font-mono mt-0.5">{line.match(/^\d+/)?.[0]}.</span><span>{inlineFormat(line.replace(/^\d+\.\s/, ""))}</span></div>);
    }
    // Normal paragraph line
    else {
      elements.push(<p key={i} className="mb-1 leading-relaxed">{inlineFormat(line)}</p>);
    }

    i++;
  }

  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  // Inline code: `...`
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="font-mono text-[12px] bg-cyan-agent/8 border border-cyan-agent/15 px-1.5 py-0.5 rounded text-cyan-agent">{part.slice(1, -1)}</code>;
        }
        // Bold: **...** 
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {boldParts.map((bp, j) => {
              if (bp.startsWith("**") && bp.endsWith("**")) {
                return <strong key={j} className="font-semibold text-text-1">{bp.slice(2, -2)}</strong>;
              }
              return bp;
            })}
          </span>
        );
      })}
    </>
  );
}

// ─── Tool & Example Data ──────────────────────────────────
const agentTools = [
  { icon: "📁", name: "read_file", desc: "Read file contents. Supports all text formats.", example: "Read the contents of config.json" },
  { icon: "✏️", name: "write_file", desc: "Write or overwrite a file. Auto-creates directories.", example: "Create a file hello.py with hello world" },
  { icon: "📂", name: "list_directory", desc: "List files and folders in a directory.", example: "Show all files in the /data folder" },
  { icon: "💻", name: "run_command", desc: "Run a shell command. Dangerous commands are automatically blocked.", example: "Run python script.py" },
  { icon: "🌐", name: "web_search", desc: "Web search via DuckDuckGo. No API key required.", example: "Search for the latest React hooks tutorial" },
  { icon: "🔗", name: "fetch_url", desc: "Fetch and parse content from a URL.", example: "Fetch data from https://api.example.com/data" },
  { icon: "🗄️", name: "db_query", desc: "Run SQL queries on a SQLite database.", example: "SELECT * FROM users LIMIT 10" },
  { icon: "📊", name: "read_spreadsheet", desc: "Read Excel (.xlsx) files into structured data.", example: "Read the first sheet of report.xlsx" },
  { icon: "📈", name: "write_spreadsheet", desc: "Create Excel (.xlsx) files from data.", example: "Create a spreadsheet from this sales data" },
];

// ─── Empty State ───────────────────────────────────────────
function EmptyState({ onSend }: { onSend: (msg: string) => void }) {
  const [showTools, setShowTools] = useState(false);

  return (
    <div className="flex flex-col items-center h-full px-4 py-12 overflow-y-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-agent to-cyan-dim grid place-items-center text-3xl mb-6 mx-auto shadow-[0_0_32px_rgba(0,229,204,.25)]">
          🤖
        </div>
        <h2 className="font-display font-extrabold text-2xl tracking-tight mb-2">How can I help?</h2>
        <p className="text-text-2 text-sm max-w-sm mx-auto leading-relaxed">
          I'm AutonQwen — an AI agent with access to filesystem, terminal, web search, and database.
        </p>
      </div>

      {/* Quick examples */}
      <div className="w-full max-w-2xl mb-8">
        <p className="font-mono text-[10.5px] text-cyan-agent uppercase tracking-[.18em] mb-3 px-1">Try an example</p>
        <div className="grid grid-cols-2 gap-2">
          {agentTools.slice(0, 6).map((t) => (
            <button key={t.name} onClick={() => onSend(t.example)}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-ink-2 border border-rim text-left hover:border-cyan-agent/25 hover:bg-ink-3 transition-all group">
              <span className="text-lg leading-none mt-0.5 flex-shrink-0">{t.icon}</span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-text-3 mb-0.5">{t.name}</p>
                <p className="text-[13px] text-text-2 group-hover:text-text-1 leading-snug truncate">&quot;{t.example}&quot;</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tools accordion */}
      <div className="w-full max-w-2xl">
        <button
          onClick={() => setShowTools(!showTools)}
          className="flex items-center gap-2 font-mono text-[10.5px] text-cyan-agent uppercase tracking-[.18em] mb-3 px-1 hover:text-cyan-bright transition-colors">
          <span className={cn("transition-transform text-[10px]", showTools ? "rotate-90" : "")}>▶</span>
          {agentTools.length} tools available
        </button>

        {showTools && (
          <div className="grid grid-cols-1 gap-1.5 animate-fade-up">
            {agentTools.map((t) => (
              <button key={t.name} onClick={() => onSend(t.example)}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-ink-2 border border-rim text-left hover:border-cyan-agent/25 hover:bg-ink-3 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-cyan-agent/8 border border-cyan-agent/15 grid place-items-center text-base flex-shrink-0">
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-[12px] text-text-1">{t.name}</span>
                  </div>
                  <p className="text-text-2 text-[12px] leading-relaxed mb-1">{t.desc}</p>
                  <p className="font-mono text-[11px] text-cyan-agent/60 italic truncate">example: &quot;{t.example}&quot;</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
