# Kitty's Task List

## Daily Tasks


### 1. LinkedIn Personal Post (9:00 AM)
- Search trending Web3/blockchain news via SerpAPI (exec tool)
- Write engaging post with 3-5 hashtags (#Web3 #Blockchain #Analytics #DeFi #Marketing)
- Post to James's personal profile: https://www.linkedin.com/in/james-williams-91381416/
- Log post content and URL to ~/kitty-data/logs/

### 2. LinkedIn Company Post (1:00 PM)
- Focus on AnalyticKit product features, blog content, or Web3 analytics insights
- Post to company page: https://www.linkedin.com/company/analytickit/
- Log post content and URL



### 3. Send AnalyticKit Demo Request email (10:00 AM)
- From /home/mani/kitty-data/linkedin/linkedin_leads.xlsx read linkedin_url, emails, identify the location=US, current_title=founder, cofounder, marketing head, etc. Use the linkedin_url to open the linkedin page and send email.
- Use the below email format.
Hi [First Name],

I'm building Analytickit, a Web2 + Web3 analytics platform that combines website behavior data with on-chain activity to give deeper insights into user journeys.

I'm not reaching out to sell anything. I'm looking for a few thoughtful people who'd be open to a short demo and willing to give honest feedback — what's useful, what's confusing, what's missing, and what doesn't matter.

If you're open to a quick 20–30 minute walkthrough sometime in the next couple of weeks, I'd really value your perspective.

No pressure at all — just trying to make the product better.

Thanks,
James
- Store in CRM: ~/kitty-data/crm.db
- Draft personalized outreach emails (use GPT-4o for quality)
- Include Calendly link: https://calendly.com/analytickit
- Send emails and log status


### 4. S3 Backup (3:00 AM)
- Run ~/kitty-data/scripts/backup.sh
- Back up: crm.db, metrics.db, usage.db, logs/, workspace/
- Verify upload succeeded
- If backup fails, send urgent alert to Telegram

## Weekly Tasks

### 5. Website Traffic Analysis (Monday 8:00 AM)
- Access https://dpa.analytickit.com/ via browser
- Report: traffic trends, top referral sources, top pages
- SEO recommendations for Google search
- LLM visibility recommendations (Claude, ChatGPT, Perplexity)
- Actionable items for the week
- Send full report to Telegram

### 6. Security Audit (Sunday 10:00 PM)
- Verify gateway is bound to loopback only
- Check for unauthorized API calls in logs
- Verify .env file permissions are 600
- Verify Telegram allowlist has only James's ID
- Report any anomalies to Telegram immediately

## Goals & KPIs
- LinkedIn: 1-3K new followers per month
- Twitter/X: Post daily via API, grow following
- Lead Gen: Collect emails, send demo invites, book Calendly meetings
- Cost: Keep daily API spend under $5

## Key Resources
- AnalyticKit website: https://analytickit.com
- AnalyticKit blog: https://analytickit.com/blog
- Demo booking: https://calendly.com/analytickit
- Analytics dashboard: https://dpa.analytickit.com/
- GitHub: https://github.com/kitadmin01
