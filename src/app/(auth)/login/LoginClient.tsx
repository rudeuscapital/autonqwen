"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { shortAddr } from "@/lib/utils";

const WALLETS = [
  { id: "metamask",     icon: "🦊", name: "MetaMask",          desc: "Browser extension · EVM chains",        bg: "rgba(246,133,27,.12)" },
  { id: "walletconnect",icon: "🔗", name: "WalletConnect v2",  desc: "Scan QR · any mobile wallet",           bg: "rgba(59,153,252,.12)" },
  { id: "coinbase",     icon: "💠", name: "Coinbase Wallet",   desc: "Self-custody · EVM",                    bg: "rgba(0,82,255,.12)" },
  { id: "phantom",      icon: "👻", name: "Phantom",           desc: "Solana + EVM multi-chain",              bg: "rgba(171,159,242,.12)" },
];

// Demo addresses for non-MetaMask wallets
const DEMO_ADDRS: Record<string, string> = {
  walletconnect: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  coinbase:      "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
  phantom:       "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
};

type Status = { type: "idle" | "loading" | "ok" | "err"; msg?: string };

export default function LoginClient() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualAddr, setManualAddr] = useState("");
  const [connectedAddr, setConnectedAddr] = useState<string | null>(null);

  async function saveSession(address: string) {
    const res = await fetch("/api/auth/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      throw new Error(data.error || "Server error");
    }
    return address;
  }

  async function handleWallet(id: string) {
    setConnecting(id);
    setStatus({ type: "loading", msg: `Connecting to ${id}…` });

    try {
      let address: string;

      if (id === "metamask") {
        if (typeof window !== "undefined" && (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum) {
          const eth = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
          const accounts = await eth.request({ method: "eth_requestAccounts" });
          address = accounts[0];
        } else {
          // Simulate for demo
          await new Promise((r) => setTimeout(r, 1400));
          address = "0xDe0B295669a9FD93d5F28D9Ec85E40f4cb697BAe";
        }
      } else {
        await new Promise((r) => setTimeout(r, 1600));
        address = DEMO_ADDRS[id];
      }

      await saveSession(address);
      setStatus({ type: "ok", msg: `✓ Connected: ${shortAddr(address)}` });
      setConnectedAddr(address);
    } catch (err) {
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Connection failed" });
    } finally {
      setConnecting(null);
    }
  }

  async function handleManual() {
    const addr = manualAddr.trim();
    if (addr.length < 26) {
      setStatus({ type: "err", msg: "Invalid address format" });
      return;
    }
    setStatus({ type: "loading", msg: "Verifying address…" });
    try {
      await saveSession(addr);
      setStatus({ type: "ok", msg: `✓ Verified: ${shortAddr(addr)}` });
      setConnectedAddr(addr);
    } catch (err) {
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Failed" });
    }
  }

  if (connectedAddr) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6 relative">
        <HexBackground />
        <div className="relative z-10 w-full max-w-md text-center bg-ink-2 border border-lime-agent/25 rounded-2xl p-12 shadow-[0_40px_100px_rgba(0,0,0,.7),0_0_32px_rgba(57,224,121,.06)] animate-scale-in">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 bg-gradient-to-br from-cyan-agent to-cyan-dim grid place-items-center text-4xl shadow-[0_0_0_8px_rgba(0,229,204,.1),0_0_32px_rgba(0,229,204,.25)]">
            🔐
          </div>
          <h2 className="font-display font-extrabold text-3xl tracking-tight mb-2">Wallet Verified!</h2>
          <p className="font-mono text-[12px] text-text-3 mb-5">{connectedAddr}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-agent/8 border border-lime-agent/25 text-lime-agent font-mono text-[11.5px] mb-8">
            <span className="w-2 h-2 rounded-full bg-lime-agent" />
            Authenticated · Session Active
          </div>
          <p className="text-text-2 text-sm leading-relaxed mb-8">
            Your wallet has been verified. You now have full access to AutonQwen.
          </p>
          <button onClick={() => router.push("/chat")}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-base bg-cyan-agent text-black hover:bg-cyan-bright transition-all hover:shadow-[0_6px_24px_rgba(0,229,204,.4)] hover:-translate-y-0.5 mb-3">
            ▶ Launch AutonQwen
          </button>
          <button onClick={async () => {
            await fetch("/api/auth/connect", { method: "DELETE" });
            setConnectedAddr(null);
            setStatus({ type: "idle" });
          }} className="w-full py-2.5 rounded-xl text-sm text-text-2 hover:text-text-1 hover:bg-ink-3 transition-all">
            Disconnect wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6 relative">
      <HexBackground />

      <div className="relative z-10 w-full max-w-[480px] bg-ink-2 border border-rim-2 rounded-2xl p-12 shadow-[0_40px_100px_rgba(0,0,0,.7)]">
        {/* Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-72 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(0,229,204,.08) 0%, transparent 70%)" }} />

        <div className="flex items-center justify-center gap-3 mb-10">
          <Image src="/logo.png" alt="AutonQwen" width={48} height={48} className="rounded-xl shadow-[0_0_24px_rgba(0,229,204,.4)]" />
          <span className="font-display font-extrabold text-xl">AutonQwen</span>
        </div>

        <h2 className="font-display font-extrabold text-2xl tracking-tight text-center mb-2">Connect your wallet</h2>
        <p className="text-text-2 text-sm text-center leading-relaxed mb-9">
          Your wallet is your key. No password, no email.<br />Connect once to access your sovereign AI agent.
        </p>

        <div className="flex flex-col gap-2.5">
          {WALLETS.map((w) => (
            <button key={w.id} onClick={() => handleWallet(w.id)}
              disabled={!!connecting}
              className={`flex items-center gap-3.5 p-4 rounded-xl bg-ink-3 border transition-all text-left w-full group disabled:cursor-not-allowed
                ${connecting === w.id ? "border-cyan-agent/50 animate-pulse-border" : "border-rim-2 hover:border-cyan-agent/25 hover:translate-x-0.5"}`}>
              <div className="w-10 h-10 rounded-xl grid place-items-center text-xl flex-shrink-0" style={{ background: w.bg }}>
                {connecting === w.id ? <span className="animate-spin-slow">⟳</span> : w.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text-1">{w.name}</div>
                <div className="text-[11.5px] text-text-3 mt-0.5">{w.desc}</div>
              </div>
              <span className="text-text-4 group-hover:text-cyan-agent transition-colors group-hover:translate-x-1 transition-transform">›</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 my-5 font-mono text-[10px] text-text-4 uppercase tracking-widest">
          <span className="flex-1 h-px bg-rim" />OR ENTER ADDRESS<span className="flex-1 h-px bg-rim" />
        </div>

        {showManual ? (
          <div className="flex flex-col gap-2.5 animate-fade-up">
            <div>
              <div className="font-mono text-[10px] text-text-3 uppercase tracking-widest mb-1.5">Wallet Address</div>
              <input
                className="w-full px-3.5 py-3 bg-ink-3 border border-rim-2 rounded-xl font-mono text-[13px] text-text-1 outline-none focus:border-cyan-agent transition-colors placeholder:text-text-4"
                placeholder="0x… or Solana address"
                value={manualAddr}
                onChange={(e) => setManualAddr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManual()}
              />
            </div>
            <button onClick={handleManual}
              className="w-full py-3 rounded-xl font-semibold text-sm border border-cyan-agent/35 text-cyan-agent hover:bg-cyan-agent/8 transition-all">
              → Verify & Connect
            </button>
          </div>
        ) : (
          <button onClick={() => setShowManual(true)}
            className="w-full py-2.5 rounded-xl text-sm text-text-2 hover:text-text-1 hover:bg-ink-3 border border-transparent hover:border-rim transition-all">
            Enter address manually
          </button>
        )}

        {status.type !== "idle" && (
          <div className={`mt-4 p-3.5 rounded-xl font-mono text-[12.5px] text-center animate-fade-up border
            ${status.type === "ok"      ? "bg-lime-agent/7 border-lime-agent/25 text-lime-agent"
            : status.type === "err"     ? "bg-rose-agent/7 border-rose-agent/25 text-rose-agent"
            : "bg-cyan-agent/5 border-cyan-agent/20 text-cyan-agent"}`}>
            {status.msg}
          </div>
        )}

        <p className="text-[12px] text-text-4 text-center mt-5 leading-relaxed">
          By connecting you agree to our Terms &amp; Privacy Policy.<br />
          <span className="text-text-3">No transaction will ever be initiated from this app.</span>
        </p>
      </div>
    </div>
  );
}

function HexBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.035]">
      <svg viewBox="0 0 1400 900" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hx" x="0" y="0" width="80" height="69.28" patternUnits="userSpaceOnUse">
            <polygon points="40,2 78,22 78,62 40,82 2,62 2,22" fill="none" stroke="#00e5cc" strokeWidth="0.8" />
            <polygon points="40,42 78,62 78,102 40,122 2,102 2,62" fill="none" stroke="#00e5cc" strokeWidth="0.8" />
            <polygon points="80,2 118,22 118,62 80,82 42,62 42,22" fill="none" stroke="#00e5cc" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="1400" height="900" fill="url(#hx)" />
      </svg>
    </div>
  );
}
