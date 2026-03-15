import {
  AlertTriangle,
  Building,
  CheckCircle,
  ChevronRight,
  Copy,
  Link,
  Mail,
  Search,
  Shield,
  XCircle
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { analyze as analyzeEmail } from "@/lib/api";
import { cn } from "@/lib/utils";

const demoPayload = {
  sender_email: "support@mərkəzibank-az.ru",
  reply_to: "collect@hackers-ru.com",
  email_body:
    "Hörmətli müştəri, hesabınız bloklanıb. Dərhal təsdiqləyin, əks halda silinəcək: http://mərkəzibank-az.ru/verify?token=abc123"
};

const riskStyles = {
  CRITICAL: {
    background: "#DC2626",
    className: "animate-pulse"
  },
  HIGH: {
    background: "#EA580C",
    className: ""
  },
  MEDIUM: {
    background: "#CA8A04",
    className: ""
  },
  LOW: {
    background: "#16A34A",
    className: ""
  }
};

function scoreTone(value) {
  if (value > 70) {
    return "text-critical";
  }
  if (value > 40) {
    return "text-medium";
  }
  return "text-low";
}

function CircularConfidence({ value }) {
  const normalized = Math.max(0, Math.min(100, Number(value) || 0));
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" stroke="#222222" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="#FFFFFF"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-semibold text-vexor-text">{Math.round(normalized)}%</p>
        <p className="text-xs text-vexor-muted">Confidence</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone, children }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-vexor-border bg-vexor-card p-5 transition hover:border-vexor-border-hover hover:bg-vexor-card-hover hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
      <p className="text-sm text-vexor-muted">{label}</p>
      <div className="mt-3">{children ?? <p className={cn("text-3xl font-semibold", tone)}>{value}</p>}</div>
    </motion.div>
  );
}

export default function Analyze() {
  const [form, setForm] = useState({ sender_email: "", reply_to: "", email_body: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const riskStyle = riskStyles[result?.risk_level] ?? riskStyles.LOW;

  const handleChange = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await analyzeEmail(form.email_body, form.sender_email, form.reply_to.trim() || null);
      setResult(data);
      toast.success("Analysis completed.");
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(form.email_body);
      toast.success("Email body copied.");
    } catch {
      toast.error("Unable to copy email body.");
    }
  };

  const fillDemo = () => {
    setForm(demoPayload);
    toast.success("Demo phishing email loaded.");
  };

  const indicators = result?.key_indicators ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-white">
          Email Analyzer
        </h2>
        <p className="text-lg text-vexor-muted">Paste a suspicious email below for instant AI-powered analysis</p>
        <p className="text-sm text-vexor-muted">Your email content is never stored - only metadata is logged</p>
      </div>

      <Card className="border-vexor-border bg-vexor-card">
        <CardHeader>
          <CardTitle>Analyze a Suspicious Message</CardTitle>
          <CardDescription>Provide sender information and the full email body for scoring.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-vexor-muted" />
                <Input
                  className="pl-11"
                  placeholder="support@suspicious-domain.ru"
                  value={form.sender_email}
                  onChange={handleChange("sender_email")}
                  required
                />
              </div>
              <div className="relative">
                <Link className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-vexor-muted" />
                <Input
                  className="pl-11"
                  placeholder="different@other-domain.com (optional)"
                  value={form.reply_to}
                  onChange={handleChange("reply_to")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-vexor-muted">Email Body</p>
                <button
                  type="button"
                  onClick={copyBody}
                  className="inline-flex items-center gap-2 rounded-lg border border-vexor-border bg-vexor-bg/60 px-3 py-1.5 text-xs text-vexor-muted transition hover:border-vexor-border-hover hover:text-vexor-text"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <textarea
                className="min-h-[200px] w-full rounded-xl border border-vexor-border bg-[#141414] px-4 py-3 font-mono text-sm text-vexor-text outline-none transition placeholder:text-[#484F58] focus:border-white focus:ring-4 focus:ring-white/10"
                placeholder="Paste the full email content here..."
                value={form.email_body}
                onChange={handleChange("email_body")}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Search className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              {loading ? "Analyzing with AI..." : "Analyze Email"}
            </Button>
          </form>

          <Button type="button" variant="outline" className="w-full border-vexor-border-hover text-white hover:bg-white/8" onClick={fillDemo}>
            Try with demo phishing email
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-6"
          >
            <div
              className={cn("rounded-2xl px-6 py-8 text-center text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]", riskStyle.className)}
              style={{ background: riskStyle.background }}
            >
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">Risk Level</p>
              <h3 className="mt-3 text-4xl font-black">{result.risk_level}</h3>
              <p className="mt-4 text-5xl font-black">{result.risk_score} / 100</p>
              <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90">{result.explanation}</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <MetricCard label="Email Score" value={`${result.email_phishing_score}%`} tone={scoreTone(result.email_phishing_score)} />
              <MetricCard label="URL Score" value={`${result.url_phishing_score}%`} tone={scoreTone(result.url_phishing_score)} />
              <MetricCard label="Weighted Score" value={`${result.weighted_confidence_score}%`} tone="text-white" />
              <MetricCard label="Confidence">
                <CircularConfidence value={result.weighted_confidence_score} />
              </MetricCard>
            </div>

            {result.domain_mismatch ? (
              <div className="rounded-2xl border border-critical/40 bg-critical/15 p-5 text-critical">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Domain Mismatch Detected</p>
                    <p className="mt-2 text-sm text-vexor-text">
                      This email claims to be from {result.matched_org ?? "an official organization"} but the sender domain does not match official records
                    </p>
                    <p className="mt-1 text-xs text-vexor-muted">Verified against Azerbaijan Open Data Portal (opendata.az)</p>
                  </div>
                </div>
              </div>
            ) : null}

            {result.reply_to_mismatch ? (
              <div className="rounded-2xl border border-high/40 bg-high/12 p-5 text-high">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Reply-To Mismatch</p>
                    <p className="mt-2 text-sm text-vexor-text">Replying to this email will send your response to a different address</p>
                  </div>
                </div>
              </div>
            ) : null}

            {result.matched_org ? (
              <Card className="border-vexor-border-hover bg-vexor-card shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="rounded-2xl bg-white p-3 text-[#080808]">
                    <Building className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-vexor-muted">Impersonating Official Organization</p>
                    <p className="mt-2 text-2xl font-semibold text-vexor-text">{result.matched_org}</p>
                    <p className="mt-1 text-sm text-vexor-muted">Verified in Azerbaijan Government Registry</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-vexor-border bg-vexor-card">
                <CardHeader>
                  <CardTitle>Threat Indicators Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  {indicators.length ? (
                    <div className="flex flex-wrap gap-2">
                      {indicators.map((indicator) => (
                    <span key={indicator} className="rounded-full border border-white/20 bg-white px-3 py-1.5 text-sm text-[#080808]">
                          {indicator}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-low/30 bg-low/10 px-4 py-4 text-low">
                      <CheckCircle className="h-5 w-5" />
                      <span>No threat indicators found</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-vexor-border-hover bg-[#151515]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-white" />
                    Recommended Action
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-7 text-vexor-text">{result.recommended_action}</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-sm text-vexor-muted">Analysis ID: #{result.log_id ?? "n/a"}</p>
          </motion.div>
        ) : (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Card className="border-vexor-border bg-vexor-card">
              <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-white">Chrome Extension</p>
                    <h3 className="mt-2 text-2xl font-semibold text-vexor-text">Analyze emails automatically</h3>
                  </div>
                  <p className="text-vexor-muted">
                    Install the Vexor Chrome Extension to analyze Gmail emails with one click
                  </p>
                  <Button type="button" variant="outline" className="border-vexor-border-hover text-white hover:bg-white/8">
                    Download Extension
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-vexor-border bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%),#101010] p-5">
                  <div className="rounded-2xl border border-vexor-border bg-vexor-card p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-critical" />
                      <div className="h-3 w-3 rounded-full bg-medium" />
                      <div className="h-3 w-3 rounded-full bg-low" />
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl bg-vexor-bg/80 p-3">
                        <p className="text-xs text-vexor-muted">Gmail</p>
                        <p className="mt-2 text-sm text-vexor-text">support@mərkəzibank-az.ru</p>
                      </div>
                      <div className="rounded-xl border border-critical/40 bg-critical/10 p-3">
                        <p className="text-xs text-critical">CRITICAL</p>
                        <p className="mt-2 text-sm text-vexor-text">Domain mismatch + urgency language detected</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-2 flex-1 rounded-full bg-white/15" />
                        <div className="h-2 w-16 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
