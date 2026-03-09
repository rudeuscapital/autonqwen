# AutonQwen — Sovereign AI on Your Infrastructure

Full-stack autonomous AI agent platform built with **Next.js 14 App Router (SSR)**, Ollama, and Web3 wallet authentication.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (RSC + SSR) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI Runtime | Ollama (Qwen3.5 / any model) |
| Auth | Web3 wallet (MetaMask, WalletConnect, Coinbase, Phantom) |
| Session | iron-session (httpOnly cookie) |
| Database | better-sqlite3 (tool) |
| Spreadsheet | xlsx (tool) |
| Streaming | Server-Sent Events (ReadableStream) |
| Deployment | Docker + Nginx |

## Architecture

```
Browser
  │
  ▼
Nginx :80/:443           ← reverse proxy, SSE buffering disabled
  │
  ▼
Next.js App :3000        ← SSR pages + /api/* routes + agent loop
  │
  ├── /                  ← Landing page (SSR, reads wallet from cookie)
  ├── /login             ← Wallet connect UI (client component)
  ├── /chat              ← Agent chat (SSR + streaming client)
  ├── /memory            ← Fact memory CRUD
  ├── /api/chat          ← POST → SSE stream (agent loop)
  ├── /api/auth/*        ← Wallet session
  ├── /api/sessions/*    ← Session CRUD
  ├── /api/memory/*      ← Fact CRUD
  ├── /api/uploads       ← File upload
  └── /api/health        ← Ollama status
  │
  ▼
Ollama :11434            ← LLM inference (local, private)
```

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start Ollama
ollama serve

# 3. Pull a model
ollama pull qwen3.5

# 4. Copy env (edit SESSION_SECRET!)
cp .env.local.example .env.local

# 5. Run
npm run dev
# → http://localhost:3000
```

## Docker Deployment (Production)

```bash
# 1. Set a secure session secret
export SESSION_SECRET=$(openssl rand -hex 32)

# 2. Start everything
docker compose up -d --build

# 3. Pull model into Ollama container
docker exec -it ollama ollama pull qwen3.5

# 4. Visit http://your-server-ip
# Connect wallet → Launch Agent
```

## SSL Setup

```bash
# Install certbot
sudo apt install certbot -y

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Uncomment HTTPS block in nginx.conf
# Uncomment cert volume in docker-compose.yml

# Restart nginx
docker compose restart nginx
```

## Agent Tools

| Tool | Description |
|---|---|
| `read_file` | Read file contents (max 50KB) |
| `write_file` | Write/append to file |
| `list_directory` | List files with sizes |
| `run_command` | Execute shell command (safety filtered) |
| `web_search` | DuckDuckGo search (no API key) |
| `fetch_url` | Fetch and parse URL content |
| `db_query` | SQL queries on SQLite |
| `read_spreadsheet` | Parse .xlsx / .csv |
| `write_spreadsheet` | Generate .xlsx files |

## Memory System

- **Conversation Memory**: Per-session message history, auto-trimmed at ~12k tokens
- **Fact Memory**: Cross-session key/value store. Agent saves facts using `[REMEMBER: key = value]` in responses. Accessible at `/memory`.

## License

MIT
