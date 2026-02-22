#!/usr/bin/env python3
"""
Usage: python3 send-email.py <to_email> <subject> <body>
  or:  python3 send-email.py <to_email> <subject> <body> [--html]

Sends an email via SMTP using credentials from environment variables.
Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
"""

import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def main():
    if len(sys.argv) < 4:
        print("ERROR: Usage: send-email.py <to_email> <subject> <body> [--html]", file=sys.stderr)
        sys.exit(1)

    to_email = sys.argv[1]
    subject = sys.argv[2]
    body = sys.argv[3]
    is_html = "--html" in sys.argv

    # Read SMTP config from environment
    host = os.environ.get("SMTP_HOST")
    port = os.environ.get("SMTP_PORT")
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    from_addr = os.environ.get("SMTP_FROM")

    missing = []
    if not host: missing.append("SMTP_HOST")
    if not port: missing.append("SMTP_PORT")
    if not user: missing.append("SMTP_USER")
    if not password: missing.append("SMTP_PASSWORD")
    if not from_addr: missing.append("SMTP_FROM")

    if missing:
        print(f"ERROR: Missing environment variables: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    # Build email
    msg = MIMEMultipart("alternative")
    msg["From"] = f"AnalyticKit <{from_addr}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Reply-To"] = from_addr

    if is_html:
        msg.attach(MIMEText(body, "html", "utf-8"))
    else:
        msg.attach(MIMEText(body, "plain", "utf-8"))

    # Send
    try:
        server = smtplib.SMTP(host, int(port), timeout=30)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(user, password)
        server.sendmail(from_addr, [to_email], msg.as_string())
        server.quit()
        print(f"SUCCESS: Email sent to {to_email}")
    except smtplib.SMTPAuthenticationError as e:
        print(f"ERROR: SMTP authentication failed: {e}", file=sys.stderr)
        sys.exit(1)
    except smtplib.SMTPException as e:
        print(f"ERROR: SMTP error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
