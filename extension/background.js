/* ──────────────────────────────────────────────
   Vexor — Background Service Worker
   Handles all API communication with the backend
   ────────────────────────────────────────────── */

const API_BASE = "http://localhost:8000";

// ── Token helpers ──────────────────────────────
async function getToken() {
    const { vexorToken } = await chrome.storage.local.get("vexorToken");
    return vexorToken || null;
}

async function setToken(token) {
    await chrome.storage.local.set({ vexorToken: token });
}

async function clearToken() {
    await chrome.storage.local.remove("vexorToken");
}

// ── User info helpers ──────────────────────────
async function setUserInfo(user) {
    await chrome.storage.local.set({ vexorUser: user });
}

async function getUserInfo() {
    const { vexorUser } = await chrome.storage.local.get("vexorUser");
    return vexorUser || null;
}

async function clearUserInfo() {
    await chrome.storage.local.remove("vexorUser");
}

// ── Latest analysis cache ──────────────────────
async function cacheAnalysis(result) {
    await chrome.storage.local.set({ vexorLastAnalysis: result });
}

async function getCachedAnalysis() {
    const { vexorLastAnalysis } = await chrome.storage.local.get("vexorLastAnalysis");
    return vexorLastAnalysis || null;
}

// ── Generic fetch wrapper ──────────────────────
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
            },
        });

        // Handle specific HTTP errors
        if (response.status === 401) {
            await clearToken();
            await clearUserInfo();
            return { error: "Session expired. Please log in again.", code: 401 };
        }

        if (response.status === 429) {
            return { error: "Too many requests. Please wait a minute.", code: 429 };
        }

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.detail || `Request failed (${response.status})`,
                code: response.status,
            };
        }

        return { data };
    } catch (err) {
        return { error: "Vexor backend unreachable. Check your connection.", code: 0 };
    }
}

// ── Auth: Register ─────────────────────────────
async function apiRegister(email, password, company) {
    const body = new URLSearchParams({ email, password });
    if (company) body.append("company", company);

    const result = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    if (result.data) {
        await setToken(result.data.access_token);
        await setUserInfo(result.data.user);
    }

    return result;
}

// ── Auth: Login ────────────────────────────────
async function apiLogin(email, password) {
    const body = new URLSearchParams({ email, password });

    const result = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    if (result.data) {
        await setToken(result.data.access_token);
        await setUserInfo(result.data.user);
    }

    return result;
}

// ── Analyze email ──────────────────────────────
async function apiAnalyze(emailBody, senderEmail, replyTo) {
    const token = await getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const result = await apiFetch("/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
            email_body: emailBody,
            sender_email: senderEmail,
            reply_to: replyTo || null,
        }),
    });

    if (result.data) {
        await cacheAnalysis(result.data);
        // Update badge based on risk level
        updateBadge(result.data.risk_level);
    }

    return result;
}

// ── Get user stats ─────────────────────────────
async function apiGetStats() {
    const token = await getToken();
    if (!token) return { error: "Not logged in.", code: 401 };

    return await apiFetch("/stats/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

// ── Badge management ───────────────────────────
const BADGE_COLORS = {
    CRITICAL: "#E24B4A",
    HIGH: "#EF9F27",
    MEDIUM: "#F0C040",
    LOW: "#1D9E75",
};

function updateBadge(riskLevel) {
    const color = BADGE_COLORS[riskLevel] || "#8b5cf6";
    const text = riskLevel === "CRITICAL" ? "!!" : riskLevel === "HIGH" ? "!" : riskLevel === "MEDIUM" ? "~" : "✓";

    chrome.action.setBadgeBackgroundColor({ color });
    chrome.action.setBadgeText({ text });
}

function clearBadge() {
    chrome.action.setBadgeText({ text: "" });
}

// ── Message listener ───────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = async () => {
        switch (message.action) {
            case "login": {
                const result = await apiLogin(message.email, message.password);
                return result;
            }

            case "register": {
                const result = await apiRegister(message.email, message.password, message.company);
                return result;
            }

            case "analyze": {
                const result = await apiAnalyze(message.emailBody, message.senderEmail, message.replyTo);
                return result;
            }

            case "getStats": {
                const result = await apiGetStats();
                return result;
            }

            case "getAnalysis": {
                const cached = await getCachedAnalysis();
                return cached ? { data: cached } : { error: "No analysis available." };
            }

            case "checkAuth": {
                const token = await getToken();
                const user = await getUserInfo();
                return { data: { isLoggedIn: !!token, user } };
            }

            case "logout": {
                await clearToken();
                await clearUserInfo();
                clearBadge();
                return { data: { success: true } };
            }

            default:
                return { error: "Unknown action." };
        }
    };

    handler().then(sendResponse);
    return true; // Keep message channel open for async response
});

// ── Extension installed handler ────────────────
chrome.runtime.onInstalled.addListener(() => {
    console.log("Vexor Phishing Shield installed successfully.");
    clearBadge();
});
