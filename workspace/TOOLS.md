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

## LinkedIn Posting — USE THE SCRIPT (MANDATORY)

**DO NOT use the browser tool for LinkedIn posting.** Use the posting script via exec instead.

### How to post to LinkedIn
Run this command using the `exec` tool:
```
node /home/mani/kitty-data/scripts/post-linkedin.cjs "Your post content here"
```

The script handles everything automatically:
1. Connects to the browser via CDP
2. Navigates to LinkedIn feed
3. Clicks "Start a post"
4. Types content into the editor (with proper React event triggers)
5. Waits for Post button to become enabled
6. Clicks the Post button
7. Verifies the post was published

**Output:** The script prints status lines. Look for `SUCCESS: LinkedIn post published!` to confirm.

**Error handling:** If the script prints `ERROR:`, the post failed. Common reasons:
- Browser not running → restart the gateway
- Not logged into LinkedIn → alert James on Telegram to re-login
- Post button stayed disabled → content may have been rejected

## Twitter/X Posting — USE THE SCRIPT (MANDATORY)

**DO NOT use the browser tool for Twitter posting.** Use the posting script via exec instead.

### How to post to Twitter
Run this command using the `exec` tool:
```
node /home/mani/kitty-data/scripts/post-twitter.cjs "Your tweet content here"
```

**Important:** Tweets must be 280 characters or less. The script will reject content over 280 chars.

The script handles everything automatically:
1. Connects to the browser via CDP
2. Opens the Twitter compose page
3. Types tweet content (with proper React event triggers)
4. Waits for Post button to become enabled
5. Submits via Ctrl+Enter (Twitter's native keyboard shortcut)
6. Verifies the tweet was published

**Output:** Look for `SUCCESS: Tweet published!` to confirm.

## Browser (Chromium) — USAGE GUIDE

Use the browser tool for reading web pages and general browsing. **Do NOT use it for posting to LinkedIn or Twitter** — use the scripts above instead.

### Reading page content
- **ALWAYS use `action="snapshot"`** to read page content. This returns the full page text.
- Example: `{ "action": "snapshot", "profile": "openclaw" }`
- **NEVER use `action="act"` with `request.kind="evaluate"` to read pages** — use snapshot instead.

### Opening/navigating to a URL
- Use `action="open"` with `targetUrl`: `{ "action": "open", "targetUrl": "https://example.com", "profile": "openclaw" }`

### Clicking, typing, and other interactions
- First take a snapshot to get element refs
- Then use `action="act"` with the appropriate `request`:
  - Click: `{ "action": "act", "request": { "kind": "click", "ref": "e12" } }`
  - Type: `{ "action": "act", "request": { "kind": "type", "ref": "e12", "text": "hello" } }`
  - Press key: `{ "action": "act", "request": { "kind": "press", "key": "Enter" } }`

### Profile
- Always use `profile="openclaw"` — this is our managed browser with LinkedIn/Twitter sessions
- If session expires, alert James on Telegram to re-login

## CRM (SQLite)
- Database: `/home/mani/kitty-data/crm.db`
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
- `/home/mani/kitty-data/crm.db` — Leads, emails, interactions
- `/home/mani/kitty-data/metrics.db` — Social media metrics, posts, growth
- `/home/mani/kitty-data/usage.db` — Token usage, costs, daily summaries
- Always use `.backup` command for safe SQLite backups

## S3 Backup
- Daily backup of all databases, logs, and workspace to AWS S3
- Script: `/home/mani/kitty-data/scripts/backup.sh`
- Bucket: configured via `${S3_BACKUP_BUCKET}`
