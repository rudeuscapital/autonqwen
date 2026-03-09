import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { UPLOAD_DIR } from "@/lib/paths";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = new Set([
  // Spreadsheets
  ".xlsx", ".xls", ".csv",
  // Documents
  ".txt", ".md", ".json", ".xml", ".yaml", ".yml",
  // Code
  ".py", ".js", ".ts", ".html", ".css", ".sql",
  // Data
  ".log", ".env.example", ".ini", ".toml", ".conf",
]);

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to parse upload: ${msg}` }, { status: 400 });
  }

  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  // Ensure upload dir exists and is writable
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    fs.accessSync(UPLOAD_DIR, fs.constants.W_OK);
  } catch {
    return NextResponse.json(
      { error: `Upload directory not writable: ${UPLOAD_DIR}` },
      { status: 500 }
    );
  }

  const uploaded: { name: string; path: string; size: number }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      errors.push(`${file.name}: unsupported file type (${ext})`);
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: file size exceeds 10MB limit`);
      continue;
    }

    // Generate unique filename to avoid collisions
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${timestamp}_${safeName}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    uploaded.push({
      name: file.name,
      path: filePath,
      size: file.size,
    });
  }

  return NextResponse.json({ uploaded, errors });
}

// GET: list uploaded files
export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    return NextResponse.json({ files: [] });
  }

  const items = fs.readdirSync(UPLOAD_DIR).map((name) => {
    const full = path.join(UPLOAD_DIR, name);
    const stat = fs.statSync(full);
    return {
      name: name.replace(/^\d+_/, ""), // Remove timestamp prefix for display
      path: full,
      size: stat.size,
      uploadedAt: stat.mtime.toISOString(),
    };
  });

  // Sort newest first
  items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return NextResponse.json({ files: items });
}
