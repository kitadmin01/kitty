# Kitty's Task List

## Daily Tasks

### 1. Daily Brief (7:00 AM)
Generate and send to Telegram:
- Yesterday's performance: leads collected, emails sent, responses received
- Social media: LinkedIn posts/engagement, Twitter tweets/likes, follower changes
- YouTube: view/subscriber changes
- Token & cost report: total tokens by provider, total USD, breakdown by task
- Today's schedule: queued tasks, pending items, priorities
- Alerts & recommendations: urgent items, strategy suggestions

### 2. LinkedIn Personal Post (9:00 AM)
- Search trending Web3/blockchain news via Google (browser)
- Write engaging post with 3-5 hashtags (#Web3 #Blockchain #Analytics #DeFi #Marketing)
- Post to James's personal profile: https://www.linkedin.com/in/james-williams-91381416/
- Log post content and URL to ~/kitty-data/logs/

### 3. LinkedIn Company Post (1:00 PM)
- Focus on AnalyticKit product features, blog content, or Web3 analytics insights
- Post to company page: https://www.linkedin.com/company/analytickit/
- Log post content and URL

### 4. LinkedIn Engagement (11:00 AM and 3:00 PM)
- Scroll LinkedIn feed via browser
- Like 10-15 relevant Web3/blockchain/analytics posts
- Leave 3-5 thoughtful comments on the most relevant ones
- Accept connection requests from Web3 professionals
- Log all interactions

### 5. Twitter/X Posts (8 AM, 10 AM, 1 PM, 4 PM, 7 PM)
- Post 5 tweets daily on https://x.com/analytic_kit
- Topics: AnalyticKit features, Web3 analytics, AI + blockchain, industry insights
- Use relevant hashtags
- Post via browser automation
- Log each tweet

### 6. Twitter/X Engagement (every 10 min, 6 AM - 11 PM)
- Search for recent posts about web3, crypto, blockchain, AI, DeFi
- Like 3-5 relevant posts per session
- Do NOT like spam or offensive content
- If rate-limited: reduce frequency, alert James on Telegram

### 7. Lead Research & Email Outreach (10:00 AM)
- Search Google, LinkedIn, and Twitter via browser for Web3 marketing companies and professionals
- Collect 10-20 new leads: name, email, company, LinkedIn URL, Twitter handle
- Store in CRM: ~/kitty-data/crm.db
- Draft personalized outreach emails (use GPT-4o for quality)
- Include Calendly link: https://calendly.com/analytickit
- Send emails and log status

### 8. Email Follow-ups (2:00 PM)
- Check CRM for leads contacted 3+ days ago with no response
- Draft and send follow-up emails
- Update CRM status

### 9. End-of-Day Summary (9:00 PM)
- Tasks completed today, any failures, pending for tomorrow
- Send to Telegram — keep it short (5-10 lines max)

### 10. Git Push (11:00 PM)
- Commit and push changes in ~/kitty-data/ to git
- Descriptive commit message with today's date
- NEVER commit secrets/ folder or .env files

### 11. S3 Backup (3:00 AM)
- Run ~/kitty-data/scripts/backup.sh
- Back up: crm.db, metrics.db, usage.db, logs/, workspace/
- Verify upload succeeded
- If backup fails, send urgent alert to Telegram

## Weekly Tasks

### 12. YouTube Topic Research (Thursday 10:00 AM)
- Research trending Web3 and AnalyticKit topics
- Analyze past videos on https://www.youtube.com/@AnalyticKit
- Suggest 3 topic options with brief outlines
- Send to Telegram for James to choose

### 13. YouTube Presentation (Friday 10:00 AM)
- Create 15-20 slide presentation on the chosen topic
- Include speaker notes
- Save to ~/kitty-data/youtube/

### 14. YouTube Script (Saturday 10:00 AM)
- Draft 15-20 minute video script
- Include intro hook, key points, transitions
- CTA: subscribe, check out AnalyticKit
- Send script to Telegram

### 15. YouTube Package (Sunday 7:00 AM)
- Package: presentation, script, thumbnail suggestions
- SEO-optimized title, description, and tags
- Send summary to Telegram

### 16. Website Traffic Analysis (Monday 8:00 AM)
- Access https://dpa.analytickit.com/ via browser
- Report: traffic trends, top referral sources, top pages
- SEO recommendations for Google search
- LLM visibility recommendations (Claude, ChatGPT, Perplexity)
- Actionable items for the week
- Send full report to Telegram

### 17. Security Audit (Sunday 10:00 PM)
- Run `openclaw doctor` and report warnings
- Verify gateway is bound to loopback only
- Check for unauthorized API calls in logs
- Verify .env file permissions are 600
- Verify Telegram allowlist has only James's ID
- Report any anomalies to Telegram immediately

## Goals & KPIs
- LinkedIn: 1-3K new followers per month
- Twitter/X: 10K followers in one month
- YouTube: Increase views and subscriptions weekly
- Lead Gen: Collect emails, send demo invites, book Calendly meetings
- Cost: Keep daily API spend under $5

## Key Resources
- AnalyticKit website: https://analytickit.com
- AnalyticKit blog: https://analytickit.com/blog
- Demo booking: https://calendly.com/analytickit
- Analytics dashboard: https://dpa.analytickit.com/
- GitHub: https://github.com/kitadmin01
