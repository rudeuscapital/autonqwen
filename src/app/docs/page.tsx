import Link from "next/link";
import Image from "next/image";
import { getWallet } from "@/lib/session";

const tools = [
  { icon: "📁", name: "read_file", desc: "Read file contents. Supports all text formats.", example: "Read the contents of config.json" },
  { icon: "✏️", name: "write_file", desc: "Write or overwrite a file. Auto-creates directories.", example: "Create a file hello.py with hello world" },
  { icon: "📂", name: "list_directory", desc: "List files and folders in a directory.", example: "Show all files in the /data folder" },
  { icon: "💻", name: "run_command", desc: "Run a shell command. Dangerous commands are automatically blocked.", example: "Run python script.py" },
  { icon: "🌐", name: "web_search", desc: "Web search via DuckDuckGo. No API key required.", example: "Search for the latest React hooks tutorial" },
  { icon: "🔗", name: "fetch_url", desc: "Fetch and parse content from a URL.", example: "Fetch data from https://api.example.com/data" },
  { icon: "🗄️", name: "db_query", desc: "Run SQL queries on a SQLite database.", example: "SELECT * FROM users LIMIT 10" },
  { icon: "📊", name: "read_spreadsheet", desc: "Read Excel (.xlsx) files into structured data.", example: "Read the first sheet of report.xlsx" },
  { icon: "📈", name: "write_spreadsheet", desc: "Create Excel (.xlsx) files from data.", example: "Create a spreadsheet from this sales data" },
];

const faqs = [
  { q: "Is it free?", a: "Yes, AutonQwen is free to use. Just connect your wallet to get started." },
  { q: "Which wallets are supported?", a: "MetaMask, WalletConnect, Coinbase Wallet, and Phantom. You can also enter a wallet address manually." },
  { q: "Which AI model is used?", a: "Currently using Qwen3.5 via Ollama. You can switch models from the settings panel on the chat page." },
  { q: "Is my data safe?", a: "Yes. All conversations are stored privately and linked to your wallet address. No data is shared with third parties." },
  { q: "Is there a conversation limit?", a: "No limits. You can run unlimited conversations." },
  { q: "What is the ReAct Loop?", a: "The agent uses a Think → Act → Observe pattern iteratively (up to 10 iterations) to complete complex tasks automatically." },
];

export default async function DocsPage() {
  const wallet = await getWallet();

  return (
    <div className="min-h-screen bg-ink">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-8 gap-3 bg-ink/80 backdrop-blur-xl border-b border-rim/40">
        <Link href="/" className="flex items-center gap-2.5 mr-6">
          <Image src="/logo.png" alt="AutonQwen" width={32} height={32} className="rounded-lg shadow-[0_0_14px_rgba(0,229,204,.4)]" />
          <span className="font-display font-extrabold text-base">AutonQwen</span>
        </Link>
        <div className="ml-auto flex items-center gap-2.5">
          {wallet ? (
            <Link href="/chat" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-agent/10 border border-cyan-agent/25 text-cyan-agent font-mono text-xs hover:bg-cyan-agent/15 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-agent animate-blink-dot" />
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </Link>
          ) : null}
          <Link href={wallet ? "/chat" : "/login"}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-agent text-black hover:bg-cyan-bright transition-all shadow-[0_0_0_0] hover:shadow-[0_4px_20px_rgba(0,229,204,.35)]">
            {wallet ? "Launch Agent →" : "Connect Wallet"}
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        {/* HEADER */}
        <div className="mb-16">
          <p className="font-mono text-[10.5px] text-cyan-agent uppercase tracking-[.18em] mb-4">Documentation</p>
          <h1 className="font-display font-extrabold text-5xl tracking-tight leading-tight mb-4">
            <span className="text-cyan-agent">AutonQwen</span> Guide
          </h1>
          <p className="text-text-2 text-lg leading-relaxed max-w-xl">
            Everything you need to know about using the AI agent — from connecting your wallet to completing complex tasks.
          </p>
        </div>

        {/* TABLE OF CONTENTS */}
        <div className="bg-ink-2 border border-rim rounded-2xl p-6 mb-16">
          <h3 className="font-display font-bold text-sm mb-4 text-text-2">Table of Contents</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["#getting-started", "Getting Started"],
              ["#tools", "Tools"],
              ["#tips", "Usage Tips"],
              ["#memory", "Memory & Context"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-2 hover:text-cyan-agent hover:bg-ink-3 transition-all">
                <span className="text-cyan-agent">→</span> {label}
              </a>
            ))}
          </div>
        </div>

        {/* GETTING STARTED */}
        <section id="getting-started" className="mb-20">
          <h2 className="font-display font-extrabold text-3xl tracking-tight mb-8">
            Getting <span className="text-cyan-agent">Started</span>
          </h2>
          <div className="space-y-4">
            {[
              { step: "01", title: "Connect Wallet", desc: "Click the \"Connect Wallet\" button on the homepage. Choose MetaMask, WalletConnect, Coinbase Wallet, or Phantom. You can also enter a wallet address manually." },
              { step: "02", title: "Enter Chat", desc: "Once your wallet is connected, you'll be redirected to the chat page. Here you can start interacting with the AI agent right away." },
              { step: "03", title: "Assign a Task", desc: "Type your task in natural language. The agent will automatically choose the right tools and execute them." },
            ].map((s) => (
              <div key={s.step} className="flex gap-5 p-5 bg-ink-2 border border-rim rounded-2xl hover:border-cyan-agent/25 transition-all">
                <div className="w-12 h-12 rounded-xl bg-cyan-agent/8 border border-cyan-agent/15 grid place-items-center font-mono text-sm text-cyan-agent flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base mb-1">{s.title}</h3>
                  <p className="text-text-2 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TOOLS */}
        <section id="tools" className="mb-20">
          <h2 className="font-display font-extrabold text-3xl tracking-tight mb-3">
            Available <span className="text-cyan-agent">Tools</span>
          </h2>
          <p className="text-text-2 text-sm mb-8">The agent has 9 built-in tools that are called automatically based on the task requirements.</p>

          <div className="space-y-3">
            {tools.map((t) => (
              <div key={t.name} className="group bg-ink-2 border border-rim rounded-2xl p-5 hover:border-cyan-agent/25 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-agent/8 border border-cyan-agent/15 grid place-items-center text-lg flex-shrink-0">
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-text-1">{t.name}</span>
                    </div>
                    <p className="text-text-2 text-sm leading-relaxed mb-2">{t.desc}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-text-3 uppercase tracking-wider">Example:</span>
                      <span className="font-mono text-[12px] text-cyan-agent/70 italic">&quot;{t.example}&quot;</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TIPS */}
        <section id="tips" className="mb-20">
          <h2 className="font-display font-extrabold text-3xl tracking-tight mb-8">
            Usage <span className="text-cyan-agent">Tips</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "💬", title: "Use natural language", desc: "No special format required. Just write commands as if you're speaking naturally." },
              { icon: "🎯", title: "Provide clear context", desc: "The more specific your instructions, the more accurate the results. Mention file names, output formats, or constraints." },
              { icon: "🔄", title: "Multi-step tasks", desc: "The agent can handle complex tasks that require multiple tools — e.g., read a file, analyze it, then create a report." },
              { icon: "📎", title: "Leverage spreadsheets", desc: "You can ask the agent to read Excel files, analyze data, and create new files — all from the chat." },
              { icon: "🛡️", title: "Safety filter active", desc: "Dangerous terminal commands (rm -rf, format, etc.) are automatically blocked. You can work without worry." },
              { icon: "🔍", title: "Real-time web search", desc: "The agent can search the internet for the latest information to answer questions or supplement your tasks." },
            ].map((tip) => (
              <div key={tip.title} className="p-5 bg-ink-2 border border-rim rounded-2xl hover:border-cyan-agent/25 transition-all">
                <div className="text-xl mb-3">{tip.icon}</div>
                <h3 className="font-display font-bold text-sm mb-1.5">{tip.title}</h3>
                <p className="text-text-2 text-[13px] leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MEMORY */}
        <section id="memory" className="mb-20">
          <h2 className="font-display font-extrabold text-3xl tracking-tight mb-8">
            Memory & <span className="text-cyan-agent">Context</span>
          </h2>
          <div className="space-y-4">
            <div className="p-6 bg-ink-2 border border-rim rounded-2xl">
              <h3 className="font-display font-bold text-base mb-2">Conversation History</h3>
              <p className="text-text-2 text-sm leading-relaxed">
                Each chat session has its own conversation history. The agent remembers context within the same session, so you can reference previous messages.
              </p>
            </div>
            <div className="p-6 bg-ink-2 border border-rim rounded-2xl">
              <h3 className="font-display font-bold text-base mb-2">Persistent Memory</h3>
              <p className="text-text-2 text-sm leading-relaxed">
                The agent can save important facts across sessions using the <code className="px-1.5 py-0.5 rounded bg-ink-3 border border-rim font-mono text-[12px] text-cyan-agent">[REMEMBER: key = value]</code> format. This memory persists between conversations and helps the agent understand your context better.
              </p>
            </div>
            <div className="p-6 bg-ink-2 border border-rim rounded-2xl">
              <h3 className="font-display font-bold text-base mb-2">Multi-Session</h3>
              <p className="text-text-2 text-sm leading-relaxed">
                You can create multiple chat sessions from the sidebar. Each session is independent and can be used for different topics.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mb-20">
          <h2 className="font-display font-extrabold text-3xl tracking-tight mb-8">
            Frequently Asked <span className="text-cyan-agent">Questions</span>
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="p-5 bg-ink-2 border border-rim rounded-2xl hover:border-cyan-agent/25 transition-all">
                <h3 className="font-display font-bold text-sm mb-2 text-text-1">{f.q}</h3>
                <p className="text-text-2 text-[13px] leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-ink-2 border border-cyan-agent/15 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(0,229,204,.05) 0%, transparent 65%)" }} />
          <h2 className="relative font-display font-extrabold text-3xl tracking-tight mb-3">
            Ready to try?
          </h2>
          <p className="relative text-text-2 text-sm mb-6">
            Connect your wallet and start using the AI agent now.
          </p>
          <Link href={wallet ? "/chat" : "/login"}
            className="relative inline-flex px-6 py-3 rounded-xl font-bold text-sm bg-cyan-agent text-black hover:bg-cyan-bright transition-all hover:shadow-[0_8px_32px_rgba(0,229,204,.4)]">
            {wallet ? "Launch Agent →" : "Connect Wallet — Free"}
          </Link>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-rim px-12 py-10 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="AutonQwen" width={28} height={28} className="rounded-lg" />
          <span className="font-display font-extrabold text-sm">AutonQwen</span>
          <span className="font-mono text-[10px] text-text-3 ml-3">Autonomous AI Platform</span>
        </div>
        <span className="font-mono text-[11px] text-text-4">&copy; 2025 AutonQwen</span>
      </footer>
    </div>
  );
}
