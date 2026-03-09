import Link from "next/link";
import Image from "next/image";
import { getWallet } from "@/lib/session";

export default async function LandingPage() {
  const wallet = await getWallet();

  return (
    <div className="min-h-screen bg-ink overflow-x-hidden">
      {/* ── Animated glowing background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(0,229,204,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,204,.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 100%)",
          }}
        />

        {/* ── Glowing orbs ── */}
        {/* Large cyan glow — hero area */}
        <div className="glow-orb glow-orb--cyan w-[600px] h-[600px] -top-[10%] left-[20%]" />
        {/* Gold glow — left side */}
        <div className="glow-orb glow-orb--gold w-[500px] h-[500px] top-[25%] -left-[10%]" style={{ animationDelay: "-4s" }} />
        {/* Rose glow — right mid */}
        <div className="glow-orb glow-orb--rose w-[450px] h-[450px] top-[40%] right-[-5%]" style={{ animationDelay: "-8s" }} />
        {/* Lime glow — bottom left */}
        <div className="glow-orb glow-orb--lime w-[400px] h-[400px] bottom-[5%] left-[15%]" style={{ animationDelay: "-12s" }} />
        {/* Secondary cyan glow — bottom right, smaller */}
        <div className="glow-orb glow-orb--cyan w-[350px] h-[350px] bottom-[15%] right-[20%]" style={{ animationDelay: "-6s" }} />
        {/* Subtle gold center */}
        <div className="glow-orb glow-orb--gold w-[300px] h-[300px] top-[55%] left-[45%]" style={{ animationDelay: "-10s" }} />

        {/* ── Animated glow lines ── */}
        <div className="glow-line top-[30%] left-[5%] w-[40%]" style={{ animationDelay: "0s" }} />
        <div className="glow-line top-[60%] right-[5%] w-[35%]" style={{ animationDelay: "-3s" }} />
        <div className="glow-line top-[85%] left-[20%] w-[30%]" style={{ animationDelay: "-5s" }} />

        {/* ── Floating particles ── */}
        <div className="absolute top-[12%] left-[22%] w-1.5 h-1.5 rounded-full bg-cyan-agent/30 animate-float-1" style={{ animationDelay: "-2s" }} />
        <div className="absolute top-[28%] right-[18%] w-2 h-2 rounded-full bg-cyan-agent/20 animate-float-3" style={{ animationDelay: "-5s" }} />
        <div className="absolute top-[48%] left-[8%] w-1 h-1 rounded-full bg-gold-agent/35 animate-float-2" style={{ animationDelay: "-7s" }} />
        <div className="absolute top-[65%] right-[12%] w-1.5 h-1.5 rounded-full bg-rose-agent/20 animate-float-4" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-[75%] left-[55%] w-2 h-2 rounded-full bg-lime-agent/20 animate-float-1" style={{ animationDelay: "-9s" }} />
        <div className="absolute top-[18%] right-[35%] w-1 h-1 rounded-full bg-cyan-agent/40 animate-float-4" style={{ animationDelay: "-1s" }} />
        <div className="absolute top-[52%] left-[38%] w-1.5 h-1.5 rounded-full bg-gold-agent/25 animate-float-3" style={{ animationDelay: "-11s" }} />

        {/* ── Floating rings with glow ── */}
        <div className="absolute top-[20%] right-[15%] w-20 h-20 rounded-full border border-cyan-agent/8 shadow-[0_0_20px_rgba(0,229,204,.06)] animate-float-2" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-[55%] left-[10%] w-14 h-14 rounded-full border border-gold-agent/8 shadow-[0_0_16px_rgba(240,180,41,.05)] animate-float-3" style={{ animationDelay: "-7s" }} />
        <div className="absolute top-[38%] right-[25%] w-10 h-10 rounded-full border border-rose-agent/6 shadow-[0_0_12px_rgba(255,92,122,.04)] animate-float-1" style={{ animationDelay: "-5s" }} />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-8 gap-3 bg-ink/80 backdrop-blur-xl border-b border-rim/40">
        <div className="flex items-center gap-2.5 mr-6">
          <Image src="/logo.png" alt="AutonQwen" width={32} height={32} className="rounded-lg shadow-[0_0_14px_rgba(0,229,204,.4)]" />
          <span className="font-display font-extrabold text-base">AutonQwen</span>
        </div>
        <div className="flex gap-1">
          {["Features", "How it works", "Stack"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="px-3.5 py-1.5 rounded-lg text-sm text-text-2 hover:text-text-1 hover:bg-ink-3 transition-all">
              {item}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          {wallet ? (
            <Link href="/chat" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-agent/10 border border-cyan-agent/25 text-cyan-agent font-mono text-xs hover:bg-cyan-agent/15 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-agent animate-blink-dot" />
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </Link>
          ) : null}
          <Link href="/docs" className="px-4 py-2 rounded-lg text-sm font-semibold text-text-2 border border-rim hover:text-text-1 hover:bg-ink-3 hover:border-rim-2 transition-all">
            Docs
          </Link>
          <Link href={wallet ? "/chat" : "/login"}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-agent text-black hover:bg-cyan-bright transition-all shadow-[0_0_0_0] hover:shadow-[0_4px_20px_rgba(0,229,204,.35)]">
            {wallet ? "Launch Agent →" : "Connect Wallet"}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-36 pb-20 px-6 text-center flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center top, rgba(0,229,204,.06) 0%, transparent 65%)" }} />

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-agent/25 bg-cyan-agent/5 font-mono text-[11px] text-cyan-agent uppercase tracking-widest mb-8 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-agent animate-blink-dot" />
          Powered by Ollama · Qwen3.5 · Web3 Auth
        </div>

        <h1 className="font-display font-extrabold text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-[-0.03em] max-w-3xl animate-fade-up" style={{ animationDelay: "80ms" }}>
          Your{" "}
          <span className="bg-gradient-to-r from-cyan-agent to-cyan-dim bg-clip-text text-transparent">
            autonomous AI
          </span>{" "}
          agent is{" "}
          <span className="bg-gradient-to-r from-gold-agent to-amber-400 bg-clip-text text-transparent">
            ready to go
          </span>
        </h1>

        <p className="text-base md:text-lg text-text-2 leading-relaxed max-w-lg mt-6 animate-fade-up" style={{ animationDelay: "160ms" }}>
          A ready-to-use AI agent with full access — filesystem, terminal, web, and database. Just connect your wallet and start. No installation required.
        </p>

        <div className="flex gap-3.5 justify-center flex-wrap mt-10 animate-fade-up" style={{ animationDelay: "240ms" }}>
          <Link href={wallet ? "/chat" : "/login"}
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold bg-cyan-agent text-black hover:bg-cyan-bright transition-all shadow-[0_0_0_0] hover:shadow-[0_8px_32px_rgba(0,229,204,.4)] hover:-translate-y-0.5">
            ⚡ {wallet ? "Launch Agent" : "Connect Wallet & Launch"}
          </Link>
          <Link href="#features"
            className="px-7 py-3.5 rounded-xl text-sm font-semibold border border-cyan-agent/35 text-cyan-agent hover:bg-cyan-agent/7 transition-all">
            Explore Features →
          </Link>
        </div>

        <div className="flex gap-2 flex-wrap justify-center mt-7 animate-fade-up" style={{ animationDelay: "300ms" }}>
          {["🔒 Private", "🦙 Ollama", "⚡ Streaming", "🌐 Web3", "🛠️ 9 Tools", "🚀 Instant"].map((b) => (
            <span key={b} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-ink-3 border border-rim font-mono text-[10px] text-text-3">{b}</span>
          ))}
        </div>

        {/* Terminal */}
        <div className="mt-14 w-full max-w-xl bg-ink-2 border border-rim-2 rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.6)] animate-fade-up relative z-10" style={{ animationDelay: "360ms" }}>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-ink-3 border-b border-rim">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="flex-1 text-center font-mono text-[10px] text-text-3">AutonQwen Agent</span>
          </div>
          <div className="p-5 font-mono text-[12px] leading-[1.9] text-left">
            <p className="pl-3 text-text-3">🔐 Connect your wallet to continue...</p>
            <p className="pl-3 text-lime-agent">✔ Wallet 0x71C7...8976F verified</p>
            <p className="pl-3 text-lime-agent">✔ AutonQwen ready · 9 tools loaded</p>
            <p><span className="text-cyan-agent">›</span> <span className="text-text-1">Analyze Q1 2025 sales data and create a report</span></p>
            <p className="pl-3 text-gold-agent">🧠 Thinking... reading spreadsheet...</p>
            <p className="pl-3 text-lime-agent">✔ read_spreadsheet → 1,247 rows loaded</p>
            <p className="pl-3 text-gold-agent">🧠 Analyzing trends...</p>
            <p className="pl-3 text-lime-agent">✔ write_file → report_q1.md created</p>
            <p className="pl-3 text-lime-agent">✔ Task complete · 3 tool calls</p>
            <p><span className="text-cyan-agent">›</span> <span className="inline-block w-2 h-4 bg-cyan-agent align-middle animate-cursor" /></p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-4xl mx-auto px-6 pb-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 border border-rim rounded-2xl overflow-hidden">
          {[
            { n: "100%", l: "// secure & private" },
            { n: "9", l: "// built-in tools" },
            { n: "<1s", l: "// first token" },
            { n: "∞", l: "// conversations" },
          ].map((s, i) => (
            <div key={i} className="px-6 py-7 border-r border-b md:border-b-0 border-rim last:border-r-0 hover:bg-ink-3 transition-colors">
              <div className="font-display font-extrabold text-4xl bg-gradient-to-br from-cyan-agent to-cyan-dim bg-clip-text text-transparent">{s.n}</div>
              <div className="font-mono text-[11px] text-text-3 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-24 relative z-10">
        <p className="font-mono text-[10.5px] text-cyan-agent uppercase tracking-[.18em] mb-3">Capabilities</p>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight leading-tight mb-3">
          Everything your agent <em className="not-italic text-cyan-agent">needs</em>
        </h2>
        <p className="text-text-2 text-sm max-w-md mb-12">All tools are ready — file system, terminal, web, database. Start using them right away, no setup required.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="how-it-works">
          {[
            { icon: "🧠", title: "Agentic ReAct Loop", wide: true, desc: "Full ReAct loop — think, call tools, observe, iterate — for up to 10 cycles until the task is complete. Powered by Qwen3.5's native tool-calling API.", tag: "max 10 iterations" },
            { icon: "📁", title: "Full File System", desc: "Read, write, append, and list files. Auto-create directories. Manage files directly from chat.", tag: "read · write · list" },
            { icon: "💻", title: "Terminal Execution", desc: "Run shell commands, git, npm, python scripts. Safety filter automatically blocks dangerous commands.", tag: "run_command" },
            { icon: "🌐", title: "Web Search & Fetch", desc: "DuckDuckGo search without API keys. Scrape and parse any URL for real-time info.", tag: "web_search · fetch_url" },
            { icon: "🗄️", title: "SQLite + Excel", desc: "Full SQL queries on local SQLite. Read and generate .xlsx spreadsheets from structured data.", tag: "db_query · spreadsheet" },
            { icon: "🔐", title: "Web3 Wallet Auth", wide: true, desc: "Access is gated by your crypto wallet. MetaMask, WalletConnect, Coinbase Wallet, or Phantom. Your wallet address is your identity — no passwords, no email.", tag: "MetaMask · WalletConnect · Phantom" },
            { icon: "⚡", title: "Real-time SSE Stream", desc: "Watch the agent think and work in real time. Tool calls appear live as they execute.", tag: "Server-Sent Events" },
            { icon: "💾", title: "Persistent Memory", desc: "Conversation history and cross-session fact memory. Agent builds knowledge over time.", tag: "disk-persisted" },
            { icon: "🚀", title: "Next.js 14 SSR", desc: "Full-stack React with App Router. SSR pages, API routes, streaming — all in one process.", tag: "App Router · RSC" },
          ].map((f, i) => (
            <div key={i} className={`${f.wide ? "md:col-span-2" : ""} group relative bg-ink-2 border border-rim rounded-2xl p-6 hover:border-cyan-agent/25 hover:-translate-y-0.5 transition-all overflow-hidden`}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: "radial-gradient(circle at 0% 0%, rgba(0,229,204,.04) 0%, transparent 60%)" }} />
              <div className="w-10 h-10 rounded-xl bg-cyan-agent/8 border border-cyan-agent/15 grid place-items-center text-lg mb-4">{f.icon}</div>
              <div className="font-display font-bold text-[15px] mb-2">{f.title}</div>
              <p className="text-text-2 text-[13px] leading-relaxed">{f.desc}</p>
              <span className="inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full font-mono text-[10px] text-cyan-agent bg-cyan-agent/7 border border-cyan-agent/15">{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="stack" className="max-w-5xl mx-auto px-6 pb-24 relative z-10">
        <p className="font-mono text-[10.5px] text-cyan-agent uppercase tracking-[.18em] mb-3">How it works</p>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight leading-tight mb-14">
          Wallet to agent in <em className="not-italic text-cyan-agent">4 steps</em>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 relative">
          <div className="hidden md:block absolute top-7 left-[12%] right-[12%] h-px"
            style={{ background: "linear-gradient(90deg, transparent, #253348 20%, #00e5cc 50%, #253348 80%, transparent)" }} />
          {[
            { n: "01", h: "Connect Wallet", p: "Log in with MetaMask or any Web3 wallet. No email, no password. Your wallet address is your identity." },
            { n: "02", h: "Choose Model", p: "Select an available AI model — Qwen3.5 or others. Switch models anytime from the settings panel." },
            { n: "03", h: "Assign a Task", p: "Type your task in natural language. The agent will call tools, iterate, and display results in real-time." },
            { n: "04", h: "Watch Results", p: "The agent works autonomously. Monitor every step through live streaming in your browser." },
          ].map((s) => (
            <div key={s.n} className="group text-center px-3 md:px-5">
              <div className="w-12 h-12 rounded-full mx-auto mb-4 bg-ink-2 border border-rim-2 grid place-items-center font-mono text-sm text-cyan-agent relative z-10 transition-all group-hover:bg-cyan-agent group-hover:text-black group-hover:border-cyan-agent group-hover:shadow-[0_0_24px_rgba(0,229,204,.3)] group-hover:scale-110">
                  {s.n}
              </div>
              <div className="font-display font-bold text-sm mb-2">{s.h}</div>
              <p className="text-text-2 text-[12.5px] leading-relaxed">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section className="max-w-5xl mx-auto px-6 pb-24 text-center relative z-10">
        <p className="font-mono text-[10.5px] text-cyan-agent uppercase tracking-[.18em] mb-3">Tech Stack</p>
        <h2 className="font-display font-extrabold text-3xl tracking-tight mb-8">Built on <em className="not-italic text-cyan-agent">solid</em> foundations</h2>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {["🦙 Ollama", "🧠 Qwen3.5", "⚛️ Next.js 14", "⚡ React 18", "🟢 Node.js", "🐋 Docker", "🗄️ SQLite", "📊 xlsx", "🌐 Nginx", "🔐 ethers.js", "🔄 SSE", "🕸️ DuckDuckGo"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-2 border border-rim font-mono text-[11px] text-text-2 hover:border-cyan-agent/25 hover:text-text-1 hover:bg-ink-3 transition-all cursor-default">{t}</div>
          ))}
        </div>
      </section>

      {/* TOKEN / CONTRACT ADDRESS */}
      <section className="max-w-3xl mx-auto px-6 pb-24 relative z-10">
        <div className="rounded-2xl bg-ink-2 border border-gold-agent/15 p-8 md:p-10 text-center relative overflow-hidden">
          {/* Subtle gold glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at center, rgba(240,180,41,.04) 0%, transparent 65%)" }} />
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full animate-float-2 opacity-[0.04]"
            style={{ background: "radial-gradient(circle, #f0b429, transparent)" }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-agent/8 border border-gold-agent/20 font-mono text-[10px] text-gold-agent uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-agent animate-blink-dot" />
              Token
            </div>

            <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight mb-2">
              <span className="bg-gradient-to-r from-gold-agent to-amber-400 bg-clip-text text-transparent">$ATQWEN</span>
            </h2>
            <p className="text-text-2 text-sm mb-6 max-w-md mx-auto">
              The native token for the AutonQwen ecosystem. Contract address will be announced soon.
            </p>

            <div className="flex flex-col items-center gap-3">
              {/* Contract address placeholder */}
              <div className="w-full max-w-md flex items-center gap-3 px-5 py-3.5 rounded-xl bg-ink-3 border border-rim-2">
                <span className="font-mono text-[11px] text-text-3 whitespace-nowrap">CA:</span>
                <span className="flex-1 font-mono text-[13px] text-text-3 tracking-wider text-center">
                  Coming Soon
                </span>
              </div>

              {/* Info badges */}
              <div className="flex gap-2 flex-wrap justify-center mt-1">
                {["Ticker: $ATQWEN", "Network: TBA", "Supply: TBA"].map((b) => (
                  <span key={b} className="px-2.5 py-1 rounded-full bg-ink-3 border border-rim font-mono text-[10px] text-text-3">{b}</span>
                ))}
              </div>
            </div>

            {/* Coming soon pulse */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold-agent/20 bg-gold-agent/5 animate-pulse-border" style={{ animationDuration: "3s" }}>
              <span className="text-sm">🚀</span>
              <span className="font-mono text-[11px] text-gold-agent">Launch Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 mb-20 rounded-3xl bg-ink-2 border border-cyan-agent/15 p-12 md:p-16 text-center relative overflow-hidden z-10">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(0,229,204,.05) 0%, transparent 65%)" }} />
        {/* CTA floating shapes */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full animate-float-2 opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #00e5cc, transparent)" }} />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full animate-float-3 opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #f0b429, transparent)", animationDelay: "-5s" }} />
        <h2 className="relative font-display font-extrabold text-3xl md:text-4xl tracking-tight mb-3 leading-tight">
          Ready to use{" "}
          <span className="bg-gradient-to-r from-cyan-agent to-cyan-dim bg-clip-text text-transparent">your AI agent?</span>
        </h2>
        <p className="relative text-text-2 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          No per-token fees. Unlimited conversations — just connect your wallet and start.
        </p>
        <div className="relative flex gap-3 justify-center">
          <Link href={wallet ? "/chat" : "/login"}
            className="px-7 py-3.5 rounded-xl font-bold text-sm bg-cyan-agent text-black hover:bg-cyan-bright transition-all hover:shadow-[0_8px_32px_rgba(0,229,204,.4)] hover:-translate-y-0.5">
            {wallet ? "Launch Agent →" : "Connect Wallet — Free"}
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-rim px-8 md:px-12 py-8 flex items-center justify-between max-w-5xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="AutonQwen" width={24} height={24} className="rounded-md" />
          <span className="font-display font-extrabold text-sm">AutonQwen</span>
          <span className="font-mono text-[10px] text-text-3 ml-2 hidden md:inline">Autonomous AI Platform</span>
        </div>
        <div className="flex gap-5">
          {[["Home", "/"], ["Chat", "/chat"], ["Login", "/login"]].map(([label, href]) => (
            <Link key={label} href={href} className="text-xs text-text-2 hover:text-cyan-agent transition-colors">{label}</Link>
          ))}
        </div>
        <span className="font-mono text-[10px] text-text-4">© 2025 AutonQwen</span>
      </footer>
    </div>
  );
}
