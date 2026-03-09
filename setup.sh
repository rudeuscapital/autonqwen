#!/usr/bin/env bash
# ============================================================
#  AutonQwen — VPS Setup Script
#  Tested on: Ubuntu 22.04 / 24.04, Debian 12
#  Usage:
#    chmod +x setup.sh && sudo ./setup.sh
# ============================================================

set -euo pipefail

# ─── Colors & helpers ────────────────────────────────────────
RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
BLU='\033[0;34m'
CYN='\033[0;36m'
WHT='\033[1;37m'
DIM='\033[2m'
RST='\033[0m'

BOLD='\033[1m'

INSTALL_DIR="/opt/autonqwen"
APP_USER="autonqwen"
LOG_FILE="/var/log/autonqwen-setup.log"

log()    { echo -e "${DIM}$(date '+%H:%M:%S')${RST}  $*" | tee -a "$LOG_FILE"; }
info()   { echo -e "${BLU}  ℹ${RST}  $*" | tee -a "$LOG_FILE"; }
ok()     { echo -e "${GRN}  ✔${RST}  $*" | tee -a "$LOG_FILE"; }
warn()   { echo -e "${YLW}  ⚠${RST}  $*" | tee -a "$LOG_FILE"; }
err()    { echo -e "${RED}  ✘${RST}  $*" | tee -a "$LOG_FILE"; }
die()    { err "$*"; exit 1; }
section(){ echo -e "\n${BOLD}${CYN}══ $* ${RST}${DIM}$(printf '═%.0s' {1..40})${RST}" | tee -a "$LOG_FILE"; echo; }
sep()    { echo -e "${DIM}────────────────────────────────────────────────────${RST}"; }

# ─── Banner ──────────────────────────────────────────────────
banner() {
cat << 'EOF'

  ██████╗ ██╗     ██╗      █████╗ ███╗   ███╗ █████╗
 ██╔═══██╗██║     ██║     ██╔══██╗████╗ ████║██╔══██╗
 ██║   ██║██║     ██║     ███████║██╔████╔██║███████║
 ██║   ██║██║     ██║     ██╔══██║██║╚██╔╝██║██╔══██║
 ╚██████╔╝███████╗███████╗██║  ██║██║ ╚═╝ ██║██║  ██║
  ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝

  █████╗  ██████╗ ███████╗███╗   ██╗████████╗
 ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
 ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
 ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
 ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
 ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝

EOF
  echo -e "  ${CYN}Sovereign AI on Your Infrastructure${RST}"
  echo -e "  ${DIM}Next.js 14 · Ollama · Web3 Auth · Docker${RST}"
  echo
  sep
}

# ─── Pre-flight checks ────────────────────────────────────────
preflight() {
  section "Pre-flight Checks"

  # Root check
  if [[ $EUID -ne 0 ]]; then
    die "This script must be run as root. Use: sudo ./setup.sh"
  fi
  ok "Running as root"

  # OS check
  if [[ -f /etc/os-release ]]; then
    source /etc/os-release
    info "Detected OS: ${PRETTY_NAME}"
    case "$ID" in
      ubuntu|debian|linuxmint|pop) ok "Supported OS: $ID" ;;
      *) warn "Untested OS: $ID — continuing anyway" ;;
    esac
  fi

  # Architecture
  ARCH=$(uname -m)
  info "Architecture: $ARCH"
  case "$ARCH" in
    x86_64|aarch64) ok "Supported architecture: $ARCH" ;;
    *) warn "Untested architecture: $ARCH" ;;
  esac

  # RAM check
  TOTAL_RAM_MB=$(awk '/MemTotal/ {printf "%.0f", $2/1024}' /proc/meminfo)
  info "Total RAM: ${TOTAL_RAM_MB}MB"
  if (( TOTAL_RAM_MB < 6000 )); then
    warn "Less than 6GB RAM detected. Qwen3.5:7b needs ~6GB. Consider a smaller model."
  elif (( TOTAL_RAM_MB >= 14000 )); then
    ok "RAM: ${TOTAL_RAM_MB}MB — suitable for qwen3.5:14b"
  else
    ok "RAM: ${TOTAL_RAM_MB}MB — suitable for qwen3.5:7b"
  fi

  # Disk check
  FREE_DISK_GB=$(df / --output=avail -BG | tail -1 | tr -d 'G ')
  info "Free disk: ${FREE_DISK_GB}GB"
  if (( FREE_DISK_GB < 15 )); then
    warn "Less than 15GB free. Models are 4–20GB each. May run out of space."
  else
    ok "Disk space: ${FREE_DISK_GB}GB free"
  fi

  # Internet
  if curl -sf --max-time 5 https://registry.npmjs.org/ > /dev/null 2>&1; then
    ok "Internet connectivity: OK"
  else
    die "No internet access. Cannot download dependencies."
  fi

  echo
}

# ─── Interactive config ───────────────────────────────────────
configure() {
  section "Configuration"

  # Domain
  echo -e "${WHT}Enter your domain name or server IP${RST}"
  echo -e "${DIM}(e.g. myagent.com or 192.168.1.100)${RST}"
  read -rp "  Domain/IP: " DOMAIN
  DOMAIN="${DOMAIN:-localhost}"
  ok "Domain: $DOMAIN"

  # Model selection
  echo
  echo -e "${WHT}Select AI model to install:${RST}"
  echo -e "  ${CYN}1${RST}) qwen3.5        ~4GB  — Fast, great for most tasks"
  echo -e "  ${CYN}2${RST}) qwen3.5:7b     ~5GB  — Slightly larger variant"
  echo -e "  ${CYN}3${RST}) qwen3.5:14b    ~9GB  — Better quality (needs 16GB RAM)"
  echo -e "  ${CYN}4${RST}) qwen3:8b       ~5GB  — Qwen3 8B, excellent tool calling"
  echo -e "  ${CYN}5${RST}) llama3.2:3b    ~2GB  — Ultra-light (low RAM servers)"
  echo -e "  ${CYN}6${RST}) Skip           — Pull model manually later"
  read -rp "  Choice [1]: " MODEL_CHOICE
  MODEL_CHOICE="${MODEL_CHOICE:-1}"

  case "$MODEL_CHOICE" in
    1) OLLAMA_MODEL="qwen3.5"    ;;
    2) OLLAMA_MODEL="qwen3.5:7b" ;;
    3) OLLAMA_MODEL="qwen3.5:14b";;
    4) OLLAMA_MODEL="qwen3:8b"   ;;
    5) OLLAMA_MODEL="llama3.2:3b";;
    6) OLLAMA_MODEL=""           ;;
    *) OLLAMA_MODEL="qwen3.5"    ;;
  esac
  [[ -n "$OLLAMA_MODEL" ]] && ok "Model: $OLLAMA_MODEL" || info "Model: will skip (pull manually)"

  # SSL
  echo
  echo -e "${WHT}Enable SSL with Let's Encrypt?${RST}"
  echo -e "${DIM}(Requires a real domain pointing to this server)${RST}"
  read -rp "  Enable SSL? [y/N]: " ENABLE_SSL
  ENABLE_SSL="${ENABLE_SSL:-n}"
  [[ "${ENABLE_SSL,,}" == "y" ]] && ok "SSL: enabled" || info "SSL: disabled (HTTP only)"

  # Email for certbot
  if [[ "${ENABLE_SSL,,}" == "y" ]]; then
    read -rp "  Email for SSL certificate: " SSL_EMAIL
    SSL_EMAIL="${SSL_EMAIL:-admin@${DOMAIN}}"
    ok "SSL email: $SSL_EMAIL"
  fi

  # Port
  echo
  read -rp "  App port (leave blank for 3000): " APP_PORT
  APP_PORT="${APP_PORT:-3000}"
  ok "App port: $APP_PORT"

  # Generate session secret
  SESSION_SECRET=$(openssl rand -hex 32)
  ok "Session secret: generated (32 bytes hex)"

  echo
  sep
  echo -e "${WHT}Summary:${RST}"
  echo -e "  Install dir : ${CYN}$INSTALL_DIR${RST}"
  echo -e "  Domain      : ${CYN}$DOMAIN${RST}"
  echo -e "  Model       : ${CYN}${OLLAMA_MODEL:-skipped}${RST}"
  echo -e "  SSL         : ${CYN}${ENABLE_SSL}${RST}"
  echo -e "  App port    : ${CYN}$APP_PORT${RST}"
  sep
  echo
  read -rp "  Proceed with installation? [Y/n]: " CONFIRM
  CONFIRM="${CONFIRM:-y}"
  [[ "${CONFIRM,,}" != "y" ]] && die "Aborted by user."
  echo
}

# ─── System packages ─────────────────────────────────────────
install_system_deps() {
  section "System Dependencies"

  info "Updating package lists…"
  apt-get update -qq 2>&1 | tail -1

  PACKAGES=(
    curl wget git unzip build-essential
    ca-certificates gnupg lsb-release
    python3 make g++
  )

  info "Installing packages: ${PACKAGES[*]}"
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${PACKAGES[@]}" >> "$LOG_FILE" 2>&1
  ok "System packages installed"
}

# ─── Docker ──────────────────────────────────────────────────
install_docker() {
  section "Docker"

  if command -v docker &>/dev/null; then
    DOCKER_VER=$(docker --version | awk '{print $3}' | tr -d ',')
    ok "Docker already installed: $DOCKER_VER"
    return
  fi

  info "Installing Docker…"
  curl -fsSL https://get.docker.com | sh >> "$LOG_FILE" 2>&1
  ok "Docker installed: $(docker --version | awk '{print $3}' | tr -d ',')"

  # Start and enable
  systemctl enable docker >> "$LOG_FILE" 2>&1
  systemctl start docker
  ok "Docker service started and enabled"

  # Add current user if not root-only
  if [[ -n "${SUDO_USER:-}" ]]; then
    usermod -aG docker "$SUDO_USER"
    ok "Added $SUDO_USER to docker group"
  fi
}

# ─── Docker Compose ──────────────────────────────────────────
install_compose() {
  section "Docker Compose"

  if docker compose version &>/dev/null 2>&1; then
    ok "Docker Compose (plugin): $(docker compose version --short)"
    return
  fi

  if command -v docker-compose &>/dev/null; then
    ok "docker-compose: $(docker-compose --version | awk '{print $3}' | tr -d ',')"
    return
  fi

  info "Installing Docker Compose plugin…"
  COMPOSE_URL="https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)"
  curl -fsSL "$COMPOSE_URL" -o /usr/local/bin/docker-compose >> "$LOG_FILE" 2>&1
  chmod +x /usr/local/bin/docker-compose
  ok "docker-compose: $(docker-compose --version | awk '{print $3}' | tr -d ',')"
}

# ─── Ollama ──────────────────────────────────────────────────
install_ollama() {
  section "Ollama"

  if command -v ollama &>/dev/null; then
    ok "Ollama already installed: $(ollama --version 2>/dev/null || echo 'version unknown')"
  else
    info "Installing Ollama…"
    curl -fsSL https://ollama.com/install.sh | sh >> "$LOG_FILE" 2>&1
    ok "Ollama installed"
  fi

  # Start Ollama service
  if systemctl is-active --quiet ollama 2>/dev/null; then
    ok "Ollama service already running"
  else
    info "Starting Ollama service…"
    systemctl enable ollama >> "$LOG_FILE" 2>&1 || true
    systemctl start ollama >> "$LOG_FILE" 2>&1 || (ollama serve &>/dev/null & sleep 2)
    sleep 2
    ok "Ollama service started"
  fi

  # Pull model
  if [[ -n "$OLLAMA_MODEL" ]]; then
    info "Pulling model: $OLLAMA_MODEL (this may take a while…)"
    echo -e "  ${DIM}Downloading model weights — coffee time ☕${RST}"
    if ollama pull "$OLLAMA_MODEL" 2>&1 | tee -a "$LOG_FILE" | grep -E "(pulling|success|Error)" | tail -5; then
      ok "Model pulled: $OLLAMA_MODEL"
    else
      warn "Model pull may have issues — check 'ollama list' after setup"
    fi
  fi
}

# ─── Node.js ─────────────────────────────────────────────────
install_node() {
  section "Node.js"

  if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VER" | tr -d 'v' | cut -d. -f1)
    if (( NODE_MAJOR >= 18 )); then
      ok "Node.js already installed: $NODE_VER"
      return
    else
      warn "Node.js $NODE_VER found but need v18+. Upgrading…"
    fi
  fi

  info "Installing Node.js 22 LTS via NodeSource…"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >> "$LOG_FILE" 2>&1
  DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs >> "$LOG_FILE" 2>&1
  ok "Node.js installed: $(node --version)"
  ok "npm installed: $(npm --version)"
}

# ─── Nginx ───────────────────────────────────────────────────
install_nginx() {
  section "Nginx"

  if command -v nginx &>/dev/null; then
    ok "Nginx already installed: $(nginx -v 2>&1 | awk '{print $3}')"
    return
  fi

  info "Installing Nginx…"
  DEBIAN_FRONTEND=noninteractive apt-get install -y nginx >> "$LOG_FILE" 2>&1
  systemctl enable nginx >> "$LOG_FILE" 2>&1
  ok "Nginx installed and enabled"
}

# ─── Deploy App ───────────────────────────────────────────────
deploy_app() {
  section "Deploying AutonQwen"

  # Determine script's own directory (where setup.sh lives = project root)
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  info "Source directory: $SCRIPT_DIR"

  # Create install directory
  mkdir -p "$INSTALL_DIR"

  # Copy source files (exclude heavy/transient dirs)
  info "Copying project files to $INSTALL_DIR…"
  rsync -a \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='memory' \
    --exclude='uploads' \
    --exclude='*.log' \
    "$SCRIPT_DIR/" "$INSTALL_DIR/"
  ok "Files copied to $INSTALL_DIR"

  # Create runtime directories with correct permissions
  mkdir -p "$INSTALL_DIR/memory" "$INSTALL_DIR/uploads" "$INSTALL_DIR/public"

  # Create app user if not exists
  if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$INSTALL_DIR" -M "$APP_USER"
    ok "Created system user: $APP_USER"
  else
    ok "System user already exists: $APP_USER"
  fi

  chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR"
  ok "Permissions set for $APP_USER"

  # Write .env.local
  info "Writing environment configuration…"
  cat > "$INSTALL_DIR/.env.local" << EOF
# AutonQwen Environment — generated by setup.sh on $(date)
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=${OLLAMA_MODEL:-qwen3.5}
SESSION_SECRET=${SESSION_SECRET}
MEMORY_DIR=${INSTALL_DIR}/memory
UPLOAD_DIR=${INSTALL_DIR}/uploads
EOF
  chown "$APP_USER:$APP_USER" "$INSTALL_DIR/.env.local"
  chmod 600 "$INSTALL_DIR/.env.local"
  ok ".env.local written (SESSION_SECRET set)"

  # Install npm dependencies
  info "Installing npm dependencies (this takes a few minutes…)"
  cd "$INSTALL_DIR"
  sudo -u "$APP_USER" npm install --prefer-offline 2>&1 | tee -a "$LOG_FILE" | tail -3
  ok "npm dependencies installed"

  # Build Next.js
  info "Building Next.js application…"
  sudo -u "$APP_USER" npm run build 2>&1 | tee -a "$LOG_FILE" | tail -10
  ok "Next.js build complete"
}

# ─── Systemd service ─────────────────────────────────────────
setup_service() {
  section "Systemd Service"

  cat > /etc/systemd/system/autonqwen.service << EOF
[Unit]
Description=AutonQwen — Sovereign AI Agent (Next.js)
Documentation=https://github.com/your-org/autonqwen
After=network.target ollama.service
Wants=ollama.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${INSTALL_DIR}/.env.local
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node ${INSTALL_DIR}/.next/standalone/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=autonqwen

# Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=${INSTALL_DIR}/memory ${INSTALL_DIR}/uploads
ProtectHome=yes

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl restart autonqwen
  systemctl restart autonqwen
  sleep 2

  if systemctl restart autonqwen; then
    ok "autonqwen service started and enabled"
  else
    warn "Service may have issues. Check: journalctl -u autonqwen -n 30"
  fi
}

# ─── Nginx config ─────────────────────────────────────────────
setup_nginx() {
  section "Nginx Configuration"

  NGINX_CONF="/etc/nginx/sites-available/autonqwen"

  cat > "$NGINX_CONF" << NGINXEOF
# AutonQwen Nginx config — generated by setup.sh

upstream autonqwen_app {
    server 127.0.0.1:${APP_PORT};
    keepalive 64;
}

server {
    listen 80;
    server_name ${DOMAIN};

    client_max_body_size 20M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SSE endpoint — disable ALL buffering
    location /api/chat {
        proxy_pass http://autonqwen_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
        chunked_transfer_encoding on;
        add_header X-Accel-Buffering no;
    }

    # Next.js static files — long cache
    location /_next/static/ {
        proxy_pass http://autonqwen_app;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Everything else
    location / {
        proxy_pass http://autonqwen_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

  # Enable site
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/autonqwen
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

  nginx -t >> "$LOG_FILE" 2>&1 && ok "Nginx config valid"
  systemctl reload nginx
  ok "Nginx reloaded with new config"
}

# ─── SSL with certbot ─────────────────────────────────────────
setup_ssl() {
  if [[ "${ENABLE_SSL,,}" != "y" ]]; then
    return
  fi

  section "SSL Certificate (Let's Encrypt)"

  if ! command -v certbot &>/dev/null; then
    info "Installing certbot…"
    DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
    ok "certbot installed"
  fi

  info "Obtaining certificate for: $DOMAIN"
  if certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "$SSL_EMAIL" \
    --domains "$DOMAIN" \
    --redirect \
    >> "$LOG_FILE" 2>&1; then
    ok "SSL certificate obtained and Nginx updated"
  else
    warn "certbot failed — site running on HTTP only. Check DNS and try:"
    warn "  certbot --nginx -d $DOMAIN"
  fi

  # Auto-renewal via cron
  if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
    ok "certbot auto-renewal cron added"
  fi
}

# ─── Firewall ─────────────────────────────────────────────────
setup_firewall() {
  section "Firewall"

  if command -v ufw &>/dev/null; then
    ufw allow ssh    >> "$LOG_FILE" 2>&1 || true
    ufw allow 80/tcp >> "$LOG_FILE" 2>&1 || true
    ufw allow 443/tcp>> "$LOG_FILE" 2>&1 || true

    # Block direct access to app port from outside
    ufw deny "$APP_PORT" >> "$LOG_FILE" 2>&1 || true

    if ufw status | grep -q "Status: active"; then
      ok "UFW rules updated (SSH, 80, 443 open; $APP_PORT blocked externally)"
    else
      info "UFW installed but not active. Enable with: ufw enable"
    fi
  else
    warn "UFW not found — skipping firewall setup. Manually open ports 80 and 443."
  fi
}

# ─── Management scripts ───────────────────────────────────────
create_manage_scripts() {
  section "Management Scripts"

  # Main management script
  cat > /usr/local/bin/aq << 'MGMT'
#!/usr/bin/env bash
# AutonQwen management tool

INSTALL_DIR="/opt/autonqwen"
APP_USER="autonqwen"
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'; CYN='\033[0;36m'; RST='\033[0m'; BOLD='\033[1m'

ok()  { echo -e "${GRN}✔${RST} $*"; }
err() { echo -e "${RED}✘${RST} $*"; }
inf() { echo -e "${CYN}ℹ${RST} $*"; }

usage() {
  echo -e "\n${BOLD}AutonQwen Management Tool${RST}"
  echo -e "${CYN}Usage:${RST} aq <command>\n"
  echo -e "  ${BOLD}Service:${RST}"
  echo -e "  start       Start the app"
  echo -e "  stop        Stop the app"
  echo -e "  restart     Restart the app"
  echo -e "  status      Show status of all services"
  echo -e "  logs        Tail live app logs"
  echo -e ""
  echo -e "  ${BOLD}Ollama:${RST}"
  echo -e "  models      List installed models"
  echo -e "  pull <mdl>  Pull a new model"
  echo -e "  chat <mdl>  Chat with a model in terminal"
  echo -e ""
  echo -e "  ${BOLD}Deploy:${RST}"
  echo -e "  deploy      Rebuild and restart after source changes"
  echo -e "  update      Git pull + rebuild (if using git)"
  echo -e ""
  echo -e "  ${BOLD}Data:${RST}"
  echo -e "  memory      Show saved agent facts"
  echo -e "  sessions    List saved sessions"
  echo -e "  backup      Backup memory + uploads to /tmp/aq-backup-DATE.tar.gz"
  echo -e "  restore <f> Restore from backup file"
  echo
}

cmd="${1:-help}"

case "$cmd" in

  start)
    systemctl restart autonqwen && ok "AutonQwen started"
    ;;

  stop)
    systemctl restart autonqwen && ok "AutonQwen stopped"
    ;;

  restart)
    systemctl restart autonqwen && ok "AutonQwen restarted"
    ;;

  status)
    echo
    echo -e "${BOLD}── App Service ────────────────────────────────${RST}"
    systemctl restart autonqwen --no-pager -l | head -20
    echo
    echo -e "${BOLD}── Ollama Service ─────────────────────────────${RST}"
    systemctl status ollama --no-pager -l | head -10
    echo
    echo -e "${BOLD}── Nginx ──────────────────────────────────────${RST}"
    systemctl status nginx --no-pager | head -8
    echo
    # Quick health check
    if curl -sf http://localhost:3000/api/health > /tmp/aq_health.json 2>/dev/null; then
      OLLAMA_ST=$(python3 -c "import json,sys; d=json.load(open('/tmp/aq_health.json')); print(d.get('ollama','?'))" 2>/dev/null || echo "?")
      MODELS=$(python3 -c "import json,sys; d=json.load(open('/tmp/aq_health.json')); print(', '.join(d.get('models',[])) or 'none')" 2>/dev/null || echo "?")
      echo -e "${BOLD}── Health Check ───────────────────────────────${RST}"
      echo -e "  App API  : ${GRN}online${RST}"
      echo -e "  Ollama   : ${OLLAMA_ST}"
      echo -e "  Models   : ${MODELS}"
    else
      echo -e "  App API  : ${RED}offline or starting up${RST}"
    fi
    echo
    ;;

  logs)
    journalctl -u autonqwen -f --no-pager
    ;;

  logs-nginx)
    journalctl -u nginx -f --no-pager
    ;;

  models)
    echo -e "\n${BOLD}Installed Ollama models:${RST}"
    ollama list
    ;;

  pull)
    MODEL="${2:?Usage: aq pull <model-name>}"
    inf "Pulling $MODEL…"
    ollama pull "$MODEL"
    ok "Done: $MODEL"
    ;;

  chat)
    MODEL="${2:-qwen3.5}"
    ollama run "$MODEL"
    ;;

  deploy)
    inf "Rebuilding AutonQwen…"
    cd "$INSTALL_DIR"
    sudo -u "$APP_USER" npm run build && \
    systemctl restart autonqwen && \
    ok "Deploy complete. Check: aq status"
    ;;

  update)
    inf "Pulling latest code…"
    cd "$INSTALL_DIR"
    git pull && \
    sudo -u "$APP_USER" npm install && \
    sudo -u "$APP_USER" npm run build && \
    systemctl restart autonqwen && \
    ok "Update complete"
    ;;

  memory)
    FACTS_FILE="$INSTALL_DIR/memory/facts.json"
    if [[ -f "$FACTS_FILE" ]]; then
      echo -e "\n${BOLD}Agent Facts:${RST}"
      python3 -c "
import json
with open('$FACTS_FILE') as f:
    facts = json.load(f)
if not facts:
    print('  (no facts saved yet)')
else:
    for k, v in facts.items():
        print(f'  \033[0;36m{k}\033[0m = {v}')
"
    else
      inf "No facts file found yet."
    fi
    ;;

  sessions)
    SESS_DIR="$INSTALL_DIR/memory/sessions"
    if [[ -d "$SESS_DIR" ]]; then
      COUNT=$(ls "$SESS_DIR"/*.json 2>/dev/null | wc -l)
      echo -e "\n${BOLD}Saved Sessions: ${COUNT}${RST}"
      for f in "$SESS_DIR"/*.json; do
        [[ -f "$f" ]] || continue
        python3 -c "
import json, os
with open('$f') as fp:
    d = json.load(fp)
msgs = len([m for m in d.get('messages',[]) if m.get('role') in ('user','assistant')])
print(f\"  {d.get('id','?')[:20]}  |  {d.get('title','?')[:40]}  |  {msgs} msgs  |  {d.get('updatedAt','?')[:16]}\")
" 2>/dev/null
      done
    else
      inf "No sessions directory yet."
    fi
    echo
    ;;

  backup)
    STAMP=$(date +%Y%m%d-%H%M%S)
    OUT="/tmp/aq-backup-${STAMP}.tar.gz"
    tar -czf "$OUT" -C "$INSTALL_DIR" memory uploads .env.local 2>/dev/null || true
    ok "Backup saved: $OUT ($(du -sh "$OUT" | cut -f1))"
    ;;

  restore)
    FILE="${2:?Usage: aq restore <backup-file>}"
    [[ -f "$FILE" ]] || { err "File not found: $FILE"; exit 1; }
    inf "Restoring from $FILE…"
    tar -xzf "$FILE" -C "$INSTALL_DIR"
    chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR/memory" "$INSTALL_DIR/uploads"
    systemctl restart autonqwen
    ok "Restore complete"
    ;;

  help|--help|-h|"")
    usage
    ;;

  *)
    err "Unknown command: $cmd"
    usage
    exit 1
    ;;
esac
MGMT

  chmod +x /usr/local/bin/aq
  ok "Management script installed: 'aq' command available globally"
}

# ─── Health check ─────────────────────────────────────────────
final_check() {
  section "Final Health Check"

  info "Waiting for app to be ready…"
  for i in {1..15}; do
    if curl -sf "http://127.0.0.1:${APP_PORT}/api/health" > /tmp/aq_final_health.json 2>/dev/null; then
      ok "App API responding on port $APP_PORT"
      break
    fi
    sleep 2
    [[ $i -eq 15 ]] && warn "App not responding yet — may still be starting"
  done

  echo
}

# ─── Summary ─────────────────────────────────────────────────
print_summary() {
  PROTOCOL="http"
  [[ "${ENABLE_SSL,,}" == "y" ]] && PROTOCOL="https"
  APP_URL="${PROTOCOL}://${DOMAIN}"

  echo
  echo -e "${GRN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║            🎉  SETUP COMPLETE!                       ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${RST}"

  echo -e "${WHT}  Your AutonQwen is ready:${RST}"
  echo
  echo -e "  🌐  URL             ${CYN}${APP_URL}${RST}"
  echo -e "  📁  Install dir     ${CYN}${INSTALL_DIR}${RST}"
  echo -e "  🦙  Model           ${CYN}${OLLAMA_MODEL:-not pulled yet}${RST}"
  echo -e "  📋  Setup log       ${CYN}${LOG_FILE}${RST}"
  echo
  sep
  echo -e "${WHT}  Quick commands:${RST}"
  echo
  echo -e "  ${CYN}aq status${RST}          — check all services"
  echo -e "  ${CYN}aq logs${RST}            — tail live app logs"
  echo -e "  ${CYN}aq pull qwen3.5:14b${RST} — pull a different model"
  echo -e "  ${CYN}aq models${RST}          — list installed models"
  echo -e "  ${CYN}aq memory${RST}          — view agent fact memory"
  echo -e "  ${CYN}aq backup${RST}          — backup data"
  echo -e "  ${CYN}aq restart${RST}         — restart the app"
  echo
  sep

  if [[ -n "$OLLAMA_MODEL" ]]; then
    echo
    echo -e "${WHT}  Next steps:${RST}"
    echo -e "  1. Visit ${CYN}${APP_URL}${RST} in your browser"
    echo -e "  2. Connect your wallet (MetaMask / WalletConnect / etc.)"
    echo -e "  3. Start chatting with your agent!"
    echo
  else
    echo
    echo -e "${YLW}  ⚠  No model pulled yet. Run:${RST}"
    echo -e "     ${CYN}aq pull qwen3.5${RST}   # or any other model"
    echo
  fi

  if [[ "${ENABLE_SSL,,}" != "y" ]] && [[ "$DOMAIN" != "localhost" ]]; then
    echo -e "${YLW}  SSL tip:${RST} Add HTTPS later with:"
    echo -e "  ${DIM}  certbot --nginx -d ${DOMAIN}${RST}"
    echo
  fi

  sep
  echo -e "  ${DIM}AutonQwen · MIT License · Sovereign AI on your infrastructure${RST}"
  echo
}

# ─── Main ────────────────────────────────────────────────────
main() {
  # Ensure log file exists
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$LOG_FILE"

  banner
  preflight
  configure
  install_system_deps
  install_docker
  install_compose
  install_ollama
  install_node
  install_nginx
  deploy_app
  setup_service
  setup_nginx
  setup_ssl
  setup_firewall
  create_manage_scripts
  final_check
  print_summary
}

main "$@"
