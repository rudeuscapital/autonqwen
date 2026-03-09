import { NextResponse } from "next/server";
import { getWallet } from "@/lib/session";

export async function GET() {
  const wallet = await getWallet();
  if (!wallet) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, wallet });
}
