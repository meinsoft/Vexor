import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Activity, AlertTriangle, Eye, Shield, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyStats, getOverview, getTimeline } from "@/lib/api";
import { cn } from "@/lib/utils";

const RISK_COLORS = {
  CRITICAL: "#DC2626",
  HIGH: "#EA580C",
  MEDIUM: "#CA8A04",
  LOW: "#16A34A"
};

const timelineAreas = [
  { key: "critical", color: "#DC2626", label: "Critical" },
  { key: "high", color: "#EA580C", label: "High" },
  { key: "medium", color: "#CA8A04", label: "Medium" },
  { key: "low", color: "#16A34A", label: "Low" }
];

function LoadingCard() {
  return <div className="h-36 animate-pulse rounded-xl border border-vexor-border bg-vexor-card/80 shadow-[0_0_20px_rgba(255,255,255,0.05)]" />;
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  return typeof value === "number" ? value.toLocaleString() : value;
}

function formatDateLabel(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return `${String(parsed.getMonth() + 1).padStart(2, "0")}/${String(parsed.getDate()).padStart(2, "0")}`;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return "Unknown time";
  }
  const parsed = new Date(timestamp);
  const seconds = Math.max(1, Math.floor((Date.now() - parsed.getTime()) / 1000));

  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }
  if (seconds < 604800) {
    return `${Math.floor(seconds / 86400)}d ago`;
  }
  return parsed.toLocaleDateString();
}

function TimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-vexor-border bg-vexor-card px-4 py-3 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
      <p className="mb-2 text-sm font-medium text-vexor-text">{label}</p>
      <div className="space-y-1 text-sm">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="text-vexor-text">{entry.value ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const normalized = String(level || "LOW").toUpperCase();
  const color = RISK_COLORS[normalized] ?? "#FFFFFF";

  return (
    <span
      className="inline-flex min-w-24 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold"
      style={{
        color,
        borderColor: `${color}66`,
        backgroundColor: `${color}14`
      }}
    >
      {normalized}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      const [myStatsResult, overviewResult, timelineResult] = await Promise.allSettled([
        getMyStats(),
        getOverview(),
        getTimeline()
      ]);

      if (!isMounted) {
        return;
      }

      const failures = [];

      if (myStatsResult.status === "fulfilled") {
        setMyStats(myStatsResult.value.data);
      } else {
        failures.push("personal stats");
      }

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value.data);
      } else {
        failures.push("platform overview");
      }

      if (timelineResult.status === "fulfilled") {
        setTimeline(timelineResult.value.data);
      } else {
        failures.push("timeline");
      }

      if (failures.length) {
        toast.error(`Failed to load ${failures.join(", ")}.`);
      }

      setLoading(false);
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const donutData = useMemo(
    () => [
      { name: "CRITICAL", value: myStats?.critical_count ?? 0, color: RISK_COLORS.CRITICAL },
      { name: "HIGH", value: myStats?.high_count ?? 0, color: RISK_COLORS.HIGH },
      { name: "MEDIUM", value: myStats?.medium_count ?? 0, color: RISK_COLORS.MEDIUM },
      { name: "LOW", value: myStats?.low_count ?? 0, color: RISK_COLORS.LOW }
    ],
    [myStats]
  );

  const donutTotal = donutData.reduce((sum, item) => sum + item.value, 0);
  const topOrgs = myStats?.top_targeted_orgs ?? [];
  const maxOrgCount = Math.max(...topOrgs.map((item) => item.count), 1);
  const recentAnalyses = myStats?.recent_analyses ?? [];

  const avgRiskTone =
    (myStats?.avg_risk_score ?? 0) > 60
      ? "text-critical"
      : (myStats?.avg_risk_score ?? 0) >= 30
      ? "text-medium"
      : "text-low";

  const platformCards = [
    {
      label: "Platform Analyses",
      value: overview?.total_analyses_platform ?? 0,
      subtitle: "Across all users",
      icon: Users
    },
    {
      label: "Critical Rate",
      value: `${overview?.critical_rate ?? 0}%`,
      subtitle: "CRITICAL verdict share",
      icon: AlertTriangle
    },
    {
      label: "Analyses This Week",
      value: overview?.analyses_this_week ?? 0,
      subtitle: `${overview?.analyses_today ?? 0} today`,
      icon: Activity
    }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <LoadingCard key={index} />)
        ) : (
          <>
            {[
              {
                label: "Total Analyses",
                value: formatNumber(myStats?.total_analyses ?? 0),
                subtitle: "All time",
                icon: Activity,
                iconColor: "text-white"
              },
              {
                label: "Critical Threats",
                value: formatNumber(myStats?.critical_count ?? 0),
                subtitle: (myStats?.critical_count ?? 0) > 0 ? "Immediate action required" : "No critical threats",
                icon: AlertTriangle,
                iconColor: "text-critical",
                subtitleClass: (myStats?.critical_count ?? 0) > 0 ? "text-critical drop-shadow-[0_0_14px_rgba(220,38,38,0.35)]" : ""
              },
              {
                label: "Domain Mismatch Rate",
                value: `${formatNumber(myStats?.domain_mismatch_rate ?? 0)}%`,
                subtitle: "opendata.az verified",
                icon: Shield,
                iconColor: "text-high"
              },
              {
                label: "Avg Risk Score",
                value: formatNumber(myStats?.avg_risk_score ?? 0),
                subtitle: "Threat pressure baseline",
                icon: TrendingUp,
                iconColor: "text-white",
                valueClass: avgRiskTone
              }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.label} whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }}>
                  <Card className="h-full border-vexor-border bg-vexor-card p-6 transition hover:border-vexor-border-hover hover:bg-vexor-card-hover hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-vexor-muted">{item.label}</p>
                        <p className={cn("mt-4 text-3xl font-semibold text-vexor-text", item.valueClass)}>{item.value}</p>
                        <p className={cn("mt-2 text-sm text-vexor-muted", item.subtitleClass)}>{item.subtitle}</p>
                      </div>
                      <div className="rounded-2xl border border-vexor-border/70 bg-vexor-bg/70 p-3">
                        <Icon className={cn("h-5 w-5", item.iconColor)} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="border-vexor-border bg-vexor-card">
          <CardHeader>
            <CardTitle>Threat Timeline - Last 30 Days</CardTitle>
            <CardDescription>Daily distribution of low to critical detections.</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            {loading ? (
              <LoadingCard />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline?.timeline ?? []} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    {timelineAreas.map((item) => (
                      <linearGradient key={item.key} id={`fill-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={item.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={item.color} stopOpacity={0.03} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fill: "#8B949E", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(34,34,34,0.5)" }}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "#8B949E", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <CartesianGrid stroke="rgba(34,34,34,0.5)" strokeDasharray="3 3" vertical={false} />
                  <Tooltip content={<TimelineTooltip />} />
                  {timelineAreas.map((item) => (
                    <Area
                      key={item.key}
                      type="monotone"
                      dataKey={item.key}
                      name={item.label}
                      stackId="threats"
                      stroke={item.color}
                      fill={`url(#fill-${item.key})`}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-vexor-border bg-vexor-card">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>How your analysis history is distributed across severity levels.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[360px] flex-col">
            {loading ? (
              <LoadingCard />
            ) : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={64}
                        outerRadius={94}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <text x="50%" y="46%" textAnchor="middle" className="fill-vexor-text text-3xl font-semibold">
                        {donutTotal}
                      </text>
                      <text x="50%" y="56%" textAnchor="middle" className="fill-[#8B949E] text-sm">
                        Total
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
                  {donutData.map((item) => (
                    <div key={item.name} className="rounded-xl border border-vexor-border/70 bg-vexor-bg/60 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-vexor-muted">{item.name}</span>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-vexor-text">{item.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-vexor-border bg-vexor-card">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-white" />
                Top Targeted Organizations
              </CardTitle>
              <CardDescription>Most frequent impersonation targets detected in your account.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <>
                <LoadingCard />
                <LoadingCard />
              </>
            ) : topOrgs.length ? (
              topOrgs.map((item) => (
                <div key={`${item.org}-${item.count}`} className="space-y-2 rounded-xl border border-vexor-border/70 bg-vexor-bg/55 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate font-medium text-vexor-text">{item.org}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#080808]">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#1A1A1A]">
                    <div
                      className="h-2 rounded-full bg-white"
                      style={{ width: `${Math.max(10, (item.count / maxOrgCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-vexor-border/70 bg-vexor-bg/55 text-center">
                <Shield className="h-10 w-10 text-low" />
                <div>
                  <p className="font-medium text-vexor-text">No threats detected yet</p>
                  <p className="text-sm text-vexor-muted">Once suspicious emails are analyzed, targeted organizations will appear here.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-vexor-border bg-vexor-card">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-white" />
                Recent Analyses
              </CardTitle>
              <CardDescription>Latest verdicts generated by your Vexor account.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <LoadingCard />
                <LoadingCard />
              </>
            ) : recentAnalyses.length ? (
              recentAnalyses.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate("/analyze")}
                  className="flex w-full items-center justify-between gap-4 rounded-xl border border-vexor-border/70 bg-vexor-bg/55 px-4 py-3 text-left transition hover:border-vexor-border-hover hover:bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    <RiskBadge level={item.risk_level} />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-vexor-muted">{item.sender_domain}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {item.matched_org ? (
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs text-[#080808]">{item.matched_org}</span>
                        ) : null}
                        {item.domain_mismatch ? <AlertTriangle className="h-4 w-4 text-critical" /> : null}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-vexor-text">{formatRelativeTime(item.timestamp)}</p>
                    <p className="mt-1 text-xs text-vexor-muted">{item.risk_score}% risk</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-vexor-border/70 bg-vexor-bg/55 text-center">
                <Eye className="h-10 w-10 text-vexor-muted" />
                <div>
                  <p className="font-medium text-vexor-text">No analyses yet. Install the Chrome extension to start.</p>
                  <p className="text-sm text-vexor-muted">Recent verdicts will appear here once emails are scanned.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-vexor-border bg-vexor-card">
        <CardHeader>
          <CardTitle>Platform Intelligence</CardTitle>
          <CardDescription>Aggregate Vexor telemetry across all users on the platform.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {loading ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : (
            platformCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-vexor-border/70 bg-vexor-bg/55 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-vexor-muted">{item.label}</p>
                      <p className="mt-3 text-3xl font-semibold text-vexor-text">{formatNumber(item.value)}</p>
                      <p className="mt-2 text-sm text-vexor-muted">{item.subtitle}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-[#080808]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
