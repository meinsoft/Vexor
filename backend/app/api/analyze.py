import json
import re

from fastapi import APIRouter, Depends, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import AnalysisLog, get_db
from app.main import limiter
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.email_analyzer import analyze_email
from app.services.grok_synthesizer import synthesize_verdict
from app.services.opendata_client import validate_entity
from app.services.url_scanner import scan_urls


router = APIRouter()
security = HTTPBearer(auto_error=False)

_URL_PATTERN = r'https?://[^\s<>"{}|\\^`\[\]]+'
KEYWORD_TO_ORG = {
    "mərkəzi bank": "Mərkəzi Bank",
    "merkezi bank": "Mərkəzi Bank",
    "mərkəzi bankı": "Mərkəzi Bank",
    "bankınız": "Mərkəzi Bank",
    "asan xidmət": "ASAN",
    "asan service": "ASAN",
    "asan": "ASAN",
    "vergilər": "Vergilər Nazirliyi",
    "vergi": "Vergilər Nazirliyi",
    "maliyyə": "Maliyyə Nazirliyi",
    "gömrük": "Gömrük Komitəsi",
    "dövlət": "Dövlət",
    "nazirlik": "Nazirlik",
    "ministry": "Nazirlik",
    "bank": "Mərkəzi Bank",
}


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit("10/minute")
async def analyze(
    payload: AnalyzeRequest,
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    domain = (
        payload.sender_email.split("@")[-1]
        if "@" in payload.sender_email
        else payload.sender_email
    )

    reply_to_mismatch = False
    if payload.reply_to:
        reply_to_domain = re.search(r"@([\w.-]+)", payload.reply_to)
        sender_domain_clean = domain
        if reply_to_domain and reply_to_domain.group(1) != sender_domain_clean:
            reply_to_mismatch = True

    institution_name = domain
    email_lower = payload.email_body.lower()
    for keyword, org_name in KEYWORD_TO_ORG.items():
        if keyword in email_lower:
            institution_name = org_name
            break

    urls = re.findall(_URL_PATTERN, payload.email_body)

    email_result = analyze_email(payload.email_body)
    url_result = scan_urls(urls)
    if domain.endswith(".az"):
        entity_result = {
            "entity_found": False,
            "matched_org": None,
            "mismatch": False,
            "confidence": 0,
        }
    else:
        entity_result = validate_entity(institution_name, domain)

    entity_score = (
        100.0
        if entity_result.get("mismatch")
        else (
            entity_result.get("confidence", 0)
            if entity_result.get("entity_found")
            else 0
        )
    )
    email_score = email_result.get("phishing_score", 0)
    url_score = url_result.get("max_phishing_score", 0)

    weighted_score = (email_score * 0.3) + (url_score * 0.3) + (entity_score * 0.4)
    weighted_score = round(weighted_score, 2)

    verdict = synthesize_verdict(
        payload.email_body,
        payload.sender_email,
        entity_result,
        email_result,
        url_result,
        weighted_score,
        reply_to_mismatch,
    )

    saved_log_id = None
    try:
        user_id = None
        if credentials and credentials.credentials:
            current_user = get_current_user(token=credentials.credentials, db=db)
            user_id = current_user.id

        log = AnalysisLog(
            user_id=user_id,
            risk_level=verdict["risk_level"],
            risk_score=verdict["risk_score"],
            sender_domain=domain,
            domain_mismatch=entity_result["mismatch"],
            reply_to_mismatch=reply_to_mismatch,
            matched_org=entity_result.get("matched_org"),
            email_phishing_score=email_result["phishing_score"],
            url_phishing_score=url_result["max_phishing_score"],
            weighted_confidence_score=weighted_score,
            key_indicators=json.dumps(verdict.get("key_indicators", [])),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        saved_log_id = log.id
    except Exception:
        db.rollback()

    return AnalyzeResponse(
        risk_level=verdict["risk_level"],
        risk_score=verdict["risk_score"],
        explanation=verdict["explanation"],
        recommended_action=verdict["recommended_action"],
        domain_mismatch=entity_result["mismatch"],
        reply_to_mismatch=reply_to_mismatch,
        key_indicators=verdict.get("key_indicators", []),
        email_phishing_score=email_result["phishing_score"],
        url_phishing_score=url_result["max_phishing_score"],
        weighted_confidence_score=weighted_score,
        matched_org=entity_result.get("matched_org"),
        log_id=saved_log_id,
    )
