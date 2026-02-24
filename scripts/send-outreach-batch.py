#!/usr/bin/env python3
"""
Sends outreach emails to all 'new' leads in CRM that have valid email addresses.
Skips duplicates, tracks sends in emails_sent table, updates lead status.
"""

import os
import sys
import sqlite3
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

CRM_DB = "/home/mani/kitty-data/crm.db"

def get_email_body(company_name):
    return f"""Hi {company_name} Team,

I'm James Williams, founder of AnalyticKit — an open-source Web3 analytics platform that helps blockchain projects and marketing teams track onchain events, user journeys, and campaign performance in real time.

I noticed your team works in the Web3 space and thought there might be a great opportunity to collaborate. AnalyticKit provides:

- Real-time onchain event tracking and user analytics
- Privacy-first, open-source platform (no vendor lock-in)
- Custom dashboards for DeFi, NFT, and token metrics
- Integration with major EVM chains

I'd love to show you a quick demo and explore how AnalyticKit could add value to your clients' projects.

Would you be open to a 15-minute call this week? You can book a time here:
https://calendly.com/analytickit

Looking forward to connecting!

Best regards,
James Williams
Founder, AnalyticKit
https://analytickit.com

---
If you'd prefer not to receive emails from us, simply reply with "unsubscribe" and we'll remove you from our list."""

def main():
    # Load SMTP config
    host = os.environ.get("SMTP_HOST")
    port = os.environ.get("SMTP_PORT")
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    from_addr = os.environ.get("SMTP_FROM")

    if not all([host, port, user, password, from_addr]):
        print("ERROR: Missing SMTP environment variables")
        sys.exit(1)

    db = sqlite3.connect(CRM_DB)
    db.row_factory = sqlite3.Row

    # Get unique new leads with emails
    leads = db.execute("""
        SELECT id, name, email, company
        FROM leads
        WHERE email IS NOT NULL AND email != '' AND status = 'new'
        ORDER BY id
    """).fetchall()

    if not leads:
        print("No new leads to email")
        return

    # Deduplicate by email
    seen_emails = set()
    unique_leads = []
    for lead in leads:
        if lead["email"].lower() not in seen_emails:
            seen_emails.add(lead["email"].lower())
            unique_leads.append(lead)

    print(f"Found {len(unique_leads)} unique leads to email (from {len(leads)} total)")

    # Connect to SMTP once
    try:
        server = smtplib.SMTP(host, int(port), timeout=30)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(user, password)
    except Exception as e:
        print(f"ERROR: SMTP connection failed: {e}")
        sys.exit(1)

    sent = 0
    failed = 0

    for lead in unique_leads:
        subject = f"Web3 Analytics for {lead['name']} — AnalyticKit Demo"
        body = get_email_body(lead["name"])

        msg = MIMEMultipart("alternative")
        msg["From"] = f"James Williams - AnalyticKit <{from_addr}>"
        msg["To"] = lead["email"]
        msg["Subject"] = subject
        msg["Reply-To"] = from_addr
        msg.attach(MIMEText(body, "plain", "utf-8"))

        try:
            server.sendmail(from_addr, [lead["email"]], msg.as_string())

            # Record in emails_sent
            db.execute(
                "INSERT INTO emails_sent (lead_id, subject, body, status) VALUES (?, ?, ?, ?)",
                (lead["id"], subject, body, "sent")
            )
            # Update lead status
            db.execute("UPDATE leads SET status = 'contacted' WHERE id = ?", (lead["id"],))
            db.commit()

            sent += 1
            print(f"  OK: Sent to {lead['email']} ({lead['name']})")

            # Small delay between sends to avoid rate limiting
            time.sleep(2)

        except Exception as e:
            failed += 1
            db.execute(
                "INSERT INTO emails_sent (lead_id, subject, body, status) VALUES (?, ?, ?, ?)",
                (lead["id"], subject, body, f"failed: {str(e)[:100]}")
            )
            db.commit()
            print(f"  FAIL: {lead['email']} — {e}")

    # Also mark duplicates as 'contacted' if original was contacted
    for lead in leads:
        if lead["email"].lower() in seen_emails:
            db.execute("UPDATE leads SET status = 'contacted' WHERE id = ? AND status = 'new'", (lead["id"],))
    db.commit()

    server.quit()
    db.close()

    print(f"\nDONE: {sent} sent, {failed} failed, {len(unique_leads)} total")

if __name__ == "__main__":
    main()
