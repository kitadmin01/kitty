# TOOLS.md - Kitty's Tool Notes

## Web Search — USE SERPAPI VIA EXEC (primary method)

Google/DuckDuckGo/Bing all block headless browsers with CAPTCHAs. Do NOT use browser for web searches.
Use SerpAPI instead — it returns clean Google results via API.

### How to search
Run this command using the `exec` tool:
```
curl -s "https://serpapi.com/search.json?engine=google&q=YOUR+QUERY+HERE&num=10&api_key=${SERP_SEARCH_API_KEY}" | python3 -c "import sys,json; data=json.load(sys.stdin); [print(f\"Title: {r.get('title')}\nURL: {r.get('link')}\nSnippet: {r.get('snippet','')}\n\") for r in data.get('organic_results',[])]"
```

Replace spaces with `+` in the query. The command returns titles, URLs, and snippets.

### For deeper content
After getting search results, use the **browser** to open interesting URLs and snapshot them:
1. Run SerpAPI search via exec → get URLs
2. Open a result URL: `{ "action": "open", "targetUrl": "https://example.com/article", "profile": "openclaw" }`
3. Snapshot to read full content: `{ "action": "snapshot", "profile": "openclaw" }`

### Building search queries

**For scheduled tasks:**
- LinkedIn post → `q=Web3+analytics+trends+2026`
- Twitter content → `q=DeFi+news+today`
- YouTube research → `q=Web3+analytics+tutorial+2026`
- Lead research → `q=Web3+marketing+agency+contact+email`
- News → `q=blockchain+crypto+news+today`

**For James's Telegram requests** — interpret what he asks and build the right query:
- "What's happening in DeFi?" → `q=DeFi+news+today`
- "Find Web3 marketing companies" → `q=top+Web3+marketing+agencies+2026`
- "Research competitors" → `q=Web3+analytics+platforms+comparison`
- Any topic James asks about → build a query, run SerpAPI, summarize results

### For news specifically
Add `&tbm=nws` to get Google News results:
```
curl -s "https://serpapi.com/search.json?engine=google&q=Web3+news&tbm=nws&api_key=${SERP_SEARCH_API_KEY}"
```

### Tips
- Add the current year for fresh results (e.g., `Web3+trends+2026`)
- SerpAPI free tier: 100 searches/month — use wisely, don't repeat identical queries
- Cache/remember results within the same day to avoid duplicate API calls
- For lead research, combine SerpAPI results with LinkedIn/Twitter browser scraping

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

## LinkedIn Posting — STEP-BY-STEP (MUST FOLLOW EXACTLY)

LinkedIn posting requires a precise sequence of browser actions. Do NOT skip steps.

### Post to James's Personal Profile
```
Step 1: Open LinkedIn feed
  browser: { "action": "open", "targetUrl": "https://www.linkedin.com/feed/", "profile": "openclaw" }

Step 2: Take snapshot to find "Start a post" button
  browser: { "action": "snapshot", "profile": "openclaw" }
  Look for: button "Start a post" [ref=eXXX]

Step 3: Click "Start a post"
  browser: { "action": "act", "request": { "kind": "click", "ref": "eXXX" }, "profile": "openclaw" }

Step 4: Take snapshot to find the text editor and Post button
  browser: { "action": "snapshot", "profile": "openclaw" }
  Look for BOTH of these:
    - textbox "Text editor for creating content" [ref=eYYY]
    - button "Post" [disabled] [ref=eZZZ]
  WARNING: There is also a "Schedule post" button — IGNORE IT. Only use "Post".

Step 5: Type your post content (use slowly:true for reliability)
  browser: { "action": "act", "request": { "kind": "type", "ref": "eYYY", "text": "Your post...", "slowly": true }, "profile": "openclaw" }

Step 6: Take snapshot AFTER typing — THIS STEP IS MANDATORY
  browser: { "action": "snapshot", "profile": "openclaw" }
  Find: button "Post" [ref=eNEW] — it should NOT have [disabled] now.
  Use the NEW ref from THIS snapshot, not the old one from Step 4.

Step 7: Click the "Post" button (NOT "Schedule post"!)
  browser: { "action": "act", "request": { "kind": "click", "ref": "eNEW" }, "profile": "openclaw" }
  IMPORTANT: Click ONLY the button labeled exactly "Post".
  NEVER click "Schedule post" — that opens a scheduling dialog.
```

### Post to AnalyticKit Company Page
Same flow but navigate to: `https://www.linkedin.com/company/analytickit/`
Then click "Start a post" from there.

## Twitter/X Posting — STEP-BY-STEP (MUST FOLLOW EXACTLY)

```
Step 1: Open Twitter compose page
  browser: { "action": "open", "targetUrl": "https://twitter.com/compose/tweet", "profile": "openclaw" }

Step 2: Take snapshot to find the tweet textbox
  browser: { "action": "snapshot", "profile": "openclaw" }
  Look for: textbox "Post text" [ref=eAAA]
  Also note: button "Post" [disabled] [ref=eBBB]

Step 3: Type your tweet (use slowly:true for reliability)
  browser: { "action": "act", "request": { "kind": "type", "ref": "eAAA", "text": "Your tweet...", "slowly": true }, "profile": "openclaw" }

Step 4: Take snapshot AFTER typing — THIS STEP IS MANDATORY
  browser: { "action": "snapshot", "profile": "openclaw" }
  Find: button "Post" [ref=eCCC] — should NOT have [disabled] now.
  Use the NEW ref from THIS snapshot.

Step 5: Click the "Post" button
  browser: { "action": "act", "request": { "kind": "click", "ref": "eCCC" }, "profile": "openclaw" }
```

## CRITICAL RULES for ALL social media posting
- **ALWAYS take a snapshot AFTER typing** — the Post button ref changes and becomes enabled
- **NEVER click without a fresh snapshot** — refs from old snapshots are STALE
- **Click ONLY the button labeled exactly "Post"** — never "Schedule post" or anything else
- **Refs like eXXX are examples** — always use the ACTUAL ref from your LATEST snapshot
- **If browser times out, do NOT retry** — tell James on Telegram
- **Use `"slowly": true` when typing** — ensures content registers properly in rich editors

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
