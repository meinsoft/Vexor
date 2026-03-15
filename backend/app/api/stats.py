from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import AnalysisLog, User, get_db


router = APIRouter()


def _safe_parse_indicators(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def _serialize_log(log: AnalysisLog) -> dict:
    return {
        "id": log.id,
        "timestamp": log.timestamp.isoformat(),
        "risk_level": log.risk_level,
        "risk_score": log.risk_score,
        "sender_domain": log.sender_domain,
        "domain_mismatch": log.domain_mismatch,
        "reply_to_mismatch": log.reply_to_mismatch,
        "matched_org": log.matched_org,
        "email_phishing_score": log.email_phishing_score,
        "url_phishing_score": log.url_phishing_score,
        "weighted_confidence_score": log.weighted_confidence_score,
        "key_indicators": _safe_parse_indicators(log.key_indicators),
    }


@router.get("/me")
def stats_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(AnalysisLog)
        .filter(AnalysisLog.user_id == current_user.id)
        .order_by(AnalysisLog.timestamp.desc())
        .all()
    )

    total_analyses = len(logs)
    critical_count = sum(1 for log in logs if log.risk_level.upper() == "CRITICAL")
    high_count = sum(1 for log in logs if log.risk_level.upper() == "HIGH")
    medium_count = sum(1 for log in logs if log.risk_level.upper() == "MEDIUM")
    low_count = sum(1 for log in logs if log.risk_level.upper() == "LOW")

    domain_mismatch_rate = (
        round(sum(1 for log in logs if log.domain_mismatch) * 100 / total_analyses, 2)
        if total_analyses
        else 0.0
    )
    avg_risk_score = (
        round(sum(log.risk_score for log in logs) / total_analyses, 2)
        if total_analyses
        else 0.0
    )

    top_targeted_orgs = [
        {"org": org, "count": count}
        for org, count in (
            db.query(AnalysisLog.matched_org, func.count(AnalysisLog.id))
            .filter(
                AnalysisLog.user_id == current_user.id,
                AnalysisLog.matched_org.is_not(None),
            )
            .group_by(AnalysisLog.matched_org)
            .order_by(func.count(AnalysisLog.id).desc())
            .limit(5)
            .all()
        )
    ]

    return {
        "total_analyses": total_analyses,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "domain_mismatch_rate": domain_mismatch_rate,
        "avg_risk_score": avg_risk_score,
        "top_targeted_orgs": top_targeted_orgs,
        "recent_analyses": [_serialize_log(log) for log in logs[:10]],
        "member_since": current_user.created_at.isoformat(),
        "company": current_user.company,
    }


@router.get("/overview")
def stats_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user

    logs = db.query(AnalysisLog).all()
    total_analyses = len(logs)

    if total_analyses == 0:
        return {
            "total_analyses_platform": 0,
            "critical_rate": 0.0,
            "domain_mismatch_rate": 0.0,
            "avg_risk_score": 0.0,
            "top_targeted_orgs": [],
            "most_common_indicators": [],
            "analyses_today": 0,
            "analyses_this_week": 0,
        }

    top_targeted_orgs = [
        {"org": org, "count": count}
        for org, count in (
            db.query(AnalysisLog.matched_org, func.count(AnalysisLog.id))
            .filter(AnalysisLog.matched_org.is_not(None))
            .group_by(AnalysisLog.matched_org)
            .order_by(func.count(AnalysisLog.id).desc())
            .limit(10)
            .all()
        )
    ]

    indicator_counter: Counter[str] = Counter()
    for log in logs:
        indicator_counter.update(_safe_parse_indicators(log.key_indicators))

    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = now - timedelta(days=7)

    return {
        "total_analyses_platform": total_analyses,
        "critical_rate": round(
            sum(1 for log in logs if log.risk_level.upper() == "CRITICAL") * 100 / total_analyses,
            2,
        ),
        "domain_mismatch_rate": round(
            sum(1 for log in logs if log.domain_mismatch) * 100 / total_analyses,
            2,
        ),
        "avg_risk_score": round(sum(log.risk_score for log in logs) / total_analyses, 2),
        "top_targeted_orgs": top_targeted_orgs,
        "most_common_indicators": [
            {"indicator": indicator, "count": count}
            for indicator, count in indicator_counter.most_common(10)
        ],
        "analyses_today": sum(1 for log in logs if log.timestamp >= today_start),
        "analyses_this_week": sum(1 for log in logs if log.timestamp >= week_start),
    }


@router.get("/timeline")
def stats_timeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    del current_user

    since = datetime.utcnow() - timedelta(days=30)
    rows = (
        db.query(
            func.date(AnalysisLog.timestamp),
            AnalysisLog.risk_level,
            func.count(AnalysisLog.id),
        )
        .filter(AnalysisLog.timestamp >= since)
        .group_by(func.date(AnalysisLog.timestamp), AnalysisLog.risk_level)
        .order_by(func.date(AnalysisLog.timestamp))
        .all()
    )

    timeline_map: dict[str, dict] = defaultdict(
        lambda: {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": 0}
    )

    for date_value, risk_level, count in rows:
        date_key = str(date_value)
        normalized_level = str(risk_level).lower()
        if normalized_level not in {"critical", "high", "medium", "low"}:
            continue
        timeline_map[date_key][normalized_level] = count
        timeline_map[date_key]["total"] += count

    return {
        "timeline": [
            {"date": date_key, **timeline_map[date_key]}
            for date_key in sorted(timeline_map.keys())
        ]
    }
