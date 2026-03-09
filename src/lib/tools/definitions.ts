import type { ToolDefinition } from "@/types";

export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a text file. For spreadsheets (.xlsx, .xls, .csv), use read_spreadsheet instead. Relative paths resolve to workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path (absolute or relative to workspace)" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write or append content to a file. Relative paths are saved in the workspace directory. Creates parent directories if needed.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path (absolute or relative to workspace)" },
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
      description: "List files and directories at a path, showing names, types, and sizes. Defaults to workspace directory.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path to list (default: workspace)", default: "." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Execute a shell command and return stdout/stderr. Runs in workspace directory by default. Dangerous commands are blocked.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to execute" },
          cwd: { type: "string", description: "Working directory (default: workspace)" },
          timeout: { type: "string", description: "Timeout in milliseconds (default: 30000)", default: "30000" },
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
      description: "Run a SQL query on a SQLite database. Database is stored in memory directory. Supports SELECT, INSERT, UPDATE, DELETE, CREATE.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "SQL query to execute" },
          db_path: { type: "string", description: "Path to SQLite database file (default: memory/agent.db)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_spreadsheet",
      description: "Read data from an Excel (.xlsx, .xls) or CSV file. Returns data as JSON rows. Use this for ALL spreadsheet files.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the spreadsheet file (use exact path from UPLOADED_FILE tag)" },
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
      description: "Create an Excel spreadsheet from JSON data array. Relative paths are saved in workspace.",
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
