import {
  AlertTriangle,
  Building,
  ChevronRight,
  Copy,
  Lock,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createDrill, getDrillResults, listDrills } from "@/lib/api";

const orgOptions = [
  "Azərbaycan Respublikasının Mərkəzi Bankı",
  "Kapital Bank",
  "ASAN Xidmət",
  "Vergilər Nazirliyi",
  "Maliyyə Nazirliyi",
  "Dövlət Sosial Müdafiə Fondu",
  "Dövlət Gömrük Komitəsi",
  "Azərenerji",
  "Azərsu",
  "Bakcell"
];

export default function Drill() {
  const [form, setForm] = useState({ org: orgOptions[0], targetEmails: "" });
  const [loading, setLoading] = useState(false);
  const [drills, setDrills] = useState([]);
  const [preview, setPreview] = useState(null);
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(null);

  useEffect(() => {
    fetchDrills();
  }, []);

  const fetchDrills = async () => {
    try {
      const { data } = await listDrills();
      setDrills(data);
    } catch (error) {
      toast.error("Unable to load drills.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const emails = form.targetEmails
      .split("\n")
      .map((email) => email.trim())
      .filter(Boolean);

    if (!emails.length) {
      toast.error("Enter at least one target email.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await createDrill({
        org_name: form.org,
        target_emails: emails
      });
      setPreview({
        subject: data.subject,
        body: data.body_preview,
        sent_count: emails.length
      });
      setForm((prev) => ({ ...prev, targetEmails: "" }));
      toast.success("Drill created and sent.");
      fetchDrills();
    } catch (error) {
      toast.error(error.response?.data?.detail ?? "Unable to create drill.");
    } finally {
      setLoading(false);
    }
  };

  const handleDetails = async (drillId) => {
    setSelectedDrill(selectedDrill === drillId ? null : drillId);
    if (detailsCache[drillId]) {
      return;
    }
    setDetailsLoading(drillId);
    try {
      const { data } = await getDrillResults(drillId);
      setDetailsCache((prev) => ({ ...prev, [drillId]: data }));
    } catch {
      toast.error("Unable to load drill results.");
    } finally {
      setDetailsLoading(null);
    }
  };

  const previewBadge = useMemo(
    () =>
      preview && (
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#080808]">
          Sent to {preview.sent_count} targets
        </span>
      ),
    [preview]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="bg-[linear-gradient(135deg,#ffffff,#aaaaaa)] bg-clip-text text-4xl font-black text-transparent">
          Vexor Drill
        </h2>
        <p className="text-lg text-vexor-muted">Test your team's phishing awareness with AI-generated simulations</p>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-3 py-1 text-xs font-semibold text-[#080808]">
          <Lock className="h-3 w-3" />
          For authorized security training only
        </span>
      </div>

      <Card className="border-vexor-border bg-vexor-card">
        <CardHeader>
          <CardTitle>Create Drill</CardTitle>
          <CardDescription>Select an organization and target emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-vexor-muted" htmlFor="org-select">
                Select Organization to Impersonate
              </label>
              <select
                id="org-select"
                value={form.org}
                onChange={(event) => setForm((prev) => ({ ...prev, org: event.target.value }))}
                className="w-full rounded-xl border border-vexor-border bg-[#141414] px-4 py-3 text-sm text-vexor-text outline-none transition focus:border-white focus:ring-4 focus:ring-white/10"
              >
                {orgOptions.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-vexor-muted" htmlFor="targets">
                Target Emails (One per line)
              </label>
              <textarea
                id="targets"
                className="min-h-[140px] w-full rounded-xl border border-vexor-border bg-[#141414] px-4 py-3 text-sm text-vexor-text outline-none transition placeholder:text-[#484F58] focus:border-white focus:ring-4 focus:ring-white/10"
                placeholder="employee1@company.az\nemployee2@company.az"
                value={form.targetEmails}
                onChange={(event) => setForm((prev) => ({ ...prev, targetEmails: event.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Target className="mr-2 h-4 w-4" />
              {loading ? "Generating phishing email with AI..." : "Generate & Send Drill"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-critical bg-[#111111] p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-critical">
                SIMULATED PHISHING EMAIL <span className="text-white">DO NOT FORWARD</span>
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">{preview.subject}</h3>
            </div>
            {previewBadge}
          </div>
          <p className="mt-4 text-sm text-vexor-muted">{preview.body}</p>
        </motion.div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-vexor-muted">Existing Drills</p>
            <h3 className="text-2xl font-semibold text-white">Results & Click Rates</h3>
          </div>
          <Button variant="ghost" onClick={fetchDrills}>
            Refresh
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {drills.map((drill) => {
            const colorClass =
              drill.click_rate > 50 ? "text-critical" : drill.click_rate > 20 ? "text-high" : "text-low";
            const progressWidth = `${Math.min(100, (drill.clicked_count / Math.max(1, drill.total_targets)) * 100)}%`;
            return (
              <Card key={drill.drill_id} className="border-vexor-border bg-vexor-card">
                <CardHeader className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">
                    {drill.org_name}
                    <span className={cn("ml-2 text-xs font-semibold uppercase", colorClass)}>
                      {drill.click_rate}% click rate
                    </span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleDetails(drill.drill_id)}>
                    View Details
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-vexor-muted">Created: {new Date(drill.created_at).toLocaleString()}</p>
                  <div className="h-2 rounded-full bg-[#1a1a1a]">
                    <div className="h-2 rounded-full bg-white" style={{ width: progressWidth }} />
                  </div>
                  {selectedDrill === drill.drill_id && (
                    <div className="space-y-2 rounded-xl border border-vexor-border/70 bg-vexor-bg/60 p-3 text-sm">
                      <p className="font-semibold text-white">Targets</p>
                      {detailsLoading === drill.drill_id ? (
                        <p className="text-vexor-muted">Loading...</p>
                      ) : detailsCache[drill.drill_id] ? (
                        detailsCache[drill.drill_id].results.map((item) => (
                          <p key={item.email} className="flex items-center justify-between text-xs text-vexor-muted">
                            <span>{item.email}</span>
                            <span className="flex items-center gap-1">
                              {item.clicked ? (
                                <>
                                  <CheckCircle className="h-3 w-3 text-low" />
                                  Clicked
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 text-high" />
                                  Not clicked
                                </>
                              )}
                            </span>
                          </p>
                        ))
                      ) : (
                        <p className="text-vexor-muted">Click "View Details" to load per-email status.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
