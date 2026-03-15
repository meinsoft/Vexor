# Vexor Chrome Extension API Docs

## 1. Base URL
Development:
`http://localhost:8000`

Production:
To be deployed on Google Cloud Run.

## 2. Authentication
Vexor uses JWT Bearer tokens.

Flow:
- Register once with `POST /auth/register` to create an account and receive an `access_token`.
- Store the token in `chrome.storage.local`.
- Send the token on authenticated requests as:

```http
Authorization: Bearer <token>
```

Recommended extension storage pattern:

```js
chrome.storage.local.set({ vexorToken: accessToken });
```

Then read it before API calls:

```js
const { vexorToken } = await chrome.storage.local.get("vexorToken");
```

## 3. Endpoints the extension needs

### POST /auth/register
Creates a new user account.

Request:
Content type: `application/x-www-form-urlencoded`

```http
POST /auth/register
Content-Type: application/x-www-form-urlencoded

email=test@vexor.az&password=Test1234!&company=Vexor%20Test
```

Request fields:
- `email`: string
- `password`: string
- `company`: string, optional

Success response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "email": "test@vexor.az",
    "company": "Vexor Test"
  }
}
```

Possible error:

```json
{
  "detail": "Email already registered"
}
```

### POST /auth/login
Logs in an existing user.

Request:
Content type: `application/x-www-form-urlencoded`

```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

email=test@vexor.az&password=Test1234!
```

Request fields:
- `email`: string
- `password`: string

Success response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "email": "test@vexor.az",
    "company": "Vexor Test"
  }
}
```

Failure response:

```json
{
  "detail": "Invalid credentials"
}
```

Note: store the returned `access_token` in `chrome.storage.local`.

### POST /analyze
This is the main endpoint the extension calls.

Authentication:
- Optional, but recommended.
- If a token is provided, the analysis is linked to the logged-in user and appears in `/stats/me`.

Request:
Content type: `application/json`

```http
POST /analyze
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "email_body": "Hörmətli müştəri, hesabınız bloklanıb. Dərhal təsdiqləyin: http://mərkəzibank-az.ru/verify",
  "sender_email": "support@mərkəzibank-az.ru",
  "reply_to": "steal@hackers-ru.com"
}
```

Request schema:
- `email_body`: string
  Gmail email content extracted from the DOM.
- `sender_email`: string
  Sender address extracted from the Gmail message UI.
- `reply_to`: string or `null`
  Reply-To header if available.

Full response schema:

```json
{
  "risk_level": "CRITICAL",
  "risk_score": 97,
  "explanation": "The sender appears to impersonate an Azerbaijani institution and uses multiple phishing indicators.",
  "recommended_action": "Do not click links, do not reply, and report the message to IT/security.",
  "domain_mismatch": true,
  "reply_to_mismatch": true,
  "key_indicators": [
    "domain mismatch",
    "reply-to mismatch",
    "suspicious TLD",
    "urgency language"
  ],
  "email_phishing_score": 88.4,
  "url_phishing_score": 91.0,
  "weighted_confidence_score": 93.12,
  "matched_org": "Mərkəzi Bank",
  "log_id": 42
}
```

Field meanings:
- `risk_level`: `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`
  Use this for the badge severity and popup status.
- `risk_score`: integer `0-100`
  Show as a percentage.
- `explanation`: string
  Short human-readable explanation for the popup.
- `recommended_action`: string
  Action guidance to show in the popup.
- `domain_mismatch`: boolean
  If `true`, show a strong red warning that the claimed organization and sender domain do not match.
- `reply_to_mismatch`: boolean
  If `true`, show an orange warning that reply-to differs from sender domain.
- `key_indicators`: string array
  Red flags found during analysis. Display as chips, bullets, or tags.
- `email_phishing_score`: float
  DistilBERT content-analysis score.
- `url_phishing_score`: float
  Groq URL-analysis score.
- `weighted_confidence_score`: float
  Combined score used as a weighted confidence baseline.
- `matched_org`: string or `null`
  If not null, show `Impersonating: <org>`.
- `log_id`: integer or `null`
  Stored analysis record ID for debugging or future deep-linking.

### GET /stats/me
Gets the logged-in user’s dashboard stats for use in the extension popup.

Request:

```http
GET /stats/me
Authorization: Bearer <token>
```

Response schema:

```json
{
  "total_analyses": 18,
  "critical_count": 6,
  "high_count": 4,
  "medium_count": 5,
  "low_count": 3,
  "domain_mismatch_rate": 44.44,
  "avg_risk_score": 68.72,
  "top_targeted_orgs": [
    { "org": "Mərkəzi Bank", "count": 4 },
    { "org": "ASAN", "count": 2 }
  ],
  "recent_analyses": [
    {
      "id": 42,
      "timestamp": "2026-03-15T11:05:00.123456",
      "risk_level": "CRITICAL",
      "risk_score": 97,
      "sender_domain": "mərkəzibank-az.ru",
      "domain_mismatch": true,
      "reply_to_mismatch": true,
      "matched_org": "Mərkəzi Bank",
      "email_phishing_score": 88.4,
      "url_phishing_score": 91.0,
      "weighted_confidence_score": 93.12,
      "key_indicators": ["domain mismatch", "reply-to mismatch", "urgency language"]
    }
  ],
  "member_since": "2026-03-15T10:30:00.000000",
  "company": "Vexor Test"
}
```

Useful popup fields:
- `total_analyses`
- `critical_count`
- `domain_mismatch_rate`
- `avg_risk_score`
- `top_targeted_orgs`
- `recent_analyses`

## 4. Gmail DOM Selectors
Suggested selectors for extracting email data from Gmail:

- Sender email:
  `document.querySelector('[email]')`
  or
  `document.querySelector('meta[itemprop="email"]')`

- Email body:
  `document.querySelector('.a3s.aiL')`
  This is the main Gmail email body container in many message views.

- Reply-To:
  Look in the expanded email headers section. Gmail may hide headers behind a details dropdown, so your content script may need to click/observe that section or parse the expanded metadata area.

- Subject:
  `document.querySelector('h2.hP')`

Important:
- Gmail DOM changes often. Build fallbacks and retries.
- Use a `MutationObserver` to detect when a new email is opened without reloading the page.

## 5. Chrome Extension Architecture
Recommended file structure and responsibilities:

- `manifest.json`
  Declares permissions and entry points.
  Needed permissions:
  - `storage`
  - `activeTab`
  - host permissions for Gmail and the backend, for example:
    - `https://mail.google.com/*`
    - `http://localhost:8000/*`

- `content.js`
  Runs on `mail.google.com`.
  Responsibilities:
  - detect when a user opens an email
  - extract `sender_email`, `email_body`, `reply_to`, and optionally subject
  - send extracted data to `background.js`
  - inject a badge or warning UI into Gmail

- `background.js`
  Handles API communication with the Vexor backend.
  Responsibilities:
  - read JWT token from `chrome.storage.local`
  - call `/auth/login`, `/auth/register`, `/analyze`, and `/stats/me`
  - centralize error handling
  - return normalized results to `content.js` and `popup.js`

- `popup.html` / `popup.js`
  UI for login, registration, latest analysis summary, and compact user stats.
  Responsibilities:
  - show login form if no token is stored
  - show the current email’s verdict
  - show mini dashboard stats from `/stats/me`

## 6. Badge Color Logic
Map `risk_level` to badge color:

- `CRITICAL` -> red `#E24B4A`
- `HIGH` -> orange `#EF9F27`
- `MEDIUM` -> yellow `#F0C040`
- `LOW` -> green `#1D9E75`

Suggested usage:
- badge background uses the severity color
- popup header uses the same color for consistency

## 7. Complete Flow
What happens when the user opens an email:

1. `content.js` detects that a Gmail email thread/message is open.
2. It extracts sender, body, and reply-to from the Gmail DOM.
3. `content.js` sends the extracted data to `background.js`.
4. `background.js` reads the stored JWT token and calls `POST /analyze`.
5. The backend returns the phishing verdict.
6. `content.js` injects a risk badge or warning panel into the Gmail UI.
7. The user can click the extension icon to view full details in the popup.

## 8. Error Handling
Recommended extension behavior:

- `401 Unauthorized`
  Token is missing, invalid, or expired.
  Action: clear stored token and redirect the user to login.

- `429 Too Many Requests`
  Rate limit triggered.
  Action: show:
  `Too many requests, wait 1 minute`

- Network error / backend unreachable
  Action: show:
  `Vexor backend unreachable`

- `/auth/register` returns `400`
  Usually means the user already exists.
  Action: move the user to the login flow.

## 9. Dashboard Stats Relevant for Extension Popup
For a compact mini-dashboard in the extension popup, show:

- `total_analyses`
- `critical_count`
- `domain_mismatch_rate`
- `top_targeted_orgs`

Recommended popup layout:
- top: current email verdict
- middle: explanation and recommended action
- bottom: personal stats snapshot from `/stats/me`
