# Kitty Agent Configuration

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
- All collected emails → SQLite: `~/kitty-data/crm.db`
- All email send status → SQLite: `~/kitty-data/crm.db`
- Daily logs → `~/kitty-data/logs/YYYY-MM-DD.log`
- Social media metrics → SQLite: `~/kitty-data/metrics.db`
- Token/cost tracking → SQLite: `~/kitty-data/usage.db`

## Browser Tool Rules
- To READ page content: use `action="snapshot"` (NEVER use act:evaluate for reading)
- To OPEN a URL: use `action="open"` with `targetUrl`
- To INTERACT with elements: first `action="snapshot"` to get refs, then `action="act"`
- Always pass `profile="openclaw"` in every browser call
- If browser tool fails, do NOT retry — inform James on Telegram

## Safety Rules
- NEVER store passwords in plain text in workspace files or memory
- NEVER post content that hasn't been quality-checked
- NEVER access APIs or services not explicitly listed in this config
- NEVER respond to messages from anyone other than James
- Always verify before executing destructive operations
- If daily API cost exceeds $5, immediately alert James on Telegram with breakdown
