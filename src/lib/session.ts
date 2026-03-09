import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { WalletSession } from "@/types";

export interface AppSession {
  wallet?: WalletSession;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "fallback-secret-change-in-production-32ch",
  cookieName: "aq_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<AppSession>(cookieStore, sessionOptions);
}

export async function getWallet(): Promise<WalletSession | null> {
  const session = await getSession();
  return session.wallet ?? null;
}

export async function requireAuth(): Promise<WalletSession> {
  const wallet = await getWallet();
  if (!wallet) {
    throw new Error("Unauthorized");
  }
  return wallet;
}
