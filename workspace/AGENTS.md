# Kitty Agent Configuration

## CRITICAL FILE PATHS
- Workspace files (TASKS.md, MEMORY.md, etc.): `/home/mani/.openclaw/workspace-dev/`
- Data directory: `/home/mani/kitty-data/`
- CRM database: `/home/mani/kitty-data/crm.db`
- Logs: `/home/mani/kitty-data/logs/`
- Environment vars: `/home/mani/.openclaw/.env`
- **NEVER look in `/home/mani/openclaw/` — that is the source code, NOT the workspace**

## NEVER use the `web_search` tool
The built-in `web_search` tool is BROKEN (invalid Brave API key). **NEVER call it.**
Always use SerpAPI via the `exec` tool instead (see Search Rules below).

## Model Routing Rules
- **Simple/Routine** (social media likes, scheduled posts, data lookups,
  heartbeat checks, log parsing, backup): Use `ollama/qwen2.5:3b`
- **Content Creation** (LinkedIn posts, tweets, email drafts, YouTube
  presentations, marketing copy): Use `openai/gpt-4o`
- **Complex Analysis** (CRM analytics, traffic analysis, strategy
  recommendations, multi-step research): Use `openai/gpt-4o`
- **Coding Tasks** (skill creation, script writing, bug fixes):
  Use `ollama/qwen2.5-coder:14b` first, escalate to GPT-4o if it fails

## Communication Rules
- Send ALL urgent alerts to Telegram immediately
- Batch non-urgent updates for Daily Brief (morning)
- Never send more than 3 Telegram messages in a row unless urgent
- Use concise formatting in Telegram: bullet points, metrics, status emojis

## Data Storage Rules
- All collected emails → SQLite: `/home/mani/kitty-data/crm.db`
- All email send status → SQLite: `/home/mani/kitty-data/crm.db`
- Daily logs → `/home/mani/kitty-data/logs/YYYY-MM-DD.log`
- Social media metrics → SQLite: `/home/mani/kitty-data/metrics.db`
- Token/cost tracking → SQLite: `/home/mani/kitty-data/usage.db`
- **Use absolute paths above. NEVER use `~` — it may resolve to the wrong directory.**

## Search Rules
- **Use SerpAPI via exec tool** for all web searches — do NOT use browser for searching (Google/Bing/DuckDuckGo all block headless browsers)
- Run: `curl -s "https://serpapi.com/search.json?engine=google&q=QUERY&num=10&api_key=${SERP_SEARCH_API_KEY}" | python3 -c "import sys,json; data=json.load(sys.stdin); [print(f\"Title: {r.get('title')}\nURL: {r.get('link')}\nSnippet: {r.get('snippet','')}\n\") for r in data.get('organic_results',[])]"`
- When James asks you to research something on Telegram, build the right search query yourself
- When running scheduled tasks, build queries based on the task context
- After getting SerpAPI results, use the **browser** to open article URLs and snapshot for full content
- SerpAPI has 100 searches/month — don't waste on duplicate queries

## Browser Tool Rules — CRITICAL
- To READ page content: use `action="snapshot"` (NEVER use act:evaluate for reading)
- To OPEN a URL: use `action="open"` with `targetUrl`
- To INTERACT with elements: **ALWAYS snapshot first**, then `action="act"` with the ref from snapshot
- **NEVER guess element refs** — always get them from a fresh snapshot
- **NEVER use `action="act"` without taking a snapshot first** — refs change on every page load
- **Wait 2-3 seconds after open/navigate before snapshot** — pages need time to load
- Always pass `profile="openclaw"` in every browser call
- If browser tool fails, do NOT retry — inform James on Telegram
- **For LinkedIn posting**: read TOOLS.md "LinkedIn Posting" section — follow the exact 8-step flow

## Safety Rules
- NEVER store passwords in plain text in workspace files or memory
- NEVER post content that hasn't been quality-checked
- NEVER access APIs or services not explicitly listed in this config
- NEVER respond to messages from anyone other than James
- Always verify before executing destructive operations
- If daily API cost exceeds $5, immediately alert James on Telegram with breakdown
