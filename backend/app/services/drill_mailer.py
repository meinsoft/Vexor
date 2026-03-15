from __future__ import annotations

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv


def send_drill_email(
    target_email: str,
    subject: str,
    body: str,
    sender_name: str,
    fake_domain: str,
    tracking_token: str,
    base_url: str = "http://localhost:8000",
) -> bool:
    try:
        load_dotenv(Path(__file__).resolve().parents[1] / ".env")
        gmail_user = os.getenv("GMAIL_USER")
        gmail_password = os.getenv("GMAIL_APP_PASSWORD")
        if not gmail_user or not gmail_password:
            return False

        tracking_link = f"{base_url}/drill/track/{tracking_token}"
        final_body = body.replace("{TRACKING_LINK}", tracking_link)

        message = MIMEMultipart()
        message["From"] = f"{sender_name} <{gmail_user}>"
        message["To"] = target_email
        message["Subject"] = subject
        message.attach(MIMEText(final_body, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(gmail_user, gmail_password)
            smtp.send_message(message)

        return True
    except Exception:
        return False
