from __future__ import annotations

import json
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import Drill, DrillClick, get_db
from app.services.drill_generator import generate_phishing_email
from app.services.drill_mailer import send_drill_email

DRILL_ORGS = [
    "Azərbaycan Respublikasının Mərkəzi Bankı",
    "Kapital Bank",
    "ABB Bank",
    "Rabitəbank",
    "AccessBank",
    "PASHA Bank",
    "Xalq Bank",
    "Azər Qazbank",
    "ASAN Xidmət",
    "Vergilər Nazirliyi",
    "Maliyyə Nazirliyi",
    "Dövlət Gömrük Komitəsi",
    "Dövlət Sosial Müdafiə Fondu",
    "Azərenerji",
    "Azərsu",
]


def find_best_org(org_name: str) -> str:
    lower = org_name.lower()
    for org in DRILL_ORGS:
        if lower in org.lower() or org.lower() in lower:
            return org
    return org_name


router = APIRouter()


@router.post("/create")
def create_drill(
    request: Request,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    org_name = payload.get("org_name")
    target_emails = payload.get("target_emails", [])
    if not org_name or not target_emails:
        raise HTTPException(status_code=400, detail="org_name and target_emails are required")

    org_name = find_best_org(org_name)

    template = generate_phishing_email(org_name, target_emails[0])
    if not template:
        raise HTTPException(status_code=503, detail="Unable to generate simulation email")

    drill = Drill(
        user_id=current_user.id,
        org_name=org_name,
        subject=template["subject"],
        body=template["body"],
        fake_domain=template["fake_domain"],
        target_emails=json.dumps(target_emails),
        status="created",
    )
    db.add(drill)
    db.commit()
    db.refresh(drill)

    tokens_generated = 0
    for target in target_emails:
        token = secrets.token_urlsafe(16)
        click = DrillClick(drill_id=drill.id, target_email=target, token=token)
        db.add(click)
        db.commit()

        send_drill_email(
            target_email=target,
            subject=template["subject"],
            body=template["body"],
            sender_name=template["sender_name"],
            fake_domain=template["fake_domain"],
            tracking_token=token,
            base_url=str(request.base_url).rstrip("/"),
        )
        tokens_generated += 1

    drill.status = "sent"
    db.commit()

    return {
        "drill_id": drill.id,
        "subject": drill.subject,
        "body_preview": drill.body[:200],
        "tokens_generated": tokens_generated,
    }


@router.get("/track/{token}")
async def track_click(token: str, db: Session = Depends(get_db)):
    click = db.query(DrillClick).filter(DrillClick.token == token).first()
    if not click:
        raise HTTPException(status_code=404, detail="Token not found")

    if not click.clicked:
        click.clicked = True
        click.clicked_at = datetime.utcnow()
        db.commit()

    html_content = (
        "<html><body style='font-family:sans-serif;max-width:600px;margin:50px auto;"
        "background:#0D0D14;color:white;padding:40px;border-radius:12px;'>"
        "<h1 style='color:#DC2626'> Phishing Simulation</h1>"
        "<p>This was a <strong>Vexor Drill</strong>  a simulated phishing email "
        "for security awareness training.</p>"
        "<p>You clicked a link in a simulated phishing email. "
        "In a real attack, this could have compromised your account.</p>"
        "<h3>What to look for:</h3>"
        "<ul>"
        "<li>Urgency language (dərhal, bloklanıb, təsdiqləyin)</li>"
        "<li>Suspicious sender domain</li>"
        "<li>Unexpected requests for credentials</li>"
        "</ul>"
        "<p style='color:#16A34A'> Your security team has been notified.</p>"
        "</body></html>"
    )
    return HTMLResponse(content=html_content)


@router.get("/results/{drill_id}")
def drill_results(drill_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    drill = db.query(Drill).filter(Drill.id == drill_id, Drill.user_id == current_user.id).first()
    if not drill:
        raise HTTPException(status_code=404, detail="Drill not found")

    clicks = db.query(DrillClick).filter(DrillClick.drill_id == drill.id).all()
    clicked_count = sum(1 for click in clicks if click.clicked)
    total_targets = len(clicks)
    click_rate = round((clicked_count / total_targets) * 100, 2) if total_targets else 0.0

    return {
        "drill_id": drill.id,
        "org_name": drill.org_name,
        "subject": drill.subject,
        "created_at": drill.created_at.isoformat(),
        "total_targets": total_targets,
        "clicked_count": clicked_count,
        "click_rate": click_rate,
        "results": [
            {"email": click.target_email, "clicked": click.clicked, "clicked_at": click.clicked_at.isoformat() if click.clicked_at else None}
            for click in clicks
        ],
    }


@router.get("/list")
def drill_list(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    drills = db.query(Drill).filter(Drill.user_id == current_user.id).order_by(Drill.created_at.desc()).all()
    data = []
    for drill in drills:
        clicks = db.query(DrillClick).filter(DrillClick.drill_id == drill.id).all()
        total = len(clicks)
        clicked = sum(1 for click in clicks if click.clicked)
        click_rate = round((clicked / total) * 100, 2) if total else 0.0
        data.append(
            {
                "drill_id": drill.id,
                "org_name": drill.org_name,
                "subject": drill.subject,
                "created_at": drill.created_at.isoformat(),
                "status": drill.status,
                "total_targets": total,
                "clicked_count": clicked,
                "click_rate": click_rate,
            }
        )
    return data
