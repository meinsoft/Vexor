from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    email_body: str
    sender_email: str
    reply_to: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    company: str | None = None


class AnalyzeResponse(BaseModel):
    risk_level: str
    risk_score: int
    explanation: str
    recommended_action: str
    domain_mismatch: bool
    reply_to_mismatch: bool
    key_indicators: list[str] = Field(default_factory=list)
    email_phishing_score: float = 0.0
    url_phishing_score: float = 0.0
    weighted_confidence_score: float = 0.0
    matched_org: str | None = None
    log_id: int | None = None
