import fs from "fs";
import path from "path";
import type { ChatMessage, SessionData, Session, FactMemory } from "@/types";

const MEMORY_DIR = process.env.MEMORY_DIR || "./memory";
const FACTS_FILE = path.join(MEMORY_DIR, "facts.json");
const SESSIONS_DIR = path.join(MEMORY_DIR, "sessions");

function ensureDirs() {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// ─── Fact Memory ──────────────────────────────────────────
export function getFacts(): FactMemory {
  ensureDirs();
  if (!fs.existsSync(FACTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(FACTS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function setFact(key: string, value: string) {
  ensureDirs();
  const facts = getFacts();
  facts[key.trim()] = value.trim();
  fs.writeFileSync(FACTS_FILE, JSON.stringify(facts, null, 2));
}

export function deleteFact(key: string) {
  ensureDirs();
  const facts = getFacts();
  delete facts[key];
  fs.writeFileSync(FACTS_FILE, JSON.stringify(facts, null, 2));
}

export function extractAndSaveFacts(text: string): Record<string, string> {
  const saved: Record<string, string> = {};
  const regex = /\[REMEMBER:\s*(.+?)\s*=\s*(.+?)\]/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [, key, value] = match;
    setFact(key, value);
    saved[key] = value;
  }
  return saved;
}

export function buildSystemPrompt(facts: FactMemory): string {
  const factLines = Object.entries(facts)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `You are AutonQwen, an autonomous AI assistant with access to powerful tools.
You help users with file management, terminal commands, web search, database queries, and data analysis.

GUIDELINES:
- Think step by step before acting
- Use tools when needed — don't guess file contents, read them
- Chain tools together to complete complex tasks
- Be concise in final responses, detailed when showing results
- If you learn something important, save it: [REMEMBER: key = value]

UPLOADED FILES:
- When a user uploads files, their message will contain lines like: [UPLOADED_FILE name="filename.json" path="/absolute/path/to/uploads/12345_filename.json" size="2KB"]
- ALWAYS use the exact "path" value from the UPLOADED_FILE tag when calling read_file or read_spreadsheet
- NEVER guess or construct file paths yourself — use the provided path exactly as-is
- The uploaded files are stored in the server's uploads directory, NOT in the project root

AVAILABLE TOOLS: read_file, write_file, list_directory, run_command, web_search, fetch_url, db_query, read_spreadsheet, write_spreadsheet

${factLines ? `\nMEMORY (what I know about you):\n${factLines}` : ""}

Current time: ${new Date().toISOString()}`;
}

// ─── Session Memory ───────────────────────────────────────
const MAX_TOKENS_ESTIMATE = 12000;
const AVG_CHARS_PER_TOKEN = 4;
const MAX_CHARS = MAX_TOKENS_ESTIMATE * AVG_CHARS_PER_TOKEN;

function sessionFile(id: string) {
  return path.join(SESSIONS_DIR, `${id}.json`);
}

export function listSessions(): Session[] {
  ensureDirs();
  if (!fs.existsSync(SESSIONS_DIR)) return [];
  return fs
    .readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        const data: SessionData = JSON.parse(
          fs.readFileSync(path.join(SESSIONS_DIR, f), "utf-8")
        );
        return {
          id: data.id,
          title: data.title,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          messageCount: data.messages.filter((m) => m.role !== "system").length,
          model: data.model,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.updatedAt).getTime() - new Date(a!.updatedAt).getTime()) as Session[];
}

export function getSessionData(id: string): SessionData | null {
  ensureDirs();
  const file = sessionFile(id);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

export function createSession(model: string = process.env.DEFAULT_MODEL || "qwen3.5"): SessionData {
  ensureDirs();
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  const data: SessionData = {
    id,
    title: "New Conversation",
    messages: [],
    createdAt: now,
    updatedAt: now,
    model,
  };
  saveSession(data);
  return data;
}

export function saveSession(data: SessionData) {
  ensureDirs();
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(sessionFile(data.id), JSON.stringify(data, null, 2));
}

export function deleteSession(id: string) {
  const file = sessionFile(id);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function addMessage(sessionId: string, message: ChatMessage): SessionData {
  const data = getSessionData(sessionId) || createSession();
  data.messages.push(message);

  // Auto-title from first user message
  if (data.title === "New Conversation" && message.role === "user") {
    data.title = message.content.slice(0, 60) + (message.content.length > 60 ? "…" : "");
  }

  // Trim if too long (keep system + last N messages)
  const totalChars = data.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
  if (totalChars > MAX_CHARS) {
    const system = data.messages.filter((m) => m.role === "system");
    const rest = data.messages.filter((m) => m.role !== "system");
    // Keep last 20 messages
    data.messages = [...system, ...rest.slice(-20)];
  }

  saveSession(data);
  return data;
}
