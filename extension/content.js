/* ──────────────────────────────────────────────
   Vexor — Content Script
   Runs on mail.google.com to detect and analyze
   emails for phishing threats
   ────────────────────────────────────────────── */

(() => {
    "use strict";

    // ── Configuration ──────────────────────────────
    const DEBOUNCE_MS = 1500;
    const ANALYSIS_CACHE = new Map();

    let debounceTimer = null;
    let lastAnalyzedId = null;
    let isAnalyzing = false;

    // ── Selector strategies (fallbacks for Gmail DOM changes) ──
    const SELECTORS = {
        senderEmail: [
            '[email]',
            'span[email]',
            '.go',
            '.gD',
        ],
        emailBody: [
            '.a3s.aiL',
            '.a3s',
            'div[data-message-id] .a3s',
            '.ii.gt',
        ],
        subject: [
            'h2.hP',
            '.hP',
            'h2[data-thread-perm-id]',
        ],
        messageContainer: [
            '.h7',
            '.gs',
            '.adn.ads',
            'div[data-message-id]',
        ],
        replyTo: [
            '.ajy',
            '.g3',
        ],
    };

    // ── DOM extraction helpers ─────────────────────

    function querySelectorFallback(selectors, root = document) {
        for (const sel of selectors) {
            try {
                const el = root.querySelector(sel);
                if (el) return el;
            } catch (e) {
                // Invalid selector, skip
            }
        }
        return null;
    }

    function extractSenderEmail() {
        // Strategy 1: [email] attribute
        const emailEl = querySelectorFallback(SELECTORS.senderEmail);
        if (emailEl) {
            return emailEl.getAttribute("email") || emailEl.textContent.trim();
        }
        // Strategy 2: Parse from header text
        const fromHeaders = document.querySelectorAll('.gD');
        for (const el of fromHeaders) {
            const email = el.getAttribute("email");
            if (email) return email;
        }
        return null;
    }

    function extractEmailBody() {
        const bodyEl = querySelectorFallback(SELECTORS.emailBody);
        if (bodyEl) {
            return bodyEl.innerText.trim().substring(0, 5000); // Cap at 5000 chars
        }
        return null;
    }

    function extractSubject() {
        const subjectEl = querySelectorFallback(SELECTORS.subject);
        return subjectEl ? subjectEl.textContent.trim() : null;
    }

    function extractReplyTo() {
        // Reply-To is often in expanded headers
        // Look for the "Reply-To:" label in expanded email details
        const headerRows = document.querySelectorAll('.ajy .g3, .gE.iv.gt .ajy');
        for (const row of headerRows) {
            const text = row.textContent || '';
            if (text.toLowerCase().includes('reply-to')) {
                const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
                if (emailMatch) return emailMatch[0];
            }
        }

        // Fallback: look in any expanded header area
        const detailsArea = document.querySelector('.kv, .ajH');
        if (detailsArea) {
            const allText = detailsArea.textContent;
            const replyIdx = allText.toLowerCase().indexOf('reply-to');
            if (replyIdx !== -1) {
                const after = allText.substring(replyIdx);
                const emailMatch = after.match(/[\w.-]+@[\w.-]+\.\w+/);
                if (emailMatch) return emailMatch[0];
            }
        }

        return null;
    }

    function getEmailIdentifier() {
        // Create a unique ID based on sender + subject
        const sender = extractSenderEmail();
        const subject = extractSubject();
        return `${sender}::${subject}`;
    }

    // ── Badge / Warning injection ──────────────────

    const RISK_STYLES = {
        CRITICAL: { bg: "#E24B4A", label: "CRITICAL THREAT", icon: "⛔" },
        HIGH: { bg: "#EF9F27", label: "HIGH RISK", icon: "⚠️" },
        MEDIUM: { bg: "#F0C040", label: "MEDIUM RISK", icon: "⚡" },
        LOW: { bg: "#1D9E75", label: "LOW RISK", icon: "✅" },
    };

    function removeExistingBanners() {
        document.querySelectorAll(".vexor-phishing-banner").forEach((el) => el.remove());
    }

    function injectBanner(result) {
        removeExistingBanners();

        const style = RISK_STYLES[result.risk_level] || RISK_STYLES.MEDIUM;

        // Find the email body container to inject above
        const emailBody = querySelectorFallback(SELECTORS.emailBody);
        if (!emailBody) return;

        const container = emailBody.closest('.adn') || emailBody.closest('.gs') || emailBody.parentElement;
        if (!container) return;

        const banner = document.createElement("div");
        banner.className = "vexor-phishing-banner";
        banner.innerHTML = `
      <div class="vexor-banner-main">
        <div class="vexor-banner-left">
          <span class="vexor-banner-icon">${style.icon}</span>
          <div class="vexor-banner-info">
            <strong class="vexor-banner-level">${style.label}</strong>
            <span class="vexor-banner-score">Risk Score: ${result.risk_score}/100</span>
          </div>
        </div>
        <button class="vexor-banner-toggle" aria-label="Toggle details">▼</button>
      </div>
      <div class="vexor-banner-details vexor-collapsed">
        <p class="vexor-banner-explanation">${result.explanation || ""}</p>
        ${result.recommended_action ? `<p class="vexor-banner-action"><strong>Action:</strong> ${result.recommended_action}</p>` : ""}
        ${result.matched_org ? `<p class="vexor-banner-impersonation">⚠️ <strong>Impersonating:</strong> ${result.matched_org}</p>` : ""}
        ${result.domain_mismatch ? `<p class="vexor-banner-warning vexor-domain-warn">🔴 Domain mismatch detected</p>` : ""}
        ${result.reply_to_mismatch ? `<p class="vexor-banner-warning vexor-reply-warn">🟠 Reply-to address mismatch</p>` : ""}
        ${result.key_indicators && result.key_indicators.length > 0
                ? `<div class="vexor-banner-indicators">
              ${result.key_indicators.map(ind => `<span class="vexor-indicator-chip">${ind}</span>`).join("")}
            </div>`
                : ""}
      </div>
    `;

        // Set dynamic color
        banner.style.borderLeftColor = style.bg;

        // Toggle details
        const toggleBtn = banner.querySelector(".vexor-banner-toggle");
        const details = banner.querySelector(".vexor-banner-details");
        toggleBtn.addEventListener("click", () => {
            details.classList.toggle("vexor-collapsed");
            toggleBtn.textContent = details.classList.contains("vexor-collapsed") ? "▼" : "▲";
        });

        container.insertBefore(banner, container.firstChild);
    }

    function injectScanningIndicator() {
        removeExistingBanners();

        const emailBody = querySelectorFallback(SELECTORS.emailBody);
        if (!emailBody) return;

        const container = emailBody.closest('.adn') || emailBody.closest('.gs') || emailBody.parentElement;
        if (!container) return;

        const banner = document.createElement("div");
        banner.className = "vexor-phishing-banner vexor-scanning";
        banner.innerHTML = `
      <div class="vexor-banner-main">
        <div class="vexor-banner-left">
          <span class="vexor-banner-icon vexor-spin">🛡️</span>
          <div class="vexor-banner-info">
            <strong class="vexor-banner-level">Scanning with Vexor...</strong>
            <span class="vexor-banner-score">Analyzing email for phishing threats</span>
          </div>
        </div>
      </div>
    `;
        banner.style.borderLeftColor = "#8b5cf6";

        container.insertBefore(banner, container.firstChild);
    }

    // ── Core analysis flow ─────────────────────────

    async function analyzeCurrentEmail() {
        const emailId = getEmailIdentifier();

        // Skip if same email or no valid data
        if (!emailId || emailId === "null::null") return;
        if (emailId === lastAnalyzedId) return;
        if (isAnalyzing) return;

        // Check cache
        if (ANALYSIS_CACHE.has(emailId)) {
            const cached = ANALYSIS_CACHE.get(emailId);
            injectBanner(cached);
            return;
        }

        const senderEmail = extractSenderEmail();
        const emailBody = extractEmailBody();

        if (!senderEmail || !emailBody) return;

        const replyTo = extractReplyTo();

        isAnalyzing = true;
        lastAnalyzedId = emailId;

        // Show scanning indicator
        injectScanningIndicator();

        try {
            const result = await chrome.runtime.sendMessage({
                action: "analyze",
                emailBody,
                senderEmail,
                replyTo,
            });

            if (result && result.data) {
                ANALYSIS_CACHE.set(emailId, result.data);
                injectBanner(result.data);
            } else if (result && result.error) {
                removeExistingBanners();
                console.warn("[Vexor]", result.error);
            }
        } catch (err) {
            console.error("[Vexor] Analysis failed:", err);
            removeExistingBanners();
        } finally {
            isAnalyzing = false;
        }
    }

    function debouncedAnalyze() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(analyzeCurrentEmail, DEBOUNCE_MS);
    }

    // ── Gmail navigation detection ─────────────────

    function isEmailOpen() {
        // Check if we're viewing a single email/thread
        return !!querySelectorFallback(SELECTORS.emailBody);
    }

    function onDomChange() {
        if (isEmailOpen()) {
            debouncedAnalyze();
        }
    }

    // ── MutationObserver ───────────────────────────

    function startObserver() {
        const target = document.querySelector('[role="main"]') || document.body;

        const observer = new MutationObserver((mutations) => {
            // Filter for meaningful changes (not just style/attribute tweaks)
            const hasRelevantChange = mutations.some((m) =>
                m.type === "childList" && m.addedNodes.length > 0
            );
            if (hasRelevantChange) {
                onDomChange();
            }
        });

        observer.observe(target, {
            childList: true,
            subtree: true,
        });

        console.log("[Vexor] Phishing Shield active on Gmail");
    }

    // ── Bootstrap ──────────────────────────────────

    // Wait for Gmail to fully load
    function waitForGmail() {
        const check = () => {
            if (document.querySelector('[role="main"]') || document.querySelector('.AO')) {
                startObserver();
                // Check if there's already an email open
                if (isEmailOpen()) {
                    debouncedAnalyze();
                }
            } else {
                setTimeout(check, 500);
            }
        };
        check();
    }

    // Start
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", waitForGmail);
    } else {
        waitForGmail();
    }

})();
