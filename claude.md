# 🦞 OpenClaw Setup Guide — Agent "Kitty"

## Owner & Environment

| Field | Value |
|-------|-------|
| **Agent Name** | Kitty |
| **Owner** | James Williams (sole operator) |
| **Platform** | GMKtec Mini PC → WSL2 (Ubuntu 24.04) |
| **GitHub** | https://github.com/kitadmin01 |
| **Telegram Channel** | Personal Telegram (command & response) |
| **Primary Objective** | 24/7 autonomous marketing, social media, lead gen, analytics for AnalyticKit |

---

## Table of Contents

1. [Prerequisites & Installation Checklist](#1-prerequisites--installation-checklist)
2. [Core Configuration (openclaw.json)](#2-core-configuration-openclawjson)
3. [Workspace Files Setup](#3-workspace-files-setup)
4. [Security Hardening](#4-security-hardening)
5. [Model Strategy (Ollama + Cloud)](#5-model-strategy-ollama--cloud)
6. [Telegram Integration](#6-telegram-integration)
7. [Browser Configuration](#7-browser-configuration)
8. [Skills & Plugins to Install](#8-skills--plugins-to-install)
9. [Task A — AnalyticKit Marketing & Lead Gen](#9-task-a--analytickit-marketing--lead-gen)
10. [Task B — LinkedIn Automation](#10-task-b--linkedin-automation)
11. [Task C — Twitter/X Automation](#11-task-c--twitterx-automation)
12. [Task D — Telegram Command Interface](#12-task-d--telegram-command-interface)
13. [Task E — YouTube Weekly Video](#13-task-e--youtube-weekly-video)
14. [Task F — Daily Brief](#14-task-f--daily-brief)
15. [Task G — Security Protocols](#15-task-g--security-protocols)
16. [Task H — Model Selection Logic](#16-task-h--model-selection-logic)
17. [Task I — Website Traffic Analytics](#17-task-i--website-traffic-analytics)
18. [Cron Jobs & Heartbeat Schedule](#18-cron-jobs--heartbeat-schedule)
19. [Backup Strategy (SQLite + Logs → S3)](#19-backup-strategy-sqlite--logs--s3)
20. [Git Integration](#20-git-integration)
21. [Cost Optimization](#21-cost-optimization)
22. [Troubleshooting](#22-troubleshooting)
23. [First-Run Checklist](#23-first-run-checklist)

---

## 1. Prerequisites & Installation Checklist

### Required Software (WSL2)

```bash
# Node.js 22+ (required for OpenClaw)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Ollama (local model inference)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen3:8b          # Routine tasks (free, fast)
ollama pull qwen2.5-coder:14b # Coding / skill creation
ollama serve &                 # Keep running in background

# Python 3.11+ (for scripts, SQLite, backups)
sudo apt update && sudo apt install -y python3 python3-pip sqlite3 git jq curl awscli chromium-browser

# OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw --version

# Brave Search API Key (free tier: 2,000 queries/month)
# Get from: https://brave.com/search/api
# Store in: ~/.openclaw/.env as BRAVE_SEARCH_API_KEY=xxx
```

### API Keys Needed

Create `~/.openclaw/.env` with the following (chmod 600 this file):

```bash
# AI Providers
ANTHROPIC_API_KEY=sk-ant-xxxxx          # Claude Sonnet for complex tasks
OPENAI_API_KEY=sk-xxxxx                 # GPT-4 fallback (optional)

# Web Search
BRAVE_SEARCH_API_KEY=BSAxxxxx           # Brave Search (2K free/month)

# Telegram Bot
TELEGRAM_BOT_TOKEN=xxxxx               # From @BotFather

# AWS S3 (for backups)
AWS_ACCESS_KEY_ID=AKIAxxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_DEFAULT_REGION=us-east-1
S3_BACKUP_BUCKET=kitty-openclaw-backups

# LinkedIn (store securely — see Security section)
LINKEDIN_USER=jameswill89@gmail.com
# Password: Store in a separate encrypted vault, NOT in .env

# GitHub
GITHUB_TOKEN=ghp_xxxxx                 # From github.com/settings/tokens

# Calendly
CALENDLY_LINK=https://calendly.com/analytickit
```

### ⚠️ IMPORTANT: Close Personal Chrome

**Close Chrome with your personal user logged in.** OpenClaw uses its own managed Chromium instance via CDP (Chrome DevTools Protocol). Having your personal Chrome open is a security risk — the agent could access your personal cookies, sessions, and accounts. Instead:

- Close personal Chrome entirely
- OpenClaw will launch its own isolated Chromium profile
- If you need personal browsing, use a different browser (Firefox) on the host Windows side

---

## 2. Core Configuration (openclaw.json)

Location: `~/.openclaw/openclaw.json`

```json
{
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "GENERATE-A-64-CHAR-RANDOM-TOKEN-HERE"
    }
  },
  "models": {
    "providers": {
      "ollama": {
        "baseUrl": "http://localhost:11434/v1",
        "apiKey": "ollama-local",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen3:8b",
            "name": "qwen3:8b",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 131072,
            "maxTokens": 8192
          },
          {
            "id": "qwen2.5-coder:14b",
            "name": "qwen2.5-coder:14b",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 131072,
            "maxTokens": 8192
          }
        ]
      },
      "anthropic": {
        "apiKey": "${ANTHROPIC_API_KEY}",
        "models": []
      },
      "openai": {
        "apiKey": "${OPENAI_API_KEY}",
        "models": []
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "ollama/qwen3:8b",
        "fallback": "anthropic/claude-sonnet-4-5-20250929"
      },
      "workspace": "~/.openclaw/workspace",
      "maxConcurrent": 4,
      "subagents": {
        "maxConcurrent": 8
      },
      "heartbeat": {
        "every": "30m",
        "target": "last"
      },
      "sandbox": {
        "mode": "non-main",
        "scope": "agent"
      }
    }
  },
  "session": {
    "dmScope": "per-channel-peer"
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "${TELEGRAM_BOT_TOKEN}",
      "dmPolicy": "allowlist",
      "allowFrom": ["YOUR_TELEGRAM_USER_ID"],
      "groups": {
        "*": {
          "requireMention": true
        }
      }
    }
  },
  "tools": {
    "web": {
      "search": {
        "enabled": true,
        "provider": "brave",
        "apiKey": "${BRAVE_SEARCH_API_KEY}"
      },
      "fetch": {
        "enabled": true
      }
    },
    "exec": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny"
    },
    "fs": {
      "workspaceOnly": false
    },
    "elevated": {
      "enabled": false
    },
    "alsoAllow": ["browser", "cron"]
  },
  "browser": {
    "executablePath": "/usr/bin/chromium-browser",
    "headless": true,
    "args": [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  }
}
```

**Generate a secure gateway token:**
```bash
openssl rand -hex 32
```

---

## 3. Workspace Files Setup

### SOUL.md — Agent Identity

Location: `~/.openclaw/workspace/SOUL.md`

```markdown
# Kitty — AnalyticKit Marketing Agent 🐱

You are Kitty, a 24/7 autonomous marketing agent for AnalyticKit 
(https://analytickit.com), a Web3 analytics platform.

## Core Identity
- Name: Kitty
- Owner: James Williams (only authorized user)email analytickit@gmail.com
- Mission: Drive leads, grow social media, create content, and optimize 
  marketing for AnalyticKit
- Communication: Telegram only — report via Telegram, receive commands via Telegram
- Personality: Professional, data-driven, proactive, concise in reporting

## Operating Principles
1. **Cost First**: Always prefer Ollama (local/free) for routine tasks. Only 
   escalate to Claude Sonnet or OpenAI for complex reasoning, content creation, 
   or multi-step analysis.
2. **Log Everything**: Every action must be logged to SQLite with timestamps.
3. **Don't Guess — Search**: Use Brave Search for any current information.
4. **Safety**: Never share credentials. Never access unauthorized APIs. 
   Only respond to James.
5. **Git Commits**: Push meaningful source changes to https://github.com/kitadmin01 daily.
6. **Urgency Protocol**: Urgent items → Telegram immediately. Non-urgent → 
   include in next morning's daily brief.
7. **Be Transparent**: Always report token usage and costs in daily briefs.
8. **Improve Daily**: Use CRM data, analytics, and past performance to 
   improve strategies every day.
```

### USER.md — Owner Context

Location: `~/.openclaw/workspace/USER.md`

```markdown
# Owner: James Williams

- LinkedIn: https://www.linkedin.com/in/james-williams-91381416/
- Email: analytickit@gmail.com
- Company: AnalyticKit (https://analytickit.com) 
- Company email (https://app.rackspace.com/wmidentity/Account/Login user admin@analytickit.com)
- Company LinkedIn: https://www.linkedin.com/company/analytickit/
- Twitter/X: https://x.com/analytic_kit
- YouTube: https://www.youtube.com/@AnalyticKit
- Calendly: https://calendly.com/analytickit
- Analytics Dashboard: https://dpa.analytickit.com/
- GitHub: https://github.com/kitadmin01
- Timezone: (SET YOUR TIMEZONE e.g., America/New_York)
- Communication: Telegram (primary), never email me unless I ask
- Only I (James) can issue commands to this agent
```

### AGENTS.md — Behavior Rules

Location: `~/.openclaw/workspace/AGENTS.md`

```markdown
# Kitty Agent Configuration

## Model Routing Rules
- **Simple/Routine** (social media likes, scheduled posts, data lookups, 
  heartbeat checks, log parsing, backup): Use `ollama/qwen3:8b`
- **Content Creation** (LinkedIn posts, tweets, email drafts, YouTube 
  presentations, marketing copy): Use `anthropic/claude-sonnet-4-5-20250929`
- **Complex Analysis** (CRM analytics, traffic analysis, strategy 
  recommendations, multi-step research): Use `anthropic/claude-sonnet-4-5-20250929`
- **Coding Tasks** (skill creation, script writing, bug fixes): 
  Use `ollama/qwen2.5-coder:14b` first, escalate to Claude if it fails

## Communication Rules
- Send ALL urgent alerts to Telegram immediately
- Batch non-urgent updates for Daily Brief (morning)
- Never send more than 3 Telegram messages in a row unless urgent
- Use concise formatting in Telegram: bullet points, metrics, status emojis

## Data Storage Rules
- All collected emails → SQLite: `~/kitty-data/crm.db`
- All email send status → SQLite: `~/kitty-data/crm.db`
- Daily logs → `~/kitty-data/logs/YYYY-MM-DD.log`
- Social media metrics → SQLite: `~/kitty-data/metrics.db`
- Token/cost tracking → SQLite: `~/kitty-data/usage.db`

## Safety Rules
- NEVER store passwords in plain text in workspace files or memory
- NEVER post content that hasn't been quality-checked
- NEVER access APIs or services not explicitly listed in this config
- NEVER respond to messages from anyone other than James
- Always verify before executing destructive operations
```

### MEMORY.md — Persistent Memory

Location: `~/.openclaw/workspace/MEMORY.md`

```markdown
# Kitty's Memory

## AnalyticKit Product Context
- AnalyticKit is a Web3 analytics platform
- Target audience: Web3 marketing companies, professionals, DeFi projects
- Main value prop: Marketing analytics for blockchain/Web3 companies
- Demo booking: https://calendly.com/analytickit
- Blog: https://analytickit.com/blog (use for content ideas)

## Social Media Accounts
- LinkedIn Personal: https://www.linkedin.com/in/james-williams-91381416/
- LinkedIn Company: https://www.linkedin.com/company/analytickit/
- Twitter/X: https://x.com/analytic_kit
- YouTube: https://www.youtube.com/@AnalyticKit

## Goals & KPIs
- LinkedIn: 1-3K new followers per month
- Twitter: 10K followers in one month
- YouTube: Increase views and subscriptions weekly
- Lead Gen: Collect emails, send demo invites, book Calendly meetings

## CRM Database Schema
(Kitty will populate this after initial setup)

## Strategies That Work
(Kitty will populate this from daily analytics)

## Strategies That Failed
(Kitty will populate this from daily analytics)
```

---

## 4. Security Hardening

### Step 1: Run Security Audit

```bash
openclaw doctor
openclaw security audit --deep
```

Fix any CRITICAL or WARNING issues before proceeding.

### Step 2: Lock Down Access

```bash
# Verify gateway is loopback only
ss -tlnp | grep 18789
# Should show: 127.0.0.1:18789
# Should NOT show: 0.0.0.0:18789
```

### Step 3: Protect Credentials

```bash
# Lock .env file
chmod 600 ~/.openclaw/.env

# Create separate credential store for social media passwords
mkdir -p ~/kitty-data/secrets
chmod 700 ~/kitty-data/secrets

# Store LinkedIn and Twitter passwords encrypted
# Option A: Use GPG
echo "YOUR_LINKEDIN_PASSWORD" | gpg --symmetric --cipher-algo AES256 -o ~/kitty-data/secrets/linkedin.gpg
echo "YOUR_TWITTER_PASSWORD" | gpg --symmetric --cipher-algo AES256 -o ~/kitty-data/secrets/twitter.gpg

# Option B: Use a simpler approach — store in a file only Kitty's scripts can read
# Make sure these files are NEVER committed to git
echo "LINKEDIN_PASSWORD=xxxxx" > ~/kitty-data/secrets/linkedin.env
echo "TWITTER_PASSWORD=xxxxx" > ~/kitty-data/secrets/twitter.env
chmod 600 ~/kitty-data/secrets/*.env
echo "secrets/" >> ~/kitty-data/.gitignore
```

### Step 4: Telegram Allowlist

Only your Telegram user ID should be in the allowlist. Get your ID:
1. Message @userinfobot on Telegram
2. Copy your numeric user ID
3. Add to `openclaw.json` → `channels.telegram.allowFrom`

### Step 5: DM Policy

The config above uses `"dmPolicy": "allowlist"` which is the strictest mode — only your user ID can communicate with Kitty. This is correct for single-user operation.

### Step 6: Skill Vetting

```bash
# Before installing ANY skill, review its code
openclaw skills show <skill-name>
# Read the SKILL.md file manually before enabling
# Never auto-install skills from untrusted sources
```

### Step 7: Close Chrome (Reminder)

Close your personal Chrome browser. Use Firefox or Edge on the Windows host for personal browsing. OpenClaw will control its own Chromium instance.

---

## 5. Model Strategy (Ollama + Cloud)

### Cost Optimization Hierarchy

| Priority | Model | Use Case | Cost |
|----------|-------|----------|------|
| 1st | `ollama/qwen3:8b` | Heartbeats, likes, simple queries, log parsing, scheduled checks | **FREE** |
| 2nd | `ollama/qwen2.5-coder:14b` | Script writing, skill creation, code fixes | **FREE** |
| 3rd | `anthropic/claude-sonnet-4-5-20250929` | Content creation, complex analysis, email drafts, strategy | ~$3/1M input, $15/1M output |
| 4th | `openai/gpt-4o` | Fallback if Claude is unavailable | ~$2.50/1M input, $10/1M output |

### How Model Routing Works in Practice

Kitty should ask herself before every task:
1. Can Ollama handle this? → Use Ollama
2. Does this need creative/analytical reasoning? → Use Claude Sonnet
3. Is Claude down? → Use GPT-4o as fallback

### Configuring Per-Task Models via Cron

```bash
# Heartbeat (cheap/local)
openclaw cron add --name "heartbeat-check" \
  --every "30m" \
  --model "ollama/qwen3:8b" \
  --session main \
  --system-event "Run heartbeat checklist"

# Daily brief (needs Claude for analysis)
openclaw cron add --name "daily-brief" \
  --cron "0 7 * * *" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Generate the daily brief. Read yesterday's logs, metrics DB, CRM DB, and usage DB. Report to Telegram." \
  --announce
```

---

## 6. Telegram Integration

### Setup

1. Open Telegram, message @BotFather
2. Send `/newbot`
3. Name it: `Kitty AnalyticKit Bot` (or similar)
4. Copy the bot token → add to `~/.openclaw/.env`
5. Configure in `openclaw.json` (already done in Section 2)
6. Restart gateway:

```bash
openclaw gateway restart
```

7. Open your Telegram bot and send the pairing code when prompted:

```bash
openclaw pairing approve telegram <code>
```

### Telegram vs Slack — Do You Need Both?

**Telegram alone is sufficient.** Here's why:
- Telegram supports rich messages (markdown, buttons, files)
- OpenClaw's Telegram integration is mature and well-tested
- You're the only user — no team collaboration needed
- Telegram mobile app lets you send commands from anywhere
- Cron jobs can deliver to Telegram directly

You do NOT need Slack unless you later add team members.

### Telegram Command Patterns

Once connected, you can message Kitty on Telegram:

```
# Check status
"Kitty, give me today's metrics"

# Manual trigger
"Kitty, post a LinkedIn update about [topic]"

# Emergency
"Kitty, stop all scheduled posts for today"

# Query CRM
"Kitty, how many emails did we send this week?"

# Adjust strategy
"Kitty, focus more on DeFi companies for lead gen this week"
```

---

## 7. Browser Configuration

OpenClaw uses its own Chromium instance for browser automation (LinkedIn posting, Twitter interaction, web scraping).

### WSL2 Chromium Setup

```bash
# Install Chromium
sudo apt install -y chromium-browser

# Verify
which chromium-browser
# /usr/bin/chromium-browser

# Create a dedicated profile directory for Kitty
mkdir -p ~/.openclaw/browser-profile
```

### Browser Config in openclaw.json (already included in Section 2)

The `browser` block in the config handles this. Key points:
- `headless: true` — no GUI needed for WSL2
- `--no-sandbox` — required for WSL2
- `--disable-dev-shm-usage` — prevents memory issues

### LinkedIn & Twitter Browser Sessions

For LinkedIn and Twitter, Kitty will need to log in via the browser. The first time:

1. Temporarily set `headless: false` (or use VNC/X11 forwarding)
2. Have Kitty navigate to LinkedIn/Twitter
3. Log in manually with your credentials
4. The browser profile will save the session cookies
5. Switch back to `headless: true`

**Alternative approach**: Use X11 forwarding from WSL2 to log in once:

```bash
# On Windows, install VcXsrv or use Windows Terminal's built-in WSLg
# Then in WSL:
export DISPLAY=:0
chromium-browser --user-data-dir=~/.openclaw/browser-profile
# Log into LinkedIn and Twitter manually
# Close browser
# Now Kitty can use headless mode with saved sessions
```

---

## 8. Skills & Plugins to Install

### Essential Skills

```bash
# Web search (Brave)
openclaw skills install brave-search
# Configure: already handled via tools.web.search in openclaw.json

# Browser automation
openclaw skills install browser
# Already included with OpenClaw — enables web browsing, clicking, form filling

# Email sending
openclaw skills install email
# For sending outreach emails — configure SMTP credentials

# Calendar integration
openclaw skills install google-calendar
# Or use a custom skill pointing to Calendly API

# File operations
openclaw skills install file-manager

# Git operations
openclaw skills install git
# Or install GitHub CLI:
sudo apt install gh
gh auth login --with-token <<< "$GITHUB_TOKEN"
```

### Custom Skills to Create

You'll want Kitty to create these custom skills (ask Kitty via Telegram):

#### 1. CRM Skill (`~/kitty-data/skills/crm/SKILL.md`)

```markdown
---
name: crm-manager
description: "Manage the local CRM SQLite database. Add leads, update email 
  status, query contacts, generate reports."
user-invocable: true
---

# CRM Manager

## Database Location
~/kitty-data/crm.db

## Schema
- leads(id, name, email, company, source, linkedin_url, twitter_url, 
  collected_date, status)
- emails_sent(id, lead_id, subject, sent_date, status, response, 
  calendly_booked)
- interactions(id, lead_id, platform, type, content, date)

## Commands
- `/crm add-lead <name> <email> <company> <source>`
- `/crm list-leads [--status pending|contacted|booked|rejected]`
- `/crm send-email <lead_id>`
- `/crm report [--period week|month]`
```

#### 2. Social Media Metrics Skill (`~/kitty-data/skills/social-metrics/SKILL.md`)

```markdown
---
name: social-metrics
description: "Track and report social media metrics across LinkedIn, Twitter, 
  and YouTube."
user-invocable: true
---

# Social Media Metrics

## Database
~/kitty-data/metrics.db

## Schema
- daily_metrics(date, platform, followers, posts, likes, comments, 
  impressions, profile_views)
- posts(id, platform, content, post_date, likes, comments, shares, 
  impressions, url)
- growth(date, platform, new_followers, unfollows, net_growth)

## Daily Collection
Run at end of each day to snapshot metrics from each platform.
```

#### 3. Token Usage Tracker Skill (`~/kitty-data/skills/usage-tracker/SKILL.md`)

```markdown
---
name: usage-tracker
description: "Track API token usage and costs across all providers."
user-invocable: true
---

# Usage Tracker

## Database
~/kitty-data/usage.db

## Schema
- usage(date, provider, model, input_tokens, output_tokens, cost_usd, task)
- daily_summary(date, total_tokens, total_cost_usd, tasks_completed, 
  tasks_pending)

## Commands
- `/usage today` — Show today's token usage and cost
- `/usage week` — Weekly summary
- `/usage by-task` — Breakdown by task type
```

#### 4. Backup Skill (`~/kitty-data/skills/backup/SKILL.md`)

```markdown
---
name: s3-backup
description: "Daily backup of all SQLite databases and logs to AWS S3."
user-invocable: true
---

# S3 Backup

## What to Back Up
- ~/kitty-data/crm.db
- ~/kitty-data/metrics.db
- ~/kitty-data/usage.db
- ~/kitty-data/logs/
- ~/.openclaw/workspace/ (memory files)

## Backup Command
```bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/tmp/kitty-backup-$DATE"
mkdir -p "$BACKUP_DIR"

# SQLite safe backup (prevents corruption)
sqlite3 ~/kitty-data/crm.db ".backup '$BACKUP_DIR/crm.db'"
sqlite3 ~/kitty-data/metrics.db ".backup '$BACKUP_DIR/metrics.db'"
sqlite3 ~/kitty-data/usage.db ".backup '$BACKUP_DIR/usage.db'"

# Logs
cp -r ~/kitty-data/logs/ "$BACKUP_DIR/logs/"

# Workspace memory
cp -r ~/.openclaw/workspace/ "$BACKUP_DIR/workspace/"

# Compress and upload
tar -czf "/tmp/kitty-backup-$DATE.tar.gz" -C /tmp "kitty-backup-$DATE"
aws s3 cp "/tmp/kitty-backup-$DATE.tar.gz" \
  "s3://${S3_BACKUP_BUCKET}/backups/$DATE/kitty-backup.tar.gz"

# Cleanup
rm -rf "$BACKUP_DIR" "/tmp/kitty-backup-$DATE.tar.gz"
```
```

---

## 9. Task A — AnalyticKit Marketing & Lead Gen

### Strategy

1. **Research Phase** (daily via Brave Search + browser):
   - Search LinkedIn for Web3 marketing companies and professionals
   - Search Twitter for Web3 marketing accounts
   - Search Google for "web3 marketing agency", "blockchain marketing company", etc.
   - Collect: name, email, company, LinkedIn URL, Twitter handle

2. **Store in CRM** (SQLite):
   - All collected leads → `~/kitty-data/crm.db`
   - Track: collection date, source, outreach status

3. **Email Outreach**:
   - Draft personalized emails (use Claude Sonnet for quality)
   - Include Calendly link: https://calendly.com/analytickit
   - Track send status in CRM
   - Follow up on non-responses after 3-5 days

4. **CRM Analytics**:
   - Daily: new leads collected, emails sent, responses received
   - Weekly: conversion rates, best-performing email templates, best lead sources

### Email Setup

You'll need SMTP credentials for sending emails. Options:
- **Gmail SMTP** (if using jameswill89@gmail.com): Enable App Passwords in Google Account
- **SendGrid** (recommended for volume): Free tier = 100 emails/day
- **Amazon SES**: Very cheap at scale

```bash
# Add to ~/.openclaw/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jameswill89@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App password, NOT your Gmail password
SMTP_FROM=jameswill89@gmail.com
```

### Cron Job

```bash
# Lead research — daily at 10 AM
openclaw cron add --name "lead-research" \
  --cron "0 10 * * *" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Research and collect 10-20 new Web3 marketing leads. Search LinkedIn, Twitter, and web for web3 marketing companies and professionals. Store in CRM database. Draft personalized outreach emails for each lead. Send emails with Calendly link. Log everything." \
  --announce

# Follow-up emails — daily at 2 PM
openclaw cron add --name "email-followup" \
  --cron "0 14 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Check CRM for leads that were contacted 3+ days ago with no response. Draft and send follow-up emails. Update CRM status." \
  --announce
```

---

## 10. Task B — LinkedIn Automation

### Strategy

1. **Post 1-2 times daily** on both personal and company profiles
2. **Content Sources**:
   - Latest Web3 trending topics (Brave Search)
   - AnalyticKit blog posts (https://analytickit.com/blog)
   - Industry news and insights
   - Original thought leadership
3. **Include**: Hashtags (#Web3 #Blockchain #Analytics #DeFi #Marketing)
4. **Post to**: Web3-related LinkedIn Groups
5. **Engage**: Like and comment on relevant posts from others

### LinkedIn Profiles

- Personal: https://www.linkedin.com/in/james-williams-91381416/
- Company: https://www.linkedin.com/company/analytickit/

### Implementation

LinkedIn does NOT have a free API for posting. Kitty must use **browser automation**:

1. Kitty opens Chromium with the saved LinkedIn session
2. Navigates to the post creation page
3. Types the content, adds hashtags
4. Posts to personal profile first, then company page
5. Scrolls feed and engages with relevant posts (like + comment)

### Cron Jobs

```bash
# LinkedIn personal post — daily at 9 AM
openclaw cron add --name "linkedin-personal-post" \
  --cron "0 9 * * *" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Create a LinkedIn post about trending Web3 topic. Use Brave Search to find today's hottest Web3/blockchain news. Write engaging post with 3-5 hashtags. Post to James's personal LinkedIn profile via browser. Log the post content and URL." \
  --announce

# LinkedIn company post — daily at 1 PM
openclaw cron add --name "linkedin-company-post" \
  --cron "0 13 * * *" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Create a LinkedIn post for the AnalyticKit company page. Focus on AnalyticKit product features, blog content, or Web3 analytics insights. Post via browser. Log it." \
  --announce

# LinkedIn engagement — daily at 11 AM and 3 PM
openclaw cron add --name "linkedin-engage-morning" \
  --cron "0 11 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Open LinkedIn via browser. Scroll feed. Like 10-15 relevant Web3/blockchain/analytics posts. Leave 3-5 thoughtful comments on the most relevant ones. Log all interactions." \
  --announce

openclaw cron add --name "linkedin-engage-afternoon" \
  --cron "0 15 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Open LinkedIn via browser. Scroll feed. Like 10-15 relevant posts. Comment on 3-5 posts. Check for and accept connection requests from Web3 professionals." \
  --announce
```

### Growth Target: 1-3K new followers/month

Strategies Kitty should employ:
- Consistent daily posting (2 posts/day = ~60/month)
- Engage in LinkedIn Groups related to Web3
- Comment on posts from high-follower accounts (creates visibility)
- Use trending hashtags relevant to Web3 (#DeFi #NFT #Crypto #Blockchain #Web3Marketing)
- Share valuable, original insights (not just reposts)
- Accept all relevant connection requests

---

## 11. Task C — Twitter/X Automation

### Strategy

1. **Post 5 tweets daily** about AnalyticKit, Web3, AI, blockchain
2. **Like posts every 10 minutes** (related to Web3, crypto, blockchain, AI)
3. **Use browser automation** (avoids expensive Twitter API — $100/month for Basic)
4. **Goal**: 10K followers in one month

### Implementation via Browser

Twitter API costs:
- Free tier: Write-only, 1,500 tweets/month, no reads
- Basic tier: $100/month
- Pro tier: $5,000/month

**Recommendation: Use browser automation exclusively.** This avoids API costs entirely.

```bash
# Tweet 5 times daily — spread across the day
openclaw cron add --name "tweet-1" \
  --cron "0 8 * * *" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Write and post a tweet about AnalyticKit or Web3 analytics via browser on https://x.com/analytic_kit. Include relevant hashtags. Make it engaging. Log it." \
  --announce

openclaw cron add --name "tweet-2" \
  --cron "0 10 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Write and post a tweet sharing a Web3 industry insight via browser. Keep it concise and insightful. Log it." \
  --announce

openclaw cron add --name "tweet-3" \
  --cron "0 13 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Write and post a tweet about AI + blockchain intersection via browser. Log it." \
  --announce

openclaw cron add --name "tweet-4" \
  --cron "0 16 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Write and post a tweet about AnalyticKit features or a customer success angle via browser. Log it." \
  --announce

openclaw cron add --name "tweet-5" \
  --cron "0 19 * * *" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Write and post an engaging evening tweet. Could be a question, poll-style tweet, or hot take about Web3/crypto. Post via browser. Log it." \
  --announce

# Like posts every 10 minutes (6 AM to 11 PM)
openclaw cron add --name "twitter-like" \
  --cron "*/10 6-23 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Open Twitter via browser. Search for recent posts about web3 OR crypto OR blockchain OR AI OR DeFi. Like 3-5 relevant posts. Do NOT like spam or offensive content. Be quick and efficient. HEARTBEAT_OK if done." \
  --announce
```

### Tips to Reach 10K Followers Cheaply

1. **Engage heavily**: Liking every 10 min is good. Also reply to popular tweets in Web3 space.
2. **Quote tweet** popular accounts with insightful commentary
3. **Use threads**: Write Twitter threads about Web3 topics (1 thread/week)
4. **Participate in Twitter Spaces** about Web3 topics
5. **Follow relevant accounts**: Follow Web3 influencers, projects, and communities (many will follow back)
6. **Post at peak times**: 8-9 AM, 12-1 PM, 5-7 PM (US time zones)
7. **Use trending hashtags**: Monitor Twitter Trending for relevant Web3 topics
8. **Cross-promote**: Link tweets in LinkedIn posts and vice versa
9. **Pin your best tweet** about AnalyticKit
10. **Consistency**: 5 tweets/day + constant engagement > sporadic viral attempts

**⚠️ Rate Limiting Warning**: Twitter may rate-limit or temporarily restrict accounts that like too aggressively. If Kitty detects a rate limit:
- Reduce liking frequency to every 20-30 minutes
- Spread actions more naturally
- Report to Telegram immediately

---

## 12. Task D — Telegram Command Interface

### How It Works

Telegram is Kitty's primary I/O channel. The flow:

```
You (Telegram) → Kitty (OpenClaw) → Execute Task → Report back (Telegram)
```

### Urgent vs Non-Urgent

| Priority | Action | Example |
|----------|--------|---------|
| 🔴 Urgent | Immediate Telegram alert | Account rate-limited, backup failed, API key expired, lead responded |
| 🟡 Normal | Next daily brief | Metrics update, task completion, suggestions |
| 🟢 Low | Weekly summary | Strategy improvements, long-term analytics |

### Command Examples You Can Send

```
# Status commands
"status" → Full system status
"metrics today" → Today's social media metrics
"crm report" → CRM summary
"usage today" → Token/cost usage
"pending tasks" → What's queued up

# Manual triggers
"post to linkedin about [topic]"
"tweet about [topic]"
"research leads in [niche]"
"send followup emails"
"backup now"
"push to git"

# Strategy adjustments
"focus on DeFi companies this week"
"increase tweet frequency to 8/day"
"pause linkedin posting for today"
"try different email subject lines"

# Emergency
"stop all automation"
"restart gateway"
```

---

## 13. Task E — YouTube Weekly Video

### Schedule

Every **Sunday morning** — Kitty prepares the weekly YouTube content package.

### Workflow

1. **Topic Selection** (Thursday): Kitty researches trending Web3/AnalyticKit topics
2. **Presentation Creation** (Friday): Kitty creates a slide deck (max 20 minutes of content)
3. **Script Draft** (Saturday): Kitty drafts talking points / script
4. **Ready for Recording** (Sunday AM): Kitty sends the package to Telegram

### Cron Jobs

```bash
# Thursday: Topic research
openclaw cron add --name "youtube-topic" \
  --cron "0 10 * * 4" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Research trending Web3 and AnalyticKit topics for this week's YouTube video. Analyze past videos on https://www.youtube.com/@AnalyticKit to identify what performed well. Suggest 3 topic options with brief outlines. Send to Telegram for James to choose." \
  --announce

# Friday: Create presentation
openclaw cron add --name "youtube-presentation" \
  --cron "0 10 * * 5" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Create a presentation for Sunday's YouTube video based on the chosen topic. Create 15-20 slides covering the topic in depth. Include speaker notes. Save to ~/kitty-data/youtube/ and notify on Telegram." \
  --announce

# Saturday: Script and notes
openclaw cron add --name "youtube-script" \
  --cron "0 10 * * 6" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Draft a 15-20 minute video script based on the presentation. Include intro hook, key points, transitions, and CTA (subscribe, check out AnalyticKit). Send script to Telegram." \
  --announce

# Sunday: Final package
openclaw cron add --name "youtube-ready" \
  --cron "0 7 * * 0" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Package this week's YouTube video materials: presentation, script, thumbnail suggestions, SEO-optimized title and description with tags. Send summary to Telegram." \
  --announce
```

### YouTube Channel Analysis

Kitty will periodically analyze https://www.youtube.com/@AnalyticKit to:
- Identify which videos get the most views
- Analyze titles, thumbnails, tags that perform well
- Suggest improvements for future videos
- Recommend SEO optimizations (titles, descriptions, tags)
- Suggest collaborations with other Web3 YouTubers

---

## 14. Task F — Daily Brief

### Schedule: Every morning at 7 AM

```bash
openclaw cron add --name "daily-brief" \
  --cron "0 7 * * *" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Generate Kitty's daily brief and send to Telegram. Include:

1. YESTERDAY'S PERFORMANCE:
   - Leads collected / emails sent / responses received
   - LinkedIn: posts made, likes/comments given, follower change
   - Twitter: tweets posted, likes given, follower change
   - YouTube: view/subscriber changes
   - Website traffic (if accessible from DPA)

2. TOKEN & COST REPORT:
   - Total tokens used yesterday (by provider)
   - Total cost in USD
   - Cost breakdown by task category
   - Cost-saving suggestions

3. TODAY'S SCHEDULE:
   - Tasks queued for today
   - Any pending items from yesterday
   - Suggested priorities

4. ALERTS & RECOMMENDATIONS:
   - Any urgent items
   - Strategy suggestions based on data trends
   - A/B test results if any

Format concisely for Telegram readability." \
  --announce
```

### End-of-Day Summary

```bash
openclaw cron add --name "eod-summary" \
  --cron "0 21 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Quick end-of-day summary: tasks completed today, any failures, anything pending for tomorrow. Send to Telegram. Keep it short — 5-10 lines max." \
  --announce
```

---

## 15. Task G — Security Protocols

### Automated Security Checks

```bash
# Weekly security audit — Sunday night
openclaw cron add --name "security-audit" \
  --cron "0 22 * * 0" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Run security audit: 
  1. Run 'openclaw doctor' and report any warnings
  2. Check that gateway is still bound to loopback only
  3. Verify no unauthorized API calls in logs
  4. Check .env file permissions are still 600
  5. Verify Telegram allowlist has only James's ID
  6. Report any anomalies to Telegram immediately" \
  --announce
```

### Rules (enforced in AGENTS.md)

1. **Only James can issue commands** (enforced via Telegram allowlist)
2. **No unauthorized APIs** (tools are explicitly configured in openclaw.json)
3. **Credentials are never logged** (AGENTS.md instructs Kitty to never log passwords)
4. **Gateway is local-only** (bind: loopback)
5. **Regular audits** via `openclaw doctor`

---

## 16. Task H — Model Selection Logic

Already configured in Sections 2 and 5. Summary:

```
┌─────────────────────────────┐
│     Incoming Task           │
└──────────┬──────────────────┘
           │
    ┌──────▼──────┐
    │ Is it simple │──YES──→ ollama/qwen3:8b (FREE)
    │ /routine?    │         (likes, heartbeats, logs, backups)
    └──────┬──────┘
           │ NO
    ┌──────▼──────┐
    │ Is it coding? │──YES──→ ollama/qwen2.5-coder:14b (FREE)
    │              │          (scripts, skills, fixes)
    └──────┬──────┘
           │ NO
    ┌──────▼──────┐
    │ Complex or   │──YES──→ anthropic/claude-sonnet (PAID)
    │ creative?    │         (content, analysis, strategy, emails)
    └──────┬──────┘
           │ NO / Claude unavailable
           ▼
    openai/gpt-4o (PAID FALLBACK)
```

---

## 17. Task I — Website Traffic Analytics

### DPA Dashboard

Kitty will access https://dpa.analytickit.com/ to:
- Monitor daily traffic patterns
- Identify top referral sources
- Track conversion funnels
- Detect traffic drops or spikes

### Cron Job

```bash
# Weekly traffic analysis — Monday morning
openclaw cron add --name "traffic-analysis" \
  --cron "0 8 * * 1" \
  --model "anthropic/claude-sonnet-4-5-20250929" \
  --session isolated \
  --message "Analyze AnalyticKit website traffic from https://dpa.analytickit.com/. Use browser to check the dashboard. Report:
  1. Traffic trends (up/down, by how much)
  2. Top referral sources
  3. Which pages get the most visits
  4. Suggestions to increase Google search traffic (SEO recommendations)
  5. Suggestions to increase visibility in LLMs (Claude, ChatGPT, Perplexity)
     - For LLM visibility: ensure AnalyticKit is mentioned in relevant contexts,
       create content that LLMs can reference, ensure schema.org markup on website,
       create FAQ pages that match common queries, publish authoritative content
       on Web3 analytics topics
  6. Actionable items for this week
  Send full report to Telegram." \
  --announce
```

### Increasing LLM Visibility (Claude, ChatGPT, etc.)

Strategies Kitty should recommend and help implement:
1. **Create authoritative content** on analytickit.com/blog about Web3 analytics
2. **Publish on high-authority sites** (Medium, Dev.to, HackerNoon) linking back
3. **Get listed** in "awesome Web3" GitHub lists and tool directories
4. **Schema.org markup** on the website for structured data
5. **FAQ pages** answering common Web3 analytics questions
6. **Wikipedia/Wikidata** presence (if notable enough)
7. **Press mentions** in crypto/Web3 publications
8. **GitHub presence** — open-source tools or libraries that reference AnalyticKit

---

## 18. Cron Jobs & Heartbeat Schedule

### Complete Cron Schedule

| Time | Job | Model | Frequency |
|------|-----|-------|-----------|
| `*/10 6-23 * * *` | Twitter likes | Ollama | Every 10 min |
| `*/30 * * * *` | Heartbeat check | Ollama | Every 30 min |
| `0 3 * * *` | S3 Backup | Ollama | Daily |
| `0 7 * * *` | Daily Brief | Claude Sonnet | Daily |
| `0 8 * * *` | Tweet #1 | Claude Sonnet | Daily |
| `0 9 * * *` | LinkedIn personal post | Claude Sonnet | Daily |
| `0 10 * * *` | Tweet #2 + Lead research | Ollama + Claude | Daily |
| `0 11 * * *` | LinkedIn engage AM | Ollama | Daily |
| `0 13 * * *` | LinkedIn company post + Tweet #3 | Claude + Ollama | Daily |
| `0 14 * * *` | Email follow-ups | Ollama | Daily |
| `0 15 * * *` | LinkedIn engage PM | Ollama | Daily |
| `0 16 * * *` | Tweet #4 | Ollama | Daily |
| `0 19 * * *` | Tweet #5 | Claude Sonnet | Daily |
| `0 21 * * *` | EOD summary | Ollama | Daily |
| `0 23 * * *` | Git push | Ollama | Daily |
| `0 8 * * 1` | Traffic analysis | Claude Sonnet | Weekly (Mon) |
| `0 10 * * 4` | YouTube topic research | Claude Sonnet | Weekly (Thu) |
| `0 10 * * 5` | YouTube presentation | Claude Sonnet | Weekly (Fri) |
| `0 10 * * 6` | YouTube script | Claude Sonnet | Weekly (Sat) |
| `0 7 * * 0` | YouTube package ready | Ollama | Weekly (Sun) |
| `0 22 * * 0` | Security audit | Ollama | Weekly (Sun) |

### HEARTBEAT.md

Location: `~/.openclaw/workspace/HEARTBEAT.md`

```markdown
# Kitty Heartbeat Checklist

Run these checks each heartbeat (every 30 minutes):

1. Check ~/kitty-data/logs/ for any ERROR entries since last heartbeat
2. Check if any cron jobs failed
3. Check if gateway is healthy
4. Check if Ollama is responsive (ollama ps)
5. Check SQLite databases are not corrupted
6. If any urgent lead responses came in, alert on Telegram
7. If nothing needs attention: HEARTBEAT_OK
```

---

## 19. Backup Strategy (SQLite + Logs → S3)

### Daily Backup Cron

```bash
openclaw cron add --name "daily-backup" \
  --cron "0 3 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Run the daily S3 backup. Execute the backup script at ~/kitty-data/scripts/backup.sh. Verify the upload succeeded. If backup fails, send urgent alert to Telegram." \
  --announce
```

### Backup Script

Create `~/kitty-data/scripts/backup.sh`:

```bash
#!/bin/bash
set -e

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/tmp/kitty-backup-$DATE"
S3_BUCKET="${S3_BACKUP_BUCKET:-kitty-openclaw-backups}"

echo "[$(date)] Starting daily backup..."

mkdir -p "$BACKUP_DIR"

# Safe SQLite backups (prevents corruption during active writes)
for db in crm metrics usage; do
  if [ -f "$HOME/kitty-data/$db.db" ]; then
    sqlite3 "$HOME/kitty-data/$db.db" ".backup '$BACKUP_DIR/$db.db'"
    echo "  ✓ $db.db backed up"
  fi
done

# Logs
if [ -d "$HOME/kitty-data/logs" ]; then
  cp -r "$HOME/kitty-data/logs/" "$BACKUP_DIR/logs/"
  echo "  ✓ Logs backed up"
fi

# Workspace memory files
cp -r "$HOME/.openclaw/workspace/" "$BACKUP_DIR/workspace/"
echo "  ✓ Workspace backed up"

# Compress
tar -czf "/tmp/kitty-backup-$DATE.tar.gz" -C /tmp "kitty-backup-$DATE"
echo "  ✓ Compressed"

# Upload to S3
aws s3 cp "/tmp/kitty-backup-$DATE.tar.gz" \
  "s3://$S3_BUCKET/backups/$DATE/kitty-backup.tar.gz" \
  --storage-class STANDARD_IA
echo "  ✓ Uploaded to S3"

# Cleanup local temp files
rm -rf "$BACKUP_DIR" "/tmp/kitty-backup-$DATE.tar.gz"

# Cleanup old local logs (keep 30 days)
find "$HOME/kitty-data/logs/" -name "*.log" -mtime +30 -delete

echo "[$(date)] Backup complete!"
```

```bash
chmod +x ~/kitty-data/scripts/backup.sh
```

---

## 20. Git Integration

### Setup

```bash
# Configure git
cd ~/kitty-data
git init
git remote add origin https://github.com/kitadmin01/kitty-data.git  # Create this repo first

# .gitignore
cat > .gitignore << 'EOF'
secrets/
*.env
*.gpg
__pycache__/
*.pyc
/tmp/
EOF

# Initial commit
git add -A
git commit -m "Initial Kitty data setup"
git push -u origin main
```

### Daily Git Push Cron

```bash
openclaw cron add --name "git-push" \
  --cron "0 23 * * *" \
  --model "ollama/qwen3:8b" \
  --session isolated \
  --message "Commit and push any changes in ~/kitty-data/ to git. Use descriptive commit message including today's date and summary of changes. Push to https://github.com/kitadmin01. Do NOT commit anything in the secrets/ folder." \
  --announce
```

---

## 21. Cost Optimization

### Estimated Monthly Costs

| Item | Estimated Cost | Notes |
|------|---------------|-------|
| Ollama (local) | $0 | Free — runs on GMKtec hardware |
| Claude Sonnet | $15-30/month | ~5-8 calls/day for content + analysis |
| Brave Search | $0 | Free tier: 2,000 queries/month |
| AWS S3 (backups) | $1-2/month | Standard-IA for compressed daily backups |
| Twitter API | $0 | Using browser automation instead |
| LinkedIn API | $0 | Using browser automation instead |
| Electricity | $5-10/month | GMKtec is low power |
| **Total** | **~$20-45/month** | |

### Cost-Saving Rules (enforced by Kitty)

1. **Ollama first**: Always try local models before cloud APIs
2. **Cache responses**: Don't re-research the same topic within 24 hours
3. **Batch operations**: Combine multiple heartbeat checks into one turn
4. **Short prompts**: Keep cron job messages concise
5. **Monitor daily**: Track token usage in usage.db and alert if daily spend > $3
6. **Use `--thinking` sparingly**: Only use `--thinking high` for complex strategy tasks
7. **Compress context**: Keep HEARTBEAT.md and AGENTS.md concise to reduce token overhead

### Cost Alert

Add to AGENTS.md:
```
If daily API cost exceeds $5, immediately alert James on Telegram with breakdown.
```

---

## 22. Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Gateway won't start | `openclaw gateway restart` then check `openclaw logs --follow` |
| Cron jobs not firing | `openclaw cron list` → verify `enabled: true`. Check `openclaw status --all` |
| Ollama not responding | `ollama ps` → if empty, `ollama serve &` |
| Browser automation fails | Check Chromium is installed. Try `chromium-browser --headless --dump-dom https://google.com` |
| LinkedIn session expired | Re-login via X11-forwarded browser (see Section 7) |
| Twitter rate limited | Reduce liking frequency. Wait 15-30 min. Alert James. |
| SQLite locked | Only one process should write at a time. Check for hung processes. |
| Backup to S3 fails | Check AWS credentials: `aws s3 ls`. Verify bucket exists. |
| Memory/context too large | Run `openclaw compact` to compact conversation history |
| Gateway crashes | Set up a watchdog: `while true; do openclaw gateway start; sleep 5; done` |

### WSL2 Specific

```bash
# If Chromium fails in WSL2
export DISPLAY=:0  # For GUI mode
# Or ensure --no-sandbox --headless flags are set

# If Ollama can't use GPU from WSL2
# Install NVIDIA CUDA toolkit for WSL2:
# https://docs.nvidia.com/cuda/wsl-user-guide/
```

### Health Check Command

```bash
# Run this anytime to verify everything is working
openclaw doctor
openclaw status --all
openclaw cron list
ollama ps
sqlite3 ~/kitty-data/crm.db "SELECT count(*) FROM leads;" 2>/dev/null || echo "CRM DB not initialized yet"
```

---

## 23. First-Run Checklist

Run these steps in order after setting up everything above:

```
□ 1. Close personal Chrome browser
□ 2. Verify all API keys are in ~/.openclaw/.env (chmod 600)
□ 3. Start Ollama: ollama serve &
□ 4. Pull models: ollama pull qwen3:8b && ollama pull qwen2.5-coder:14b
□ 5. Run: openclaw onboard (if not done) or openclaw gateway start
□ 6. Create Telegram bot via @BotFather, add token to .env
□ 7. Configure openclaw.json (copy from Section 2, customize)
□ 8. Create workspace files: SOUL.md, USER.md, AGENTS.md, MEMORY.md, HEARTBEAT.md
□ 9. Run: openclaw doctor — fix all CRITICAL issues
□ 10. Pair your Telegram: openclaw pairing approve telegram <code>
□ 11. Send first message to Kitty: "Hey Kitty, let's get you set up. 
      Read BOOTSTRAP.md and walk me through it."
□ 12. Create data directories:
      mkdir -p ~/kitty-data/{logs,scripts,youtube,skills,secrets}
□ 13. Initialize SQLite databases (Kitty will do this on first CRM task)
□ 14. Set up browser sessions (LinkedIn, Twitter) via X11 forwarding
□ 15. Create backup script (Section 19)
□ 16. Install all cron jobs (Section 18)
□ 17. Set up git repo for ~/kitty-data
□ 18. Test each cron job with --force: openclaw cron run --force <job-name>
□ 19. Verify backup works: run backup script manually
□ 20. Monitor first 24 hours closely via Telegram
□ 21. After 1 week: review costs, adjust model routing, refine strategies
```

### First Message to Kitty

After setup, send this to your Telegram bot:

> "Hey Kitty, I'm James, your owner. You are my 24/7 marketing agent for AnalyticKit. Read your SOUL.md, AGENTS.md, USER.md, and MEMORY.md files to understand your mission. Then:
> 1. Initialize the SQLite databases (crm.db, metrics.db, usage.db) in ~/kitty-data/
> 2. Create the necessary tables  
> 3. Confirm you understand all your scheduled tasks
> 4. Give me a status report
> Let's go! 🐱"

---

## Best Practices (from YouTube references & community)

1. **Conversation-first**: Talk to Kitty naturally. Corrections compound — after a week, Kitty will understand your preferences.
2. **Write durable behaviors to AGENTS.md**: If you correct Kitty, ask it to save the lesson to AGENTS.md so it persists.
3. **Start small, scale up**: Don't enable all cron jobs on day 1. Start with the daily brief and one social platform, then add more.
4. **Monitor the first week closely**: Watch for runaway costs, browser errors, and rate limits.
5. **Back up your workspace to git**: Your workspace files (SOUL.md, AGENTS.md, MEMORY.md) ARE Kitty's brain. Losing them means starting over.
6. **Keep HEARTBEAT.md lean**: Every heartbeat consumes tokens. Only check what's essential.
7. **Use `openclaw doctor` weekly**: It catches misconfigurations before they become problems.

---

*Last updated: February 19, 2026*
*Agent: Kitty v1.0*
*Owner: James Williams*
*Platform: GMKtec → WSL2 → OpenClaw*
