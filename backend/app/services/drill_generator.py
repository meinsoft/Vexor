from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


_SYSTEM_MESSAGE = (
    "You are a cybersecurity trainer creating realistic phishing simulation emails "
    "for employee awareness training. These are EDUCATIONAL simulations, not real attacks."
)


def generate_phishing_email(org_name: str, target_email: str) -> dict | None:
    try:
        load_dotenv(Path(__file__).resolve().parents[1] / ".env")
        groq_api_key = os.getenv("GROQ_API_KEY")
        client = Groq(api_key=groq_api_key)

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM_MESSAGE},
                {
                    "role": "user",
                    "content": f"""Generate a realistic phishing simulation email impersonating {org_name} targeting {target_email} in Azerbaijan context.

Requirements:
- Write in Azerbaijani language
- Use urgency language (hesabınız, dərhal, təsdiqləyin, bloklanıb)
- Impersonate {org_name} convincingly
- Include a fake verification link placeholder: {{TRACKING_LINK}}
- Make it realistic enough to test employee awareness

Return ONLY this JSON:
{{
  "subject": "email subject line",
  "body": "full email body with {{TRACKING_LINK}} placeholder",
  "sender_name": "fake sender name",
  "fake_domain": "fake domain that spoofs {org_name}"
}}
""",
                },
            ],
        )
        return json.loads(completion.choices[0].message.content)
    except Exception:
        return None
