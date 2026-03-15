from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq


_FALLBACK_VERDICT = {
    "risk_level": "MEDIUM",
    "risk_score": 50,
    "explanation": "Analysis unavailable. Treat with caution.",
    "recommended_action": "Do not click any links. Contact IT support.",
    "key_indicators": [],
}

_SYSTEM_MESSAGE = (
    "You are Vexor, a cybersecurity AI specialized in detecting phishing emails "
    "targeting Azerbaijani businesses and government entities. Analyze all "
    "provided signals and return ONLY a JSON verdict."
)

AZERBAIJANI_URGENCY = [
    "təcili",
    "dərhal",
    "bloklanıb",
    "hesabınız",
    "təsdiqləyin",
    "müddəti bitib",
    "ləğv edilib",
    "xəbərdarlıq",
    "diqqət",
    "məcburidir",
    "son tarix",
    "dondurulub",
    "silinəcək",
]

RUSSIAN_URGENCY = [
    "срочно",
    "немедленно",
    "заблокирован",
    "подтвердите",
    "истекает",
    "удалён",
    "предупреждение",
    "обязательно",
]

ENGLISH_URGENCY = [
    "urgent",
    "immediately",
    "suspended",
    "verify",
    "blocked",
    "expires",
    "deleted",
    "warning",
    "mandatory",
    "action required",
    "click now",
    "limited time",
]


def synthesize_verdict(
    email_body: str,
    sender_email: str,
    entity_result: dict,
    email_analysis: dict,
    url_analysis: dict,
    weighted_score: float = 0.0,
    reply_to_mismatch: bool = False,
) -> dict:
    try:
        load_dotenv(Path(__file__).resolve().parents[2] / ".env")
        groq_api_key = os.getenv("GROQ_API_KEY")
        client = Groq(api_key=groq_api_key)

        email_lower = email_body.lower()
        found_urgency = []
        for word in AZERBAIJANI_URGENCY + RUSSIAN_URGENCY + ENGLISH_URGENCY:
            if word in email_lower:
                found_urgency.append(word)

        urgency_language = (
            "Azerbaijani"
            if any(word in found_urgency for word in AZERBAIJANI_URGENCY)
            else "Russian"
            if any(word in found_urgency for word in RUSSIAN_URGENCY)
            else "English/Unknown"
        )

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": _SYSTEM_MESSAGE},
                {
                    "role": "user",
                    "content": f"""Analyze this email for phishing targeting Azerbaijani organizations:

    SENDER: {sender_email}
    EMAIL BODY: {email_body}

    SIGNAL 1 - Email content analysis (DistilBERT):
    is_phishing: {email_analysis.get('is_phishing')}
    phishing_score: {email_analysis.get('phishing_score')}%

    SIGNAL 2 - URL analysis:
    max_phishing_score: {url_analysis.get('max_phishing_score')}%
    url_results: {url_analysis.get('results')}

    SIGNAL 3 - Azerbaijan government entity check:
    entity_found: {entity_result.get('entity_found')}
    matched_org: {entity_result.get('matched_org')}
    domain_mismatch: {entity_result.get('mismatch')}
    confidence: {entity_result.get('confidence')}%

    SIGNAL 4 - Urgency language detected:
    found_urgency_keywords: {found_urgency}
    language_of_urgency: {urgency_language}

    SIGNAL 5 - Weighted confidence score (email*0.3 + url*0.3 + entity*0.4):
    weighted_score: {weighted_score}/100
    (entity check has highest weight because opendata.az validation is the most reliable signal)

    SIGNAL 6 - Reply-To mismatch: {reply_to_mismatch}
    (True means reply-to domain differs from sender domain  strong phishing indicator)

    RULES (must follow strictly):
    - If domain_mismatch is True  risk_level MUST be CRITICAL, risk_score >= 90
    - If email phishing_score > 70%  HIGH minimum
    - If url max_phishing_score > 60%  HIGH minimum
    - If sender domain is .ru .xyz .tk .top .click  HIGH minimum
    - Urgency words (urgent, immediately, suspend, verify)  bump up one level
    - If found_urgency_keywords contains ANY Azerbaijani or Russian words  risk_score += 10, this indicates a locally-crafted targeted attack
    - Use weighted_score as a baseline for risk_score, adjust up/down based on other signals
    - If reply_to_mismatch is True  bump risk_level up one level, add "reply-to mismatch" to key_indicators
    - Always include detected urgency keywords in key_indicators

    Return ONLY this JSON:
    {{
      "risk_level": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
      "risk_score": integer 0-100,
      "explanation": "2 sentences max explaining the verdict",
      "recommended_action": "specific action the user should take",
      "key_indicators": ["list", "of", "red", "flags", "found"]
    }}
    """,
                },
            ],
        )
        return json.loads(completion.choices[0].message.content)
    except Exception:
        return dict(_FALLBACK_VERDICT)
