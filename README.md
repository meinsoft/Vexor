# Vexor

![Vexor Shield](extension/icons/icon128.png)

### **Vexor**
AI-powered phishing detection shield for Gmail.

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Chrome Extension](https://img.shields.io/badge/Extension-Manifest_V3-9c27b0?logo=google-chrome)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Vexor** is a modern cybersecurity tool designed to protect users from sophisticated phishing attacks. It combines real-time Gmail DOM analysis with AI-driven content and URL inspection to provide instant verdicts on every email you open.

---

## 🚀 Features

- **Real-time Gmail Scanning** — Automatically detects when a message is opened and extracts sender, body, and headers without reloading.
- **AI-Powered Risk Verdicts** — Categorizes threats into `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW` using weighted confidence scores.
- **Domain & Reply-to Inspection** — Instant warnings for mismatches between the sender's claimed domain and their actual email or reply-to address.
- **Visual Risk Indicators** — Beautifully injected notification banners in Gmail and high-fidelity animated risk rings in the extension popup.
- **Personal Security Dashboard** — Track your total analyses, average risk scores, and view your history of targeted organizations.
- **Premium Glassmorphism UI** — High-end, purple-themed interface designed for a seamless and professional user experience.

---

## 🛠 Tech Stack

### **Extension (Frontend)**
| Technology | Purpose |
| :--- | :--- |
| **JavaScript (ES6+)** | Core logic & Chrome API integration |
| **Tailwind CSS v3** | Modern utility-first styling & theme system |
| **Chrome Manifest V3** | Secure and performant extension architecture |
| **MutationObserver** | Real-time Gmail DOM monitoring |

### **Backend**
| Technology | Purpose |
| :--- | :--- |
| **FastAPI** | High-performance asynchronous API framework |
| **DistilBERT** | Machine learning model for email content analysis |
| **Groq API** | Ultra-fast LLM-powered URL phishing inspection |
| **SQLite / SQLAlchemy** | Lightweight data persistence & user stats tracking |
| **JWT (PyJWT)** | Secure bearer token authentication |

---

## 🏁 Getting Started

### **Prerequisites**
- Python 3.10+
- Node.js 18+
- Google Chrome Browser

### **Backend Setup**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The API will be available at `http://localhost:8000`.*

### **Extension Setup**
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `extension/` folder in this repository.
4. Pin the Vexor icon to your toolbar for easy access.

---

## 📁 Project Structure

```text
Vexor/
├── backend/
│   ├── app/                # Core FastAPI application
│   │   ├── api/            # API route handlers
│   │   ├── models/         # Database models
│   │   ├── services/       # AI logic & analysis engines
│   │   └── database.py     # SQLAlchemy config
│   └── main.py             # Entry point
├── extension/
│   ├── icons/              # Vexor branding assets
│   ├── background.js       # API communication service worker
│   ├── content.js          # Gmail DOM extraction & injection
│   ├── popup.html          # Main extension UI
│   ├── popup.js            # Frontend logic & auth handling
│   ├── tailwind.config.js  # Theme configuration
│   └── manifest.json       # Extension manifest
└── README.md
```

---

## 🛡 How it Works

1. **Extraction**: `content.js` monitors the Gmail DOM using a `MutationObserver`. When an email is opened, it extracts the sender's address, the email body, and the `Reply-To` header.
2. **Analysis**: The data is sent to `background.js`, which forwards it to the Vexor API. The backend runs the content through **DistilBERT** and the URLs through a **Groq-powered** analysis.
3. **Verdict**: The API returns a risk score (0-100) and specific indicators (e.g., "Urgency language", "Domain mismatch").
4. **Display**: Vexor injects a risk banner above the email text in Gmail and updates the extension's badge and popup with detailed findings.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
