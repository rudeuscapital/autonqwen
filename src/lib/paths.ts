import path from "path";

/**
 * Get the project root directory.
 * In standalone mode, server.js lives at .next/standalone/server.js
 * so __dirname-based resolution would be wrong.
 * We use the INSTALL_DIR env var, or fallback to process.cwd().
 */
function getProjectRoot(): string {
  // Explicitly set by setup.sh systemd service
  if (process.env.INSTALL_DIR) return process.env.INSTALL_DIR;

  // In development, process.cwd() is the project root
  if (process.env.NODE_ENV !== "production") return process.cwd();

  // In standalone production, detect by checking if cwd contains .next/standalone
  const cwd = process.cwd();
  const standaloneIdx = cwd.indexOf(path.join(".next", "standalone"));
  if (standaloneIdx !== -1) {
    return cwd.substring(0, standaloneIdx).replace(/[/\\]$/, "");
  }

  return cwd;
}

const PROJECT_ROOT = getProjectRoot();

/** Resolve a directory path — uses env var if absolute, else resolves from project root */
export function resolveDir(envVar: string | undefined, fallbackRelative: string): string {
  if (envVar && path.isAbsolute(envVar)) return envVar;
  return path.join(PROJECT_ROOT, fallbackRelative);
}

export const UPLOAD_DIR = resolveDir(process.env.UPLOAD_DIR, "uploads");
export const MEMORY_DIR = resolveDir(process.env.MEMORY_DIR, "memory");
