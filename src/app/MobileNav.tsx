"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  hasWallet: boolean;
  walletAddress?: string;
}

const navItems = ["Features", "How it works", "Stack", "Roadmap"];

export default function MobileNav({ hasWallet, walletAddress }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden w-8 h-8 rounded-lg grid place-items-center text-text-3 hover:text-text-1 hover:bg-ink-3 transition-all"
        aria-label="Toggle menu"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed top-14 right-0 w-64 max-h-[calc(100vh-3.5rem)] bg-ink-1 border-l border-b border-rim rounded-bl-2xl z-50 md:hidden overflow-y-auto animate-fade-up">
            <div className="p-4 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm text-text-2 hover:text-text-1 hover:bg-ink-3 transition-all"
                >
                  {item}
                </a>
              ))}

              <div className="border-t border-rim my-3" />

              {hasWallet && walletAddress && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-agent/8 border border-cyan-agent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-agent animate-blink-dot" />
                  <span className="font-mono text-xs text-cyan-agent">
                    {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                  </span>
                </div>
              )}

              <Link
                href="/docs"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm text-text-2 hover:text-text-1 hover:bg-ink-3 transition-all"
              >
                Docs
              </Link>

              <a
                href="https://x.com/autonqwen"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-text-2 hover:text-text-1 hover:bg-ink-3 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Follow on X
              </a>

              <Link
                href={hasWallet ? "/chat" : "/login"}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-agent text-black text-center hover:bg-cyan-bright transition-all mt-2"
              >
                {hasWallet ? "Launch Agent →" : "Connect Wallet"}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
