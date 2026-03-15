# VEXOR
### AI-Powered Phishing Detection for Azerbaijani Businesses

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat)
![HuggingFace](https://img.shields.io/badge/HuggingFace-DistilBERT-FFD21E?style=flat&logo=huggingface&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

> Built at **GDG Baku — Build with AI Hackathon**, March 15, 2025

---

## The Problem

Azerbaijan faces a critical phishing crisis with no local defense tools:

| Metric | Value | Source |
|--------|-------|--------|
| Phishing share of all AZ cyberattacks | **70%** | CERT-Az 2025 |
| Financial losses in early 2025 | **6,000,000 AZN** | Report.az |
| .az domains breached in 2025 | **60+** | Caliber.az |
| KnowBe4 cost per user | **$19/user** | Unaffordable for SMEs |

Foreign tools miss Azerbaijan-specific attack vectors — AZ-ARM conflict lures, local government domain spoofing, and Azerbaijani urgency language patterns remain completely invisible to generic platforms.

---

## What Vexor Does

Vexor is the **first AI-powered cybersecurity platform built specifically for Azerbaijan**. It detects phishing emails by combining four detection layers with real-time validation against the Azerbaijan Open Data Portal.

```
Email Input
    │
    ├── Layer 1: Groq LLaMA 3.3 70B ──────── Email content analysis
    ├── Layer 2: Groq LLaMA 3.3 70B ──────── URL phishing detection  
    ├── Layer 3: opendata.az ───────────────── 164 official AZ entity validation
    └── Layer 4: Groq LLaMA 3.3 70B ──────── Weighted verdict synthesis
            │
            └── CRITICAL / HIGH / MEDIUM / LOW + plain-language explanation
```

---

## Features

### Core Detection
- **Email Analysis** — Groq LLaMA analyzes email content, tone, and urgency signals
- **URL Scanning** — Detects spoofed domains, suspicious TLDs (.ru, .xyz, .tk), typosquatting
- **Entity Validation** — Cross-references sender against 164 official Azerbaijani government organizations via opendata.az
- **Weighted Scoring** — `final_score = (email × 0.3) + (url × 0.3) + (entity × 0.4)`

### Localization
- Azerbaijani urgency language detection (`dərhal`, `bloklanıb`, `hesabınız`, `təsdiqləyin`)
- Russian phishing keyword detection (`срочно`, `немедленно`, `заблокирован`)
- AZ-ARM conflict narrative awareness
- `.az` domain trust scoring

### Security Platform
- **JWT Authentication** — Register/login with bcrypt password hashing
- **Analysis Logging** — Every analysis logged (metadata only, never email content)
- **Rate Limiting** — 10 requests/minute via slowapi
- **Dashboard** — Real-time stats, threat timeline, top targeted organizations
- **Vexor Drill** — AI-generated phishing simulation emails for employee awareness training

### Vexor Drill
Send realistic AI-generated phishing simulation emails to your team. Track who clicked, measure awareness, and train employees — all with Azerbaijani context that foreign tools cannot replicate.

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.12 | Core language |
| FastAPI | REST API framework |
| Groq LLaMA 3.3 70B | Email analysis, URL scanning, verdict synthesis |
| HuggingFace DistilBERT | Phishing email classification |
| opendata.az | 164 official AZ government entity validation |
| SQLAlchemy + SQLite | Database ORM |
| JWT (python-jose) | Authentication |
| passlib[bcrypt] | Password hashing |
| slowapi | Rate limiting |
| smtplib | Drill email delivery |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite | UI framework |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| Recharts | Dashboard charts |
| Axios | API client |
| Framer Motion | Animations |
| React Router | Navigation |
| Lucide React | Icons |
| Sonner | Toast notifications |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Docker + Docker Compose | Containerization |
| Nginx | Frontend serving + reverse proxy |
| Google Cloud Run | Production deployment |

---

## API Endpoints

### Authentication
```
POST /auth/register    → Register new user
POST /auth/login       → Login, receive JWT token
```

### Analysis
```
POST /analyze          → Analyze email for phishing (core endpoint)
```

### Statistics
```
GET /stats/me          → Personal analysis statistics
GET /stats/overview    → Platform-wide aggregated stats
GET /stats/timeline    → 30-day threat timeline for charts
```

### Drill Simulation
```
POST /drill/create           → Generate and send phishing simulation
GET  /drill/track/{token}    → Track employee click (public)
GET  /drill/results/{id}     → View drill click results
GET  /drill/list             → List all drills
```

---

## Analysis Response

```json
{
  "risk_level": "CRITICAL",
  "risk_score": 99,
  "explanation": "Domain mismatch detected — sender claims to be Mərkəzi Bank but domain is .ru",
  "recommended_action": "Do not click any links. Contact Mərkəzi Bank through official channels.",
  "domain_mismatch": true,
  "reply_to_mismatch": true,
  "key_indicators": ["domain_mismatch", "urgency: dərhal, bloklanıb", "suspicious TLD .ru"],
  "email_phishing_score": 99.93,
  "url_phishing_score": 95.0,
  "weighted_confidence_score": 98.45,
  "matched_org": "Azərbaycan Respublikasının Mərkəzi Bankı",
  "log_id": 42
}
```

---

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- Groq API key (free at console.groq.com)
- HuggingFace API key (free at huggingface.co)

### Backend
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your API keys to .env

uvicorn app.main:app --reload
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# UI running at http://localhost:5173
```

### Docker
```bash
docker compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## Environment Variables

```env
GROQ_API_KEY=your_groq_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
SECRET_KEY=your_jwt_secret_key
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

---

## Competitive Advantage

| Feature | KnowBe4 | Fortinet | **VEXOR** |
|---------|---------|---------|---------|
| Azerbaijani language support | ✗ | ✗ | ✓ |
| opendata.az integration | ✗ | ✗ | ✓ |
| AZ-ARM conflict lure detection | ✗ | ✗ | ✓ |
| Affordable for SMEs | ✗ ($19/user) | ✗ (enterprise) | ✓ (49 AZN/mo) |
| Plain-language AI explanation | Partial | ✗ | ✓ |
| Local entity registry validation | ✗ | ✗ | ✓ |
| Phishing drill simulation | ✓ | Partial | ✓ |
| CERT-Az alignment | ✗ | ✗ | ✓ |

---

## Business Model

| Tier | Price | Users | Target |
|------|-------|-------|--------|
| Starter | 49 AZN/month | Up to 15 | Micro-SMEs |
| Business | 149 AZN/month | Up to 50 | Core SME segment |
| Enterprise | Custom | Unlimited | Banks, government contractors |

**Revenue Projections:**
- Year 1: 200 SMEs × 1,500 AZN = **300,000 AZN ARR**
- Year 3: 1,500 SMEs × 2,000 AZN = **3,000,000 AZN ARR**

---

## Project Structure

```
Vexor/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze.py          ← Core analysis endpoint
│   │   │   ├── auth_routes.py      ← Register/login
│   │   │   ├── drill_routes.py     ← Drill simulation
│   │   │   └── stats.py            ← Dashboard statistics
│   │   ├── services/
│   │   │   ├── email_analyzer.py   ← Groq email analysis
│   │   │   ├── url_scanner.py      ← Groq URL detection
│   │   │   ├── opendata_client.py  ← opendata.az validation
│   │   │   ├── grok_synthesizer.py ← Final verdict synthesis
│   │   │   ├── drill_generator.py  ← AI phishing simulation
│   │   │   └── drill_mailer.py     ← Gmail SMTP delivery
│   │   ├── models/
│   │   │   └── schemas.py          ← Pydantic models
│   │   ├── auth.py                 ← JWT authentication
│   │   ├── database.py             ← SQLAlchemy models
│   │   └── main.py                 ← FastAPI app
│   ├── data/
│   │   └── ServicesByOrganizations.csv  ← opendata.az dataset
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       ← Stats & charts
│   │   │   ├── Analyze.jsx         ← Manual email analysis
│   │   │   ├── Drill.jsx           ← Phishing simulation
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── lib/
│   │       └── api.js              ← Axios API client
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Key Power Statements

> *"The threat lives in the inbox. So does our tool."*

> *"We are solving a 6 million AZN problem with a solution that costs less than a monthly office coffee budget."*

> *"We turned the government's Open Data Portal into a live weapon against fraud."*

> *"No foreign company can build what we built — they don't have access to our government's data."*

---

## Built With

- [Groq](https://console.groq.com) — Ultra-fast LLaMA inference
- [HuggingFace](https://huggingface.co) — DistilBERT phishing detection
- [opendata.az](https://opendata.az) — Azerbaijan Open Data Portal
- [FastAPI](https://fastapi.tiangolo.com) — Modern Python API framework
- [React](https://react.dev) — Frontend UI

---

*Built at GDG Baku — Build with AI Hackathon · March 15, 2025*
*Powered by Groq LLaMA · HuggingFace · opendata.az · Google Cloud Run*
