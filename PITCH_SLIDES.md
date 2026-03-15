# Vexor Hackathon Pitch Deck

## 1. Title Slide
### TITLE
Vexor  
AI-Powered Phishing Defense for Azerbaijani Organizations

### BULLET POINTS
- Real-time email phishing detection built for Azerbaijan
- Combines AI, government open data, and browser-native workflow
- Designed for businesses, government-facing teams, and finance-heavy organizations

### SPEAKER NOTES
Vexor is a cybersecurity platform focused on one of the most painful and expensive attack surfaces in Azerbaijan: phishing through email. What makes our product different is that we do not rely on generic global detection alone. We combine machine learning, LLM reasoning, and Azerbaijan government registry data to catch impersonation attacks that foreign tools miss.

---

## 2. Problem
### TITLE
Phishing Is Still Winning

### BULLET POINTS
- 70% of cyber incidents in our target context are phishing-related
- Fraud and phishing losses represent a 6M AZN-scale problem
- Attackers spoof 60+ suspicious or misleading domains to impersonate trusted institutions
- Existing tools do not understand Azerbaijani-language urgency patterns or local institution impersonation
- Users still make decisions inside the inbox, where traditional awareness training is weakest

### SPEAKER NOTES
The problem is not just spam. It is targeted social engineering. The user sees a fake banking email, a fake ASAN notice, or a fake ministry request, and they have only seconds to decide whether it is real. That is where Vexor operates. We focus on locally relevant phishing patterns, including Azerbaijani wording, domain impersonation, and institution trust abuse.

---

## 3. Solution
### TITLE
Four-Layer Detection Stack

### BULLET POINTS
- Layer 1: DistilBERT email classifier via Hugging Face Inference API
- Layer 2: Groq-powered URL scanner for spoofed domains, suspicious TLDs, and misleading links
- Layer 3: `opendata.az` organization validation against 164 official organizations
- Layer 4: Groq verdict synthesizer that combines all signals into one final risk score and action
- Output: one clear verdict for the user: LOW, MEDIUM, HIGH, or CRITICAL

### SPEAKER NOTES
Vexor is not a single model. It is an orchestration system. First we analyze the email content using a phishing-focused DistilBERT model. Then we inspect URLs separately using Groq. Then we validate whether the claimed organization matches official Azerbaijani registry data. Finally, a Groq reasoning layer combines those signals and produces a human-readable verdict, score, indicators, and recommended action.

---

## 4. opendata.az Integration
### TITLE
Turning Open Government Data into a Security Advantage

### BULLET POINTS
- Vexor loads `ServicesByOrganizations.csv` from Azerbaijan’s Open Data Portal
- Dataset contains 164 unique official organization names
- We fuzzy-match claimed institutions using `difflib.SequenceMatcher`
- We check `organization_name` and `organization_short_name`
- If sender claims a real institution but domain does not align, Vexor flags `domain_mismatch = true`
- This becomes the strongest signal in our weighted scoring pipeline

### SPEAKER NOTES
This is the part that makes Vexor hard to copy. Most foreign phishing tools do not understand who the real Azerbaijani institutions are. We do. We ingest the official government registry data, extract 164 organization names, and use that to detect impersonation in real time. In our scoring model, entity verification carries the highest weight because registry-backed validation is more reliable than heuristics alone.

---

## 5. Live Demo Script
### TITLE
Live Demo: From Suspicious Email to Verdict

### BULLET POINTS
- Demo 1: phishing impersonation of Mərkəzi Bank
- Demo 2: normal harmless business email
- Show that Vexor works both through the web app and the extension-ready API

### SPEAKER NOTES
Here is the exact live demo sequence.

Demo 1: phishing case
- Sender: `support@mərkəzibank-az.ru`
- Body: `Hörmətli müştəri, hesabınız bloklanıb. Dərhal təsdiqləyin: http://mərkəzibank-az.ru/verify`
- Expected result:
  - `CRITICAL`
  - `99 / 100`
  - `domain_mismatch = true`
  - `matched_org = Mərkəzi Bank`

Why this should trigger:
- suspicious `.ru` domain
- urgency language in Azerbaijani
- impersonation of an official institution
- sender domain does not match official records

Demo 2: safe case
- Sender: `leyla@company.az`
- Body: `Hörmətli Əli bəy, sabah saat 10:00-da görüş təyin edilmişdir.`
- Expected result:
  - `LOW`
  - `5 / 100`

What to show on screen:
- risk banner
- domain mismatch warning
- matched organization card
- key indicators
- recommended action

---

## 6. Technical Architecture
### TITLE
Built for Production, Not Just a Demo

### BULLET POINTS
- Backend: FastAPI
- AI Layer 1: Hugging Face Inference API using `cybersectony/phishing-email-detection-distilbert_v2.4.1`
- AI Layer 2 and 4: Groq SDK with `llama-3.3-70b-versatile`
- Data Layer: SQLite with SQLAlchemy models for users and analysis logs
- Authentication: JWT with `python-jose`, bcrypt hashing via Passlib
- Rate Limiting: `slowapi`
- Frontend: React + Vite + Tailwind + Recharts + Framer Motion
- Extension readiness: dedicated Chrome Extension API documentation and auth flow

### SPEAKER NOTES
On the backend, FastAPI exposes authentication, analysis, and statistics endpoints. We log only metadata, never raw email body or sender identity fields, which is a deliberate privacy choice. On the frontend, we built a dark-mode dashboard, analyzer, and auth flow in React. The architecture already supports a Chrome Extension, because the extension can authenticate, call `/analyze`, and read personal stats from `/stats/me`.

---

## 7. Competitive Comparison
### TITLE
Why Vexor Wins Locally

### BULLET POINTS
| Feature | Vexor | KnowBe4 | Fortinet |
|---|---|---|---|
| Azerbaijani institution registry matching | Yes | No | No |
| `opendata.az` integration | Yes | No | No |
| Azerbaijani and Russian urgency keyword detection | Yes | Limited | Limited |
| API-first for Chrome Extension integration | Yes | Partial | Enterprise-heavy |
| Built for local impersonation patterns | Yes | No | No |
| Lightweight SME pricing model | Yes | Less flexible | Expensive |

### SPEAKER NOTES
KnowBe4 is excellent at awareness training. Fortinet is excellent at enterprise infrastructure. But neither one is built around Azerbaijani public data, Azerbaijani phishing language, or local institution impersonation. Vexor is not trying to outspend global vendors. We are winning on local signal quality and deployment simplicity.

---

## 8. Business Model
### TITLE
Affordable Security With Strong Upside

### BULLET POINTS
- Free tier for limited analyses and onboarding
- Paid Tier 1: 49 AZN/month for small teams
- Paid Tier 2: 149 AZN/month for growing organizations and deeper monitoring
- Year 1 revenue target: 300K AZN
- Year 3 revenue target: 3M AZN
- Low-cost deployment because inference is API-based and the core stack is lightweight

### SPEAKER NOTES
The pricing is intentionally simple. We want to be cheaper than the friction caused by even one successful phishing incident. For SMEs, 49 AZN is accessible. For more serious teams, 149 AZN gives enough room for recurring usage and analytics. Because we rely on API inference and a lightweight backend, we can scale with relatively low infrastructure overhead.

---

## 9. Closing Slide
### TITLE
Why Vexor Matters

### BULLET POINTS
- The threat lives in the inbox. So does our tool.
- We are solving a 6 million AZN problem with a solution that costs less than a monthly office coffee budget.
- We turned the government's Open Data Portal into a live weapon against fraud.
- No foreign company can build what we built - they don't have access to our government's data.

### SPEAKER NOTES
Close with conviction. Vexor is not just another phishing detector. It is local intelligence turned into product advantage. We already have the technical backbone: AI classification, Groq reasoning, registry verification, JWT auth, stats dashboards, and extension-ready APIs. The next step is adoption.
