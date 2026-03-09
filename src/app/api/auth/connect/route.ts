import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { address, chainId } = await req.json() as { address: string; chainId?: number };

    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }

    // Validate Ethereum address format OR Solana
    const isEVM = /^0x[a-fA-F0-9]{40}$/.test(address);
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);

    if (!isEVM && !isSolana) {
      return NextResponse.json({ error: "Invalid wallet address format" }, { status: 400 });
    }

    // Optional: check against allowlist
    const allowedWallets = process.env.ALLOWED_WALLETS;
    if (allowedWallets) {
      const allowed = allowedWallets.split(",").map((w) => w.trim().toLowerCase());
      if (!allowed.includes(address.toLowerCase())) {
        return NextResponse.json({ error: "Wallet not on allowlist" }, { status: 403 });
      }
    }

    const session = await getSession();
    session.wallet = {
      address,
      connectedAt: new Date().toISOString(),
      chainId,
    };
    await session.save();

    return NextResponse.json({
      success: true,
      address,
      connectedAt: session.wallet.connectedAt,
    });
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  session.wallet = undefined;
  await session.save();
  return NextResponse.json({ success: true });
}
