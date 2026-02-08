import smtplib
from email.message import EmailMessage


def send_email_smtp(
    host: str,
    port: int,
    username: str,
    password: str,
    email_from: str,
    email_to: str,
    subject: str,
    content: str,
) -> None:
    msg = EmailMessage()
    msg["From"] = email_from
    msg["To"] = email_to
    msg["Subject"] = subject
    msg.set_content(content)

    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(username, password)
        server.send_message(msg)
