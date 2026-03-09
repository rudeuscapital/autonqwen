import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import type { ToolResult } from "@/types";
import { MEMORY_DIR } from "@/lib/paths";

// ─── Safety blocklist for run_command ─────────────────────
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,
  /rm\s+-rf\s+~|rm\s+-rf\s+\*/,
  /mkfs/,
  /dd\s+if=/,
  /:(){ :|:& };:/,
  /curl.*\|\s*bash/,
  /wget.*\|\s*bash/,
  /chmod\s+777\s+\//,
  /shutdown|reboot|halt/,
  />\s*\/dev\/(sda|hda|nvme)/,
];

function isSafeCommand(cmd: string): boolean {
  return !BLOCKED_PATTERNS.some((p) => p.test(cmd));
}

// ─── Tool Executor ────────────────────────────────────────
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (name) {
      case "read_file":       return readFile(args);
      case "write_file":      return writeFile(args);
      case "list_directory":  return listDirectory(args);
      case "run_command":     return runCommand(args);
      case "web_search":      return webSearch(args);
      case "fetch_url":       return fetchUrl(args);
      case "db_query":        return dbQuery(args);
      case "read_spreadsheet": return readSpreadsheet(args);
      case "write_spreadsheet": return writeSpreadsheet(args);
      default:
        return { success: false, output: "", error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error: msg };
  }
}

// ─── Implementations ──────────────────────────────────────
function readFile(args: Record<string, unknown>): ToolResult {
  const filePath = String(args.path || "");
  if (!filePath) return { success: false, output: "", error: "path is required" };

  // Suggest read_spreadsheet for spreadsheet files
  const ext = path.extname(filePath).toLowerCase();
  if ([".xlsx", ".xls", ".csv"].includes(ext)) {
    return { success: false, output: "", error: `Use read_spreadsheet tool for ${ext} files instead of read_file. Call read_spreadsheet with path="${filePath}"` };
  }

  if (!fs.existsSync(filePath))
    return { success: false, output: "", error: `File not found: ${filePath}` };

  const stat = fs.statSync(filePath);
  if (stat.size > 200 * 1024)
    return { success: false, output: "", error: `File too large (${Math.round(stat.size / 1024)}KB). Max: 200KB` };

  const content = fs.readFileSync(filePath, "utf-8");
  return { success: true, output: content };
}

function writeFile(args: Record<string, unknown>): ToolResult {
  const filePath = String(args.path || "");
  const content = String(args.content || "");
  const append = args.append === "true" || args.append === true;

  if (!filePath) return { success: false, output: "", error: "path is required" };

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (append) {
    fs.appendFileSync(filePath, content);
    return { success: true, output: `Appended ${content.length} chars to ${filePath}` };
  } else {
    fs.writeFileSync(filePath, content);
    return { success: true, output: `Written ${content.length} chars to ${filePath}` };
  }
}

function listDirectory(args: Record<string, unknown>): ToolResult {
  const dirPath = String(args.path || ".");
  if (!fs.existsSync(dirPath))
    return { success: false, output: "", error: `Directory not found: ${dirPath}` };

  const items = fs.readdirSync(dirPath);
  const lines = items.map((item) => {
    const full = path.join(dirPath, item);
    const stat = fs.statSync(full);
    const type = stat.isDirectory() ? "DIR " : "FILE";
    const size = stat.isFile() ? ` ${Math.round(stat.size / 1024)}KB` : "";
    return `${type}  ${item}${size}`;
  });

  return {
    success: true,
    output: lines.length > 0 ? lines.join("\n") : `(empty directory: ${dirPath})`,
  };
}

function runCommand(args: Record<string, unknown>): ToolResult {
  const command = String(args.command || "");
  const cwd = String(args.cwd || ".");
  const timeout = parseInt(String(args.timeout || "15000"), 10);

  if (!command) return { success: false, output: "", error: "command is required" };
  if (!isSafeCommand(command))
    return { success: false, output: "", error: `Blocked: potentially dangerous command detected` };

  try {
    const output = execSync(command, {
      cwd: fs.existsSync(cwd) ? cwd : ".",
      timeout,
      encoding: "utf-8",
      maxBuffer: 1024 * 512,
    });
    return { success: true, output: output || "(no output)" };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    const out = `${e.stdout || ""}${e.stderr || e.message || ""}`.trim();
    return { success: false, output: out, error: out };
  }
}

async function webSearch(args: Record<string, unknown>): Promise<ToolResult> {
  const query = String(args.query || "");
  const maxResults = parseInt(String(args.max_results || "5"), 10);

  if (!query) return { success: false, output: "", error: "query is required" };

  // Try DuckDuckGo HTML search (more reliable from VPS than the API)
  try {
    const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(htmlUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(20000),
    });

    const html = await res.text();
    const { load } = await import("cheerio");
    const $ = load(html);

    const results: string[] = [];
    $(".result").slice(0, maxResults).each((_, el) => {
      const title = $(el).find(".result__title a").text().trim();
      const href = $(el).find(".result__title a").attr("href") || "";
      const snippet = $(el).find(".result__snippet").text().trim();

      // Extract actual URL from DuckDuckGo redirect
      let url = href;
      const uddgMatch = href.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        url = decodeURIComponent(uddgMatch[1]);
      }

      if (title) {
        results.push(`• ${title}\n  ${snippet}\n  URL: ${url}`);
      }
    });

    if (results.length > 0) {
      return { success: true, output: results.join("\n\n") };
    }

    // Fallback: try Instant Answer API
    return await webSearchAPI(query, maxResults);
  } catch {
    // Fallback to API if HTML search fails
    return await webSearchAPI(query, maxResults);
  }
}

async function webSearchAPI(query: string, maxResults: number): Promise<ToolResult> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AutonQwen/1.0)" },
      signal: AbortSignal.timeout(20000),
    });

    const data = await res.json() as {
      AbstractText?: string;
      AbstractURL?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
    };

    const results: string[] = [];
    if (data.AbstractText) {
      results.push(`ANSWER: ${data.AbstractText}\nURL: ${data.AbstractURL}`);
    }

    const topics = data.RelatedTopics || [];
    for (const topic of topics.slice(0, maxResults)) {
      if (topic.Text && topic.FirstURL) {
        results.push(`• ${topic.Text}\n  URL: ${topic.FirstURL}`);
      } else if (topic.Topics) {
        for (const sub of topic.Topics.slice(0, 3)) {
          if (sub.Text && sub.FirstURL) {
            results.push(`• ${sub.Text}\n  URL: ${sub.FirstURL}`);
          }
        }
      }
    }

    if (results.length === 0)
      return { success: true, output: `No results found for: "${query}"` };

    return { success: true, output: results.join("\n\n") };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error: `Web search failed: ${msg}` };
  }
}

async function fetchUrl(args: Record<string, unknown>): Promise<ToolResult> {
  const url = String(args.url || "");
  if (!url) return { success: false, output: "", error: "url is required" };

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(25000),
    });

    const html = await res.text();

    // Lazy import cheerio only when needed
    const { load } = await import("cheerio");
    const $ = load(html);

    // Remove scripts, styles, nav, footer
    $("script, style, nav, footer, header, .nav, .footer, .sidebar, .ad").remove();

    const selector = String(args.selector || "");
    let text: string;

    if (selector) {
      text = $(selector).text();
    } else {
      text = $("main, article, .content, .post, body").first().text();
      if (!text) text = $("body").text();
    }

    // Clean whitespace
    text = text.replace(/\s+/g, " ").trim().slice(0, 8000);

    return { success: true, output: text || "(no readable content found)" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error: `Fetch failed: ${msg}` };
  }
}

function dbQuery(args: Record<string, unknown>): ToolResult {
  const query = String(args.query || "");
  const dbPath = String(args.db_path || path.join(MEMORY_DIR, "agent.db"));

  if (!query) return { success: false, output: "", error: "query is required" };

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const db = new Database(dbPath);
    const stmt = db.prepare(query);
    const isSelect = query.trim().toUpperCase().startsWith("SELECT");

    if (isSelect) {
      const rows = stmt.all();
      if (rows.length === 0) return { success: true, output: "(no rows returned)" };
      const output = JSON.stringify(rows, null, 2);
      return { success: true, output: `${rows.length} rows:\n${output}` };
    } else {
      const info = stmt.run();
      return {
        success: true,
        output: `OK. changes: ${info.changes}, lastInsertRowid: ${info.lastInsertRowid}`,
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error: msg };
  }
}

function readSpreadsheet(args: Record<string, unknown>): ToolResult {
  const filePath = String(args.path || "");
  if (!filePath) return { success: false, output: "", error: "path is required" };
  if (!fs.existsSync(filePath))
    return { success: false, output: "", error: `File not found: ${filePath}` };

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const workbook = XLSX.readFile(filePath);
  const sheetName = String(args.sheet || workbook.SheetNames[0]);
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) return { success: false, output: "", error: `Sheet "${sheetName}" not found` };

  const data = XLSX.utils.sheet_to_json(sheet);
  return {
    success: true,
    output: `Sheet: ${sheetName} | ${data.length} rows\n${JSON.stringify(data.slice(0, 50), null, 2)}`,
  };
}

function writeSpreadsheet(args: Record<string, unknown>): ToolResult {
  const filePath = String(args.path || "");
  const rawData = String(args.data || "[]");
  const sheetName = String(args.sheet_name || "Sheet1");

  if (!filePath) return { success: false, output: "", error: "path is required" };

  let data: unknown[];
  try {
    data = JSON.parse(rawData);
    if (!Array.isArray(data)) throw new Error("data must be a JSON array");
  } catch (err) {
    return { success: false, output: "", error: `Invalid JSON data: ${err}` };
  }

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filePath);

  return { success: true, output: `Spreadsheet written: ${filePath} (${data.length} rows, sheet: ${sheetName})` };
}
