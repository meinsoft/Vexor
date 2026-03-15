from __future__ import annotations

import os
from pathlib import Path

import httpx
from dotenv import load_dotenv


_FALLBACK_ANALYSIS = {
    "is_phishing": False,
    "phishing_score": 0.0,
    "all_labels": {},
}


def analyze_email(email_body: str) -> dict:
    try:
        load_dotenv(Path(__file__).resolve().parents[2] / ".env")

        hf_api_key = os.getenv("HUGGINGFACE_API_KEY")
        api_url = (
            "https://router.huggingface.co/hf-inference/models/"
            "cybersectony/phishing-email-detection-distilbert_v2.4.1"
        )

        headers = {"Authorization": f"Bearer {hf_api_key}"}
        payload = {"inputs": email_body[:512]}

        response = httpx.post(api_url, headers=headers, json=payload, timeout=15)
        results = response.json()

        scores = {item["label"]: item["score"] for item in results[0]}
        phishing_score = (scores.get("LABEL_1", 0) + scores.get("LABEL_3", 0)) * 100
        is_phishing = phishing_score > 50

        return {
            "is_phishing": is_phishing,
            "phishing_score": round(phishing_score, 2),
            "all_labels": scores,
        }
    except Exception:
        return dict(_FALLBACK_ANALYSIS)
