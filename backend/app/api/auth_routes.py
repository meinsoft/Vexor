from __future__ import annotations

from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, hash_password, verify_password
from app.database import User, get_db


router = APIRouter()


@router.post("/register")
def register(
    email: str = Form(...),
    password: str = Form(...),
    company: str | None = Form(None),
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=email,
        hashed_password=hash_password(password),
        company=company,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "access_token": create_access_token(user.id, user.email),
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "company": user.company,
        },
    }


@router.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return {
        "access_token": create_access_token(user.id, user.email),
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "company": user.company,
        },
    }
