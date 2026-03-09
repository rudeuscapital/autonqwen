// ─── Agent & Chat ──────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface AgentSSEEvent {
  type: "thinking" | "tool_start" | "tool_end" | "done" | "error";
  loop?: number;
  tool?: string;
  args?: Record<string, unknown>;
  result?: string;
  elapsed?: number;
  text?: string;
  savedFacts?: Record<string, string>;
  usage?: { prompt_tokens: number; completion_tokens: number };
  message?: string;
}

// ─── Sessions ─────────────────────────────────────────────
export interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  model: string;
}

export interface SessionData {
  id: string;
  messages: ChatMessage[];
  title: string;
  createdAt: string;
  updatedAt: string;
  model: string;
}

// ─── Memory ───────────────────────────────────────────────
export interface FactMemory {
  [key: string]: string;
}

// ─── Tools ────────────────────────────────────────────────
export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
        default?: unknown;
      }>;
      required: string[];
    };
  };
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────
export interface WalletSession {
  address: string;
  connectedAt: string;
  chainId?: number;
}

// ─── Ollama ───────────────────────────────────────────────
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
    tool_calls?: Array<{
      function: {
        name: string;
        arguments: Record<string, unknown>;
      };
    }>;
  };
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}
