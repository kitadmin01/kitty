# TOOLS.md - Kitty's Tool Notes

## Web Search — USE GOOGLE VIA BROWSER (free)

### How to search
1. Open Google: `{ "action": "open", "targetUrl": "https://www.google.com/search?q=YOUR+QUERY+HERE", "profile": "openclaw" }`
2. Snapshot the results: `{ "action": "snapshot", "profile": "openclaw" }`
3. Read the results from the snapshot. Click into articles if you need more detail.

### Building good search queries
- **For tasks** (LinkedIn posts, tweets, YouTube topics): search for current news/trends
  - LinkedIn post → `"Web3 analytics trends 2026"`, `"blockchain marketing news today"`
  - Twitter content → `"DeFi news today"`, `"crypto market update"`
  - YouTube research → `"Web3 analytics tutorial"`, `"blockchain marketing strategies"`
  - Lead research → `"Web3 marketing agency"`, `"blockchain marketing company contact"`
- **For James's Telegram requests**: interpret what he asks and build an appropriate query
  - "What's happening in DeFi?" → search `"DeFi news today"`
  - "Find me companies doing Web3 marketing" → search `"top Web3 marketing agencies 2026"`
  - "Research AnalyticKit competitors" → search `"Web3 analytics platforms comparison"`
  - Any topic James mentions → search Google, read top results, summarize back

### Tips
- Add the current year to queries for fresh results (e.g., `"Web3 trends 2026"`)
- For news: add `"today"` or `"this week"` to the query
- For leads: add `"contact"` or `"email"` to find outreach targets
- If first results aren't good enough, refine the query and search again
- Click into 2-3 top results and snapshot each for deeper content

### SERP Search API (backup only)
- Only use if Google shows CAPTCHAs or browser search fails
- API key configured via `${SERP_SEARCH_API_KEY}`
- Costs money per query — avoid unless browser search is broken

## Browser (Chromium) — IMPORTANT USAGE GUIDE

### Reading page content
- **ALWAYS use `action="snapshot"`** to read page content. This returns the full page text.
- Example: `{ "action": "snapshot", "profile": "openclaw" }`
- To snapshot a specific tab: `{ "action": "snapshot", "profile": "openclaw", "targetId": "<id from tabs>" }`
- **NEVER use `action="act"` with `request.kind="evaluate"` to read pages** — use snapshot instead.

### Opening/navigating to a URL
- Use `action="open"` with `targetUrl`: `{ "action": "open", "targetUrl": "https://example.com", "profile": "openclaw" }`
- Or use `action="navigate"` to change current tab URL

### Clicking, typing, and other interactions
- First take a snapshot to get element refs
- Then use `action="act"` with the appropriate `request`:
  - Click: `{ "action": "act", "request": { "kind": "click", "ref": "e12" } }`
  - Type: `{ "action": "act", "request": { "kind": "type", "ref": "e12", "text": "hello" } }`
  - Press key: `{ "action": "act", "request": { "kind": "press", "key": "Enter" } }`

### Running JavaScript on page (advanced)
- Use `action="act"` with `request.kind="evaluate"` — **must include `fn` parameter**:
  `{ "action": "act", "request": { "kind": "evaluate", "fn": "return document.title" } }`

### Listing open tabs
- `{ "action": "tabs", "profile": "openclaw" }`

### Profile
- Always use `profile="openclaw"` — this is our managed browser with LinkedIn/Twitter sessions
- Sessions stored in browser profile at ~/.openclaw/browser/openclaw/user-data/
- If session expires, alert James on Telegram to re-login

## CRM (SQLite)
- Database: `~/kitty-data/crm.db`
- Tables: leads, emails_sent, interactions
- Use for all lead management, email tracking, and outreach status

## Email (SMTP)
- Send outreach emails with Calendly link
- SMTP credentials in `~/.openclaw/.env`
- Always include unsubscribe option
- Track send status in CRM database

## Git
- Push changes to https://github.com/kitadmin01 daily
- Never commit secrets/ folder or .env files
- Use descriptive commit messages with dates

## SQLite Databases
- `~/kitty-data/crm.db` — Leads, emails, interactions
- `~/kitty-data/metrics.db` — Social media metrics, posts, growth
- `~/kitty-data/usage.db` — Token usage, costs, daily summaries
- Always use `.backup` command for safe SQLite backups

## S3 Backup
- Daily backup of all databases, logs, and workspace to AWS S3
- Script: `~/kitty-data/scripts/backup.sh`
- Bucket: configured via `${S3_BACKUP_BUCKET}`
