import argparse
import os
import time

from dotenv import load_dotenv

from crawler import check_page
from notifier import send_email_smtp


def parse_args():
    parser = argparse.ArgumentParser(
        description="Simple web crawler MVP: check CSS selector or text and notify via email."
    )
    parser.add_argument("url", help="Page URL to check")
    parser.add_argument("--selector", help="CSS selector to search (takes precedence)")
    parser.add_argument("--text", help="Plain text to search if no selector is provided")
    parser.add_argument(
        "--interval",
        type=int,
        default=3,
        help="Interval in hours between checks (default: 3)",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run only one check and exit",
    )
    return parser.parse_args()


def main():
    load_dotenv()
    args = parse_args()

    if not args.selector and not args.text:
        raise SystemExit("Provide --selector or --text")

    smtp_host = os.getenv("SMTP_HOST", "smtp.mail.yahoo.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    email_from = os.getenv("EMAIL_FROM")
    email_to = os.getenv("EMAIL_TO")

    if not smtp_user or not smtp_pass or not email_from or not email_to:
        raise SystemExit("Set SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO in .env or env vars")

    while True:
        found, detail = check_page(args.url, args.selector, args.text)
        if found:
            subject = "Crawler alert"
            message = f"Found match on {args.url}: {detail}"
            send_email_smtp(
                smtp_host,
                smtp_port,
                smtp_user,
                smtp_pass,
                email_from,
                email_to,
                subject,
                message,
            )
            print(message)
        else:
            print(f"No match on {args.url} ({detail})")

        if args.once:
            break

        time.sleep(args.interval * 3600)


if __name__ == "__main__":
    main()
