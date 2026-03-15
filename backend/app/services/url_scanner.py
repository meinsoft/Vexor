from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


_EMPTY_RESULT = {"urls_checked": 0, "max_phishing_score": 0.0, "results": []}

_SYSTEM_MESSAGE = (
    "You are a cybersecurity URL analyzer. Analyze URLs for phishing indicators "
    "and return ONLY JSON."
)


def scan_urls(urls: list[str]) -> dict:
    if not urls:
        return dict(_EMPTY_RESULT)

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
                    "content": f"""Analyze these URLs for phishing. Check for:
    - Suspicious TLDs (.ru, .xyz, .tk, .top, .click)
    - Domain spoofing (e.g. asan-service.ru, mərkəzibank-az.com)
    - Misleading subdomains
    - URL shorteners
    - Azerbaijani government domain impersonation (.gov.az spoofing)

    URLs: {urls}

    Return ONLY this JSON:
    {{
      "urls_checked": <count>,
      "max_phishing_score": <highest score 0-100>,
      "results": [
        {{"url": "...", "phishing_score": 0-100, "reason": "short reason"}}
      ]
    }}
    """,
                },
            ],
        )
        return json.loads(completion.choices[0].message.content)
    except Exception:
        return {"urls_checked": len(urls), "max_phishing_score": 50.0, "results": []}
