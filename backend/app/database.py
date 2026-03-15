from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


DATABASE_URL = "sqlite:///./vexor.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    company: Mapped[str | None] = mapped_column(String, nullable=True)
    plan: Mapped[str] = mapped_column(String, default="free", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    analysis_logs: Mapped[list["AnalysisLog"]] = relationship(back_populates="user")


class AnalysisLog(Base):
    __tablename__ = "analysis_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    risk_level: Mapped[str] = mapped_column(String, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    sender_domain: Mapped[str] = mapped_column(String, nullable=False)
    domain_mismatch: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reply_to_mismatch: Mapped[bool] = mapped_column(Boolean, nullable=False)
    matched_org: Mapped[str | None] = mapped_column(String, nullable=True)
    email_phishing_score: Mapped[float] = mapped_column(Float, nullable=False)
    url_phishing_score: Mapped[float] = mapped_column(Float, nullable=False)
    weighted_confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    key_indicators: Mapped[str] = mapped_column(String, nullable=False)

    user: Mapped[User | None] = relationship(back_populates="analysis_logs")


class Drill(Base):
    __tablename__ = "drills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    org_name: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(String, nullable=False)
    fake_domain: Mapped[str] = mapped_column(String, nullable=False)
    target_emails: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[str] = mapped_column(String, default="created", nullable=False)


class DrillClick(Base):
    __tablename__ = "drill_clicks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    drill_id: Mapped[int] = mapped_column(Integer, nullable=False)
    target_email: Mapped[str] = mapped_column(String, nullable=False)
    clicked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    clicked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


Base.metadata.create_all(bind=engine)
