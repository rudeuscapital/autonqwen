import type { ToolDefinition } from "@/types";

export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file from the filesystem. Returns file content as text.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute or relative file path to read" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write or append content to a file. Creates parent directories if needed.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to write to" },
          content: { type: "string", description: "Text content to write" },
          append: { type: "string", description: "If 'true', append to file instead of overwriting", default: "false" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List files and directories at a path, showing names, types, and sizes.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path to list. Defaults to current directory.", default: "." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Execute a shell command and return stdout/stderr. Dangerous commands are blocked.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to execute" },
          cwd: { type: "string", description: "Working directory for the command", default: "." },
          timeout: { type: "string", description: "Timeout in milliseconds (default: 15000)", default: "15000" },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web using DuckDuckGo. Returns titles, snippets, and URLs.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          max_results: { type: "string", description: "Max results to return (default: 5)", default: "5" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description: "Fetch and extract text content from a URL. Optionally filter with CSS selector.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to fetch" },
          selector: { type: "string", description: "CSS selector to extract specific content (optional)" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "db_query",
      description: "Run a SQL query on a SQLite database file. Supports SELECT, INSERT, UPDATE, DELETE, CREATE.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "SQL query to execute" },
          db_path: { type: "string", description: "Path to SQLite database file", default: "./memory/agent.db" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_spreadsheet",
      description: "Read data from an Excel (.xlsx) or CSV file. Returns data as JSON.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the spreadsheet file" },
          sheet: { type: "string", description: "Sheet name to read (optional, defaults to first sheet)" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_spreadsheet",
      description: "Create an Excel spreadsheet from JSON data array.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Output file path (should end in .xlsx)" },
          data: { type: "string", description: "JSON stringified array of objects to write as rows" },
          sheet_name: { type: "string", description: "Sheet name (default: Sheet1)", default: "Sheet1" },
        },
        required: ["path", "data"],
      },
    },
  },
];
