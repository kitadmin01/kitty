# OpenClaw Kitty Agent — Setup, Customization & Troubleshooting

## Overview

Kitty is a 24/7 autonomous marketing agent for AnalyticKit, running on OpenClaw gateway in dev mode on a GMKtec NucBox K11 mini PC (AMD Ryzen 9 8945HS, 32GB RAM, no GPU) via WSL2 Ubuntu 24.04.

---

## Hardware & OS Setup

| Item | Detail |
|------|--------|
| Machine | GMKtec NucBox K11 |
| CPU | AMD Ryzen 9 8945HS |
| RAM | 32GB (24GB allocated to WSL2) |
| GPU | Radeon 780M iGPU (no NVIDIA — Ollama runs on CPU only) |
| OS | WSL2 Ubuntu 24.04 |
| WSL config | `C:\Users\<user>\.wslconfig` — `memory=24GB` |

### Windows Power Settings
- Set power plan to "High Performance"
- Disable sleep/hibernate so the machine runs 24/7
- Disable USB selective suspend

---

## Directory Structure

```
~/.openclaw/                          # Shared data (both dev & prod)
├── .env                              # API keys (NEVER commit this)
├── browser/openclaw/user-data/       # Chromium profile with LinkedIn/Twitter sessions
├── browser-profile/                  # Old/alternate browser profile (unused)
├── cron/jobs.json                    # Cron job definitions
├── workspace-dev/                    # Agent workspace files (dev mode)
│   ├── SOUL.md                       # Agent personality & principles
│   ├── IDENTITY.md                   # Name, emoji, role
│   ├── USER.md                       # Owner (James Williams) profile
│   ├── AGENTS.md                     # Model routing, communication, safety rules
│   ├── TOOLS.md                      # Tool usage guide (esp. browser)
│   ├── TASKS.md                      # 17 daily/weekly task definitions
│   ├── MEMORY.md                     # Persistent memory about AnalyticKit
│   └── HEARTBEAT.md                  # Heartbeat checklist (every 30min)
├── sandboxes/                        # Docker sandboxes (unused — sandbox off)
└── exec-approvals.json               # Approved shell commands

~/.openclaw-dev/                      # Dev-mode gateway config & state
├── openclaw.json                     # Main gateway configuration
├── .env                              # Copy of API keys
├── agents/dev/sessions/              # Conversation session files
├── memory/dev.sqlite                 # Agent memory database
├── telegram/                         # Telegram bot offset tracking
└── logs/config-audit.jsonl           # Config validation log

~/kitty-data/                         # Agent work output
├── crm.db                            # SQLite — leads, emails, interactions
├── logs/                             # Daily activity logs
├── scripts/                          # Automation scripts (backup.sh etc.)
├── secrets/                          # Sensitive files (NEVER commit)
├── skills/                           # Custom OpenClaw skills
└── youtube/                          # YouTube content (presentations, scripts)
```

---

## Customizations Applied

### 1. Agent Identity (was C-3PO debug companion)
- **SOUL.md**: Replaced C-3PO with Kitty marketing agent identity, 8 operating principles
- **IDENTITY.md**: Name=Kitty, Creature=Marketing Cat, Emoji=🐱
- **USER.md**: Owner=James Williams with all social/business links

### 2. Gateway Config (`~/.openclaw-dev/openclaw.json`)

**Model Providers:**
- Ollama (local): `qwen2.5:3b` (fast but limited), `qwen2.5-coder:14b` (coding)
- OpenAI: `gpt-4o-mini` (primary — cheap), `gpt-4o` (fallback — quality)

**Agent Defaults:**
```json
{
  "model": { "primary": "openai/gpt-4o-mini", "fallbacks": ["openai/gpt-4o"] },
  "sandbox": { "mode": "off" },
  "heartbeat": { "every": "30m", "target": "last" },
  "maxConcurrent": 4
}
```

**Telegram Channel:**
```json
{
  "telegram": {
    "enabled": true,
    "botToken": "${TELEGRAM_BOT_TOKEN}",
    "dmPolicy": "allowlist",
    "allowFrom": ["7591059860"],
    "groupPolicy": "allowlist",
    "streamMode": "partial"
  }
}
```

**Browser:**
```json
{
  "browser": {
    "enabled": true,
    "evaluateEnabled": true,
    "executablePath": "/usr/bin/chromium-browser",
    "headless": true,
    "noSandbox": true,
    "defaultProfile": "openclaw",
    "snapshotDefaults": { "mode": "efficient" },
    "profiles": { "openclaw": { "cdpPort": 18800, "color": "#FF4500" } }
  }
}
```

**Tools:**
- Web search: SERP Search (configured as `provider: "brave"` — OpenClaw only accepts brave/perplexity/grok)
- Browser + Cron in `alsoAllow`
- `exec.security: "allowlist"`, `exec.ask: "on-miss"`
- `fs.workspaceOnly: false`

### 3. Workspace Files Created
- **AGENTS.md**: Model routing rules, browser tool rules, communication/data/safety rules
- **TOOLS.md**: Detailed browser usage guide (snapshot vs act), CRM, email, git, SQLite, S3
- **TASKS.md**: 17 tasks — 11 daily, 6 weekly (LinkedIn, Twitter, leads, YouTube, briefs, backups)
- **MEMORY.md**: AnalyticKit product context, social accounts, KPIs
- **HEARTBEAT.md**: 7-step checklist run every 30 minutes

### 4. Environment Variables (`~/.openclaw/.env`)
```
OPENAI_API_KEY=sk-proj-...
SERP_SEARCH_API_KEY=...
TELEGRAM_BOT_TOKEN=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BACKUP_BUCKET=kitty-openclaw-backups
SMTP_HOST=secure.emailsrvr.com
SMTP_PORT=587
SMTP_USER=admin@analytickit.com
SMTP_PASSWORD=...
SMTP_FROM=admin@analytickit.com
LINKEDIN_USER=jameswill89@gmail.com
CALENDLY_LINK=https://calendly.com/analytickit
```

### 5. SSH Key for GitHub
- Created `~/.ssh/id_ed25519` (ed25519) for pushing to github.com/kitadmin01

### 6. Browser Sessions
- LinkedIn and Twitter logged in via Chromium using profile at `~/.openclaw/browser/openclaw/user-data/`
- Sessions persist across gateway restarts as cookies in the profile

---

## Issues Encountered & Fixes

### Issue 1: Config Validation Errors (Zod strict mode)
OpenClaw uses Zod `.strict()` schema — rejects any unknown keys.

| Bad Key | Fix |
|---------|-----|
| `browser.args` | Not valid. Use `noSandbox: true` instead |
| `openai` provider missing `baseUrl` | Added `https://api.openai.com/v1` |
| `model.fallback` (string) | Changed to `fallbacks` (array): `["openai/gpt-4o"]` |
| `tools.web.search.provider: "serp"` | Only `brave`/`perplexity`/`grok` accepted. Use `"brave"` |
| `tools.exec.askFallback` | Not a valid key. Removed |

### Issue 2: Docker Sandbox Error
**Error:** `Agent failed before reply: spawn docker ENOENT`
**Cause:** `sandbox.mode` was `"non-main"` which requires Docker (not installed)
**Fix:** Set `sandbox.mode: "off"` in `agents.defaults`

### Issue 3: Ollama Models Too Slow/Dumb on CPU
| Model | Problem |
|-------|---------|
| `qwen3:8b` | Thinking mode consumed all tokens — empty visible responses via OpenAI-compat API |
| `qwen2.5:7b` | Too slow on CPU — timed out with OpenClaw's system prompt + tool calls |
| `qwen2.5:3b` | Too small — hallucinated tool calls (tried calling TTS tool) |

**Fix:** Switched primary model to `openai/gpt-4o-mini` ($0.15/$0.60 per 1M tokens). Kept Ollama models available for future use if GPU becomes available.

### Issue 4: Environment Variables Not Loading
**Error:** `openai API key is missing`
**Cause:** OpenClaw reads `${VAR}` from shell environment, not from `.env` file
**Fix:** Export vars before starting gateway:
```bash
export $(grep -v '^#' ~/.openclaw/.env | grep -v '^$' | xargs)
```

### Issue 5: Browser Can't Read Page Content
**Error:** `[tools] browser failed: Can't reach the OpenClaw browser control service (Error: fn is required)`
**Root Cause:** gpt-4o-mini was calling `action="act"` with `request.kind="evaluate"` but:
1. Used `text` parameter instead of `fn` (wrong parameter name)
2. Should have used `action="snapshot"` for reading page content (different action entirely)

**Fix (two parts):**
1. Updated `TOOLS.md` and `AGENTS.md` with explicit browser usage guide: "ALWAYS use `action=snapshot` to read pages, NEVER use act:evaluate for reading"
2. Cleared the Telegram session file (`~/.openclaw-dev/agents/dev/sessions/<session-id>.jsonl`) and its reference in `sessions.json` — the old conversation history was reinforcing the bad pattern

### Issue 6: Browser SingletonLock
**Error:** `Failed to create SingletonLock` when trying to open Chromium for manual login
**Cause:** The headless Chromium from the gateway was holding the lock
**Fix:** Stop the gateway first, then `rm ~/.openclaw/browser/openclaw/user-data/SingletonLock`, then open the browser for login

### Issue 7: WSL2 Memory Too Low
**Symptom:** Only 14GB of 32GB available to WSL2
**Fix:** Created `C:\Users\<user>\.wslconfig`:
```ini
[wsl2]
memory=24GB
swap=8GB
processors=8
```
Then `wsl --shutdown` and reopen. Confirmed 23GB available.

---

## Starting the Gateway

```bash
cd ~/openclaw
export $(grep -v '^#' ~/.openclaw/.env | grep -v '^$' | xargs)
node scripts/run-node.mjs --dev gateway --force
```

Or as a background process:
```bash
cd ~/openclaw
export $(grep -v '^#' ~/.openclaw/.env | grep -v '^$' | xargs)
nohup node scripts/run-node.mjs --dev gateway --force > /tmp/openclaw-gateway.log 2>&1 &
```

**Logs:** `/tmp/openclaw/openclaw-YYYY-MM-DD.log`

---

## Re-Login to LinkedIn/Twitter (when sessions expire)

1. Stop the gateway: `kill $(pgrep -f openclaw-gateway)`
2. Wait 3 seconds, remove lock: `rm -f ~/.openclaw/browser/openclaw/user-data/SingletonLock`
3. Open browser with Kitty's profile:
   ```bash
   chromium-browser --no-sandbox --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data https://www.linkedin.com/login
   ```
4. Log in, verify you see the feed
5. Navigate to `https://x.com/login`, log in there too
6. Close the browser
7. Restart the gateway

---

## What to Check Into GitHub

### YES — Check in these directories:

| Directory | What | Why |
|-----------|------|-----|
| `~/.openclaw/workspace-dev/` | SOUL, IDENTITY, USER, AGENTS, TOOLS, TASKS, MEMORY, HEARTBEAT .md files | Agent personality, rules, task definitions |
| `~/.openclaw-dev/openclaw.json` | Gateway configuration | Model providers, channels, browser, tools config |
| `~/kitty-data/logs/` | Daily activity logs | Track agent performance |
| `~/kitty-data/scripts/` | Automation scripts | Backup scripts etc. |
| `~/kitty-data/skills/` | Custom OpenClaw skills | Reusable agent capabilities |
| `~/kitty-data/youtube/` | YouTube content | Presentations, scripts |
| This file (`OPENCLAW-SETUP.md`) | Setup documentation | Future reference |

### NO — Never check in:

| Path | Why |
|------|-----|
| `~/.openclaw/.env` | Contains API keys, passwords, tokens |
| `~/.openclaw-dev/.env` | Same |
| `~/kitty-data/secrets/` | Sensitive files |
| `~/.openclaw/browser/` | Browser profile with session cookies (large, sensitive) |
| `~/.openclaw/browser-profile/` | Old browser profile (large, sensitive) |
| `~/.openclaw-dev/agents/*/sessions/` | Conversation history (large, contains user messages) |
| `~/.openclaw-dev/memory/` | SQLite memory DB (may contain sensitive context) |
| `~/.openclaw/sandboxes/` | Runtime sandbox data |
| `~/kitty-data/crm.db` | Contains lead emails & PII |
| `~/.ssh/` | SSH private keys |

### Suggested `.gitignore`:
```gitignore
# Secrets
.env
*.env
secrets/

# Browser profiles (large + cookies)
browser/
browser-profile/

# Session data
agents/*/sessions/
memory/

# Runtime
sandboxes/
*.lock
SingletonLock
*.sqlite
*.db

# OS
.DS_Store
```

### Suggested Repo Structure:
```
kitty-config/
├── openclaw.json              # from ~/.openclaw-dev/openclaw.json (scrub tokens)
├── workspace/                 # from ~/.openclaw/workspace-dev/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── USER.md
│   ├── AGENTS.md
│   ├── TOOLS.md
│   ├── TASKS.md
│   ├── MEMORY.md
│   └── HEARTBEAT.md
├── scripts/                   # from ~/kitty-data/scripts/
├── skills/                    # from ~/kitty-data/skills/
├── OPENCLAW-SETUP.md          # this file
├── .gitignore
└── .env.example               # template with var names, no values
```

**Important:** Before committing `openclaw.json`, replace all `${...}` token references with placeholders and remove the `gateway.auth.token` value.
