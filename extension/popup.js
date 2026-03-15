/* ──────────────────────────────────────────────
   Vexor — Popup Script
   Handles auth, verdict display, and stats
   ────────────────────────────────────────────── */

// ── DOM References ─────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Views
const viewAuth = $("#view-auth");
const viewMain = $("#view-main");
const headerActions = $("#header-actions");
const bottomNav = $("#bottom-nav");

// Auth
const tabLogin = $("#tab-login");
const tabRegister = $("#tab-register");
const formLogin = $("#form-login");
const formRegister = $("#form-register");
const authError = $("#auth-error");

// Verdict
const panelVerdict = $("#panel-verdict");
const panelStats = $("#panel-stats");
const verdictEmpty = $("#verdict-empty");
const verdictLoading = $("#verdict-loading");
const verdictResult = $("#verdict-result");

// Navigation
const navShield = $("#nav-shield");
const navStats = $("#nav-stats");

// Toast
const toast = $("#toast");

// ── Risk color mapping ─────────────────────────
const RISK_COLORS = {
    CRITICAL: { bg: "bg-risk-critical/10", border: "border-risk-critical/30", text: "text-risk-critical", hex: "#E24B4A" },
    HIGH: { bg: "bg-risk-high/10", border: "border-risk-high/30", text: "text-risk-high", hex: "#EF9F27" },
    MEDIUM: { bg: "bg-risk-medium/10", border: "border-risk-medium/30", text: "text-risk-medium", hex: "#F0C040" },
    LOW: { bg: "bg-risk-low/10", border: "border-risk-low/30", text: "text-risk-low", hex: "#1D9E75" },
};

// ── Messaging helper ───────────────────────────
function sendMessage(msg) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(msg, resolve);
    });
}

// ── Toast notifications ────────────────────────
let toastTimeout;
function showToast(message, type = "error") {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.className = `fixed top-4 left-4 right-4 px-4 py-3 rounded-xl text-xs font-medium transform translate-y-0 opacity-100 transition-all duration-300 z-50 ${type === "error" ? "bg-risk-critical/90 text-white" : type === "success" ? "bg-risk-low/90 text-white" : "bg-vexor-700/90 text-white"
        }`;
    toastTimeout = setTimeout(() => {
        toast.classList.add("-translate-y-20", "opacity-0");
        toast.classList.remove("translate-y-0", "opacity-100");
    }, 3000);
}

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════

function showAuth() {
    viewAuth.classList.remove("hidden");
    viewMain.classList.add("hidden");
    headerActions.classList.add("hidden");
    bottomNav.classList.add("hidden");
}

function showMain() {
    viewAuth.classList.add("hidden");
    viewMain.classList.remove("hidden");
    headerActions.classList.remove("hidden");
    bottomNav.classList.remove("hidden");
}

// Auth tab switching
$$(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        $$(".auth-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        if (target === "login") {
            formLogin.classList.remove("hidden");
            formRegister.classList.add("hidden");
        } else {
            formLogin.classList.add("hidden");
            formRegister.classList.remove("hidden");
        }
        authError.classList.add("hidden");
    });
});

// Login form
formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#login-email").value.trim();
    const password = $("#login-password").value;

    if (!email || !password) return;

    const btn = formLogin.querySelector("button[type=submit]");
    btn.textContent = "Signing in...";
    btn.disabled = true;

    const result = await sendMessage({ action: "login", email, password });

    btn.textContent = "Sign In";
    btn.disabled = false;

    if (result.error) {
        authError.textContent = result.error;
        authError.classList.remove("hidden");
        return;
    }

    authError.classList.add("hidden");
    showToast("Welcome back!", "success");
    showMain();
    loadVerdict();
    loadStats();
});

// Register form
formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#register-email").value.trim();
    const password = $("#register-password").value;
    const company = $("#register-company").value.trim();

    if (!email || !password) return;

    const btn = formRegister.querySelector("button[type=submit]");
    btn.textContent = "Creating...";
    btn.disabled = true;

    const result = await sendMessage({ action: "register", email, password, company });

    btn.textContent = "Create Account";
    btn.disabled = false;

    if (result.error) {
        // If already registered, suggest login
        if (result.code === 400 || result.error.includes("already")) {
            authError.textContent = "Account exists. Try signing in instead.";
            authError.classList.remove("hidden");
            tabLogin.click();
            return;
        }
        authError.textContent = result.error;
        authError.classList.remove("hidden");
        return;
    }

    authError.classList.add("hidden");
    showToast("Account created!", "success");
    showMain();
    loadVerdict();
    loadStats();
});

// Logout
$("#btn-logout").addEventListener("click", async () => {
    await sendMessage({ action: "logout" });
    showToast("Signed out", "info");
    showAuth();
});

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════

$$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.panel;
        $$(".nav-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        if (target === "verdict") {
            panelVerdict.classList.remove("hidden");
            panelStats.classList.add("hidden");
        } else {
            panelVerdict.classList.add("hidden");
            panelStats.classList.remove("hidden");
            loadStats();
        }
    });
});

// ═══════════════════════════════════════════════
// VERDICT RENDERING
// ═══════════════════════════════════════════════

function renderVerdict(data) {
    verdictEmpty.classList.add("hidden");
    verdictLoading.classList.add("hidden");
    verdictResult.classList.remove("hidden");

    const colors = RISK_COLORS[data.risk_level] || RISK_COLORS.MEDIUM;

    // Risk card styling
    const riskCard = $("#risk-card");
    riskCard.className = `rounded-2xl p-4 mb-3 border transition-all ${colors.bg} ${colors.border}`;

    // Risk icon
    const riskIcon = $("#risk-icon");
    riskIcon.className = `w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`;

    // Risk level text
    const riskLevel = $("#risk-level");
    riskLevel.textContent = data.risk_level;
    riskLevel.className = `text-sm font-bold uppercase tracking-wide ${colors.text}`;

    // Risk score ring
    const scoreRing = $("#score-ring");
    const circumference = 2 * Math.PI * 24; // r=24
    const offset = circumference - (data.risk_score / 100) * circumference;
    scoreRing.style.stroke = colors.hex;
    setTimeout(() => {
        scoreRing.style.strokeDashoffset = offset;
    }, 100);

    const riskScore = $("#risk-score");
    riskScore.textContent = data.risk_score;
    riskScore.className = `absolute inset-0 flex items-center justify-center text-xs font-bold ${colors.text}`;

    // Impersonation
    if (data.matched_org) {
        $("#impersonation-alert").classList.remove("hidden");
        $("#matched-org").textContent = data.matched_org;
    } else {
        $("#impersonation-alert").classList.add("hidden");
    }

    // Mismatch warnings
    if (data.domain_mismatch) {
        $("#domain-mismatch").classList.remove("hidden");
    } else {
        $("#domain-mismatch").classList.add("hidden");
    }

    if (data.reply_to_mismatch) {
        $("#replyto-mismatch").classList.remove("hidden");
    } else {
        $("#replyto-mismatch").classList.add("hidden");
    }

    // Explanation & recommendation
    $("#explanation").textContent = data.explanation || "No details available.";
    $("#recommended-action").textContent = data.recommended_action || "No action specified.";

    // Key indicators
    const indicatorsEl = $("#indicators");
    indicatorsEl.innerHTML = "";
    if (data.key_indicators && data.key_indicators.length > 0) {
        data.key_indicators.forEach((indicator) => {
            const chip = document.createElement("span");
            chip.className = `inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-medium ${colors.bg} ${colors.text} border ${colors.border}`;
            chip.textContent = indicator;
            indicatorsEl.appendChild(chip);
        });
    }

    // Score bars
    const animateBar = (id, score) => {
        const bar = $(`#bar-${id}`);
        const label = $(`#score-${id}`);
        if (score != null) {
            label.textContent = Math.round(score);
            setTimeout(() => {
                bar.style.width = `${Math.min(score, 100)}%`;
            }, 200);
        } else {
            label.textContent = "—";
            bar.style.width = "0%";
        }
    };

    animateBar("email", data.email_phishing_score);
    animateBar("url", data.url_phishing_score);
    animateBar("confidence", data.weighted_confidence_score);
}

async function loadVerdict() {
    const result = await sendMessage({ action: "getAnalysis" });
    if (result && result.data) {
        renderVerdict(result.data);
    } else {
        verdictEmpty.classList.remove("hidden");
        verdictLoading.classList.add("hidden");
        verdictResult.classList.add("hidden");
    }
}

// ═══════════════════════════════════════════════
// STATS RENDERING
// ═══════════════════════════════════════════════

function renderStats(data) {
    const statsLoading = $("#stats-loading");
    const statsContent = $("#stats-content");

    statsLoading.classList.add("hidden");
    statsContent.classList.remove("hidden");

    // Summary stats
    $("#stat-total").textContent = data.total_analyses || 0;
    $("#stat-critical").textContent = data.critical_count || 0;
    $("#stat-avg-risk").textContent = data.avg_risk_score ? Math.round(data.avg_risk_score) : 0;
    $("#stat-domain-mismatch").textContent = data.domain_mismatch_rate ? `${Math.round(data.domain_mismatch_rate)}%` : "0%";

    // Top targeted orgs
    const topOrgs = $("#top-orgs");
    const noOrgs = $("#no-orgs");
    topOrgs.innerHTML = "";

    if (data.top_targeted_orgs && data.top_targeted_orgs.length > 0) {
        noOrgs.classList.add("hidden");
        data.top_targeted_orgs.forEach((org, i) => {
            const row = document.createElement("div");
            row.className = "flex items-center justify-between";
            row.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-lg bg-vexor-700/50 flex items-center justify-center text-[10px] font-bold text-vexor-300">${i + 1}</span>
          <span class="text-xs text-vexor-100">${org.org}</span>
        </div>
        <span class="text-xs font-medium text-vexor-400">${org.count} hits</span>
      `;
            topOrgs.appendChild(row);
        });
    } else {
        noOrgs.classList.remove("hidden");
    }

    // Recent analyses
    const recentList = $("#recent-list");
    const noRecent = $("#no-recent");
    recentList.innerHTML = "";

    if (data.recent_analyses && data.recent_analyses.length > 0) {
        noRecent.classList.add("hidden");
        data.recent_analyses.slice(0, 5).forEach((entry) => {
            const colors = RISK_COLORS[entry.risk_level] || RISK_COLORS.MEDIUM;
            const time = new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const row = document.createElement("div");
            row.className = `flex items-center justify-between p-2.5 rounded-xl ${colors.bg} border ${colors.border}`;
            row.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2 h-2 rounded-full shrink-0" style="background:${colors.hex}"></span>
          <span class="text-xs text-vexor-100 truncate">${entry.sender_domain || "Unknown"}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] ${colors.text} font-semibold">${entry.risk_score}</span>
          <span class="text-[10px] text-vexor-400/50">${time}</span>
        </div>
      `;
            recentList.appendChild(row);
        });
    } else {
        noRecent.classList.remove("hidden");
    }
}

async function loadStats() {
    const statsLoading = $("#stats-loading");
    const statsContent = $("#stats-content");

    statsLoading.classList.remove("hidden");
    statsContent.classList.add("hidden");

    const result = await sendMessage({ action: "getStats" });
    if (result && result.data) {
        renderStats(result.data);
    } else {
        statsLoading.classList.add("hidden");
        statsContent.classList.remove("hidden");
        // Show empty state
        $("#stat-total").textContent = "0";
        $("#stat-critical").textContent = "0";
        $("#stat-avg-risk").textContent = "0";
        $("#stat-domain-mismatch").textContent = "0%";
        $("#no-orgs").classList.remove("hidden");
        $("#no-recent").classList.remove("hidden");
    }
}

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════

async function init() {
    const result = await sendMessage({ action: "checkAuth" });

    if (result && result.data && result.data.isLoggedIn) {
        showMain();
        loadVerdict();
        loadStats();
    } else {
        showAuth();
    }
}

// Listen for analysis updates from content script
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "analysisComplete" && message.data) {
        renderVerdict(message.data);
        // Switch to verdict view
        navShield.click();
    }
});

// Start
document.addEventListener("DOMContentLoaded", init);
