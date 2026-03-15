from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


_FALLBACK_ANALYSIS = {
    "is_phishing": False,
    "phishing_score": 0.0,
    "reasoning": "Analysis unavailable",
    "confidence": "LOW",
}

_SYSTEM_MESSAGE = (
    "You are an expert email security analyst. Analyze emails for phishing indicators "
    "and return ONLY a JSON object. You understand context  a legitimate HR email from "
    "a real company asking for documents is NOT phishing. A fake bank email with urgency "
    "and suspicious domains IS phishing."
)


def analyze_email(email_body: str, sender_email: str = "") -> dict:
    try:
        load_dotenv(Path(__file__).resolve().parents[2] / ".env")
        groq_api_key = os.getenv("GROQ_API_KEY")
        client = Groq(api_key=groq_api_key)

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM_MESSAGE},
                {
                    "role": "user",
                    "content": f"""Analyze this email for phishing. Consider full context before scoring.

SENDER: {sender_email}
EMAIL BODY: {email_body}

Legitimate indicators (reduce score):
- Official .az domains (kapitalbank.az, mygov.az, asan.gov.az, e-cbar.az, findoc.az)
- Professional HR/recruitment language
- Real company portals mentioned
- No urgency pressure
- No suspicious external links

Phishing indicators (increase score):
- Urgency language (suspended, verify immediately, expires)
- Suspicious TLDs (.ru, .xyz, .tk, .top)
- Domain spoofing (mərkəzibank-az.ru pretending to be bank)
- Mismatched sender domain
- Requests for passwords or financial credentials

Return ONLY this JSON:
{{
  "is_phishing": true or false,
  "phishing_score": 0-100 (0=definitely safe, 100=definitely phishing),
  "reasoning": "one sentence why",
  "confidence": "HIGH" or "MEDIUM" or "LOW"
}}

Be conservative  legitimate business emails should score under 30.
Only score above 70 if there are clear phishing indicators.""",
                },
            ],
        )
        return json.loads(completion.choices[0].message.content)
    except Exception:
        return dict(_FALLBACK_ANALYSIS)
