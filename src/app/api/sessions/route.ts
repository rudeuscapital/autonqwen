import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { listSessions, createSession } from "@/lib/memory";

export async function GET() {
  try { await requireAuth(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  return NextResponse.json(listSessions());
}

export async function POST(req: NextRequest) {
  try { await requireAuth(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { model } = await req.json().catch(() => ({})) as { model?: string };
  const session = createSession(model);
  return NextResponse.json(session, { status: 201 });
}
