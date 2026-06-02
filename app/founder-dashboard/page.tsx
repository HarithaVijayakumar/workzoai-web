"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Laptop,
  Mic,
  RefreshCcw,
  Save,
  Smartphone,
  Tablet,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type AnalyticsEvent = {
  id?: number | string;
  session_id?: string | null;
  event?: string | null;
  path?: string | null;
  source?: string | null;
  device?: string | null;
  recruiter?: string | null;
  mode?: string | null;
  role?: string | null;
  market?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

type AnalyticsSummary = {
  totalEvents: number;
  uniqueSessions: number;
  interviewStarts: number;
  interviewCompleted: number;
  completionRate: number;
  mobileEvents: number;
  desktopEvents: number;
  tabletEvents: number;
  unknownDeviceEvents: number;
  mobileSessions: number;
  desktopSessions: number;
  tabletSessions: number;
  unknownDeviceSessions: number;
  recruiterCounts: Record<string, number>;
  eventCounts: Record<string, number>;
  errors: AnalyticsEvent[];
  dropOffSignals: AnalyticsEvent[];
};

type AnalyticsResponse = {
  success?: boolean;
  error?: string;
  summary?: AnalyticsSummary;
  stats?: AnalyticsSummary;
  recentEvents?: AnalyticsEvent[];
  events?: AnalyticsEvent[];
  generatedAt?: string;
};

const emptySummary: AnalyticsSummary = {
  totalEvents: 0,
  uniqueSessions: 0,
  interviewStarts: 0,
  interviewCompleted: 0,
  completionRate: 0,
  mobileEvents: 0,
  desktopEvents: 0,
  tabletEvents: 0,
  unknownDeviceEvents: 0,
  mobileSessions: 0,
  desktopSessions: 0,
  tabletSessions: 0,
  unknownDeviceSessions: 0,
  recruiterCounts: {},
  eventCounts: {},
  errors: [],
  dropOffSignals: [],
};

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en").format(Number(value || 0));
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 10) / 10}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "Recent";

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Recent";
  }
}

function cleanLabel(value?: string | null, fallback = "Unknown") {
  const text = String(value || "").replace(/_/g, " ").replace(/-/g, " ").trim();
  if (!text) return fallback;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeEventName(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getEventCount(eventCounts: Record<string, number>, aliases: string[]) {
  const wanted = new Set(aliases.map(normalizeEventName));

  return Object.entries(eventCounts || {}).reduce((total, [event, count]) => {
    return wanted.has(normalizeEventName(event)) ? total + Number(count || 0) : total;
  }, 0);
}

function topEntries(map: Record<string, number>, limit = 8) {
  return Object.entries(map || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function eventTone(event?: string | null) {
  const text = String(event || "").toLowerCase();
  if (text.includes("error") || text.includes("failed")) return "border-red-300/20 bg-red-400/[0.07] text-red-100";
  if (text.includes("saved") || text.includes("completed")) return "border-emerald-300/20 bg-emerald-400/[0.07] text-emerald-100";
  if (text.includes("started") || text.includes("viewed")) return "border-blue-300/20 bg-blue-400/[0.07] text-blue-100";
  return "border-white/10 bg-black/20 text-slate-200";
}

export default function FounderDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<AnalyticsSummary>(emptySummary);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analytics", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => ({}))) as AnalyticsResponse;
      const nextSummary = data.summary || data.stats || emptySummary;

      setSummary(nextSummary);
      setRecentEvents(data.recentEvents || data.events?.slice(0, 50) || []);
      setGeneratedAt(data.generatedAt || new Date().toISOString());

      if (!data.success && data.error) {
        setError(data.error);
      }
    } catch (requestError) {
      setSummary(emptySummary);
      setRecentEvents([]);
      setError(requestError instanceof Error ? requestError.message : "Could not load founder analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const founderMetrics = useMemo(() => {
    const resultsViewed = getEventCount(summary.eventCounts, [
      "results_viewed",
      "result_viewed",
      "results_page_viewed",
      "interview_results_viewed",
    ]);

    const reportsSaved = getEventCount(summary.eventCounts, [
      "report_saved",
      "results_saved",
      "saved_report",
      "interview_saved",
      "interview_session_saved",
      "session_saved",
      "history_saved",
    ]);

    const landingViewed = getEventCount(summary.eventCounts, ["landing_viewed", "home_viewed", "landing_page_viewed"]);
    const onboardingViewed = getEventCount(summary.eventCounts, ["onboarding_viewed", "onboarding_started"]);
    const interviewRoomViewed = getEventCount(summary.eventCounts, ["interview_room_viewed", "interview_page_viewed"]);
    const interviewStarted = summary.interviewStarts || getEventCount(summary.eventCounts, ["interview_started"]);
    const interviewCompleted = summary.interviewCompleted || getEventCount(summary.eventCounts, ["interview_completed", "interview_ended"]);
    const abandoned = Math.max(0, interviewStarted - interviewCompleted);
    const resultViewRate = interviewCompleted > 0 ? (resultsViewed / interviewCompleted) * 100 : 0;
    const saveRate = resultsViewed > 0 ? (reportsSaved / resultsViewed) * 100 : 0;

    const funnel = [
      { label: "Landing Viewed", value: landingViewed },
      { label: "Onboarding Viewed", value: onboardingViewed },
      { label: "Interview Room Viewed", value: interviewRoomViewed },
      { label: "Interview Started", value: interviewStarted },
      { label: "Interview Completed", value: interviewCompleted },
      { label: "Results Viewed", value: resultsViewed },
      { label: "Report Saved", value: reportsSaved },
    ];

    return {
      resultsViewed,
      reportsSaved,
      abandoned,
      resultViewRate,
      saveRate,
      funnel,
      maxFunnelValue: Math.max(1, ...funnel.map((item) => item.value)),
    };
  }, [summary]);

  const statCards = useMemo(
    () => [
      { label: "Production Events", value: formatNumber(summary.totalEvents), icon: BarChart3 },
      { label: "Unique Sessions", value: formatNumber(summary.uniqueSessions), icon: Users },
      { label: "Interviews Started", value: formatNumber(summary.interviewStarts), icon: Mic },
      { label: "Completed", value: formatNumber(summary.interviewCompleted), icon: CheckCircle2 },
      { label: "Results Viewed", value: formatNumber(founderMetrics.resultsViewed), icon: FileText },
      { label: "Result View Rate", value: formatPercent(founderMetrics.resultViewRate), icon: TrendingUp },
      { label: "Reports Saved", value: formatNumber(founderMetrics.reportsSaved), icon: Save },
      { label: "Save Rate", value: formatPercent(founderMetrics.saveRate), icon: Save },
      { label: "Abandoned", value: formatNumber(founderMetrics.abandoned), icon: TrendingDown },
      { label: "Completion Rate", value: `${summary.completionRate || 0}%`, icon: TrendingUp },
      { label: "Mobile Sessions", value: formatNumber(summary.mobileSessions), icon: Smartphone },
      { label: "Desktop Sessions", value: formatNumber(summary.desktopSessions), icon: Laptop },
      { label: "Tablet Sessions", value: formatNumber(summary.tabletSessions), icon: Tablet },
    ],
    [summary, founderMetrics],
  );

  const eventEntries = topEntries(summary.eventCounts, 10);
  const recruiterEntries = topEntries(summary.recruiterCounts, 6);

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-white/[0.03] p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">Founder Dashboard</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">WorkZo Production Signals</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Production-safe analytics from Supabase. Track the full funnel from landing to interview completion, results viewed, and saved reports.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/[0.07] px-3 py-1.5 text-emerald-100">
              <Clock3 className="h-3.5 w-3.5" />
              {generatedAt ? `Updated ${formatDate(generatedAt)}` : "Waiting for data"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              Local testing excluded
            </span>
          </div>
        </section>

        {error ? (
          <section className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-400/[0.07] p-5 text-amber-100">
            <div className="flex items-center gap-2 font-black">
              <AlertTriangle className="h-5 w-5" />
              Analytics warning
            </div>
            <p className="mt-2 text-sm leading-6">{error}</p>
          </section>
        ) : null}

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <Icon className="h-5 w-5 text-blue-300" />
                </div>
                <p className="mt-3 text-3xl font-black">{item.value}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black">User Funnel</h2>
              <p className="mt-1 text-sm text-slate-400">Use this to see exactly where users drop off after interview completion.</p>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-slate-300">
              Results viewed: {formatNumber(founderMetrics.resultsViewed)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-7">
            {founderMetrics.funnel.map((item, index) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3 lg:block">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Step {index + 1}</p>
                    <p className="mt-1 text-sm font-black text-slate-200">{item.label}</p>
                  </div>
                  <p className="text-2xl font-black text-blue-200 lg:mt-3">{formatNumber(item.value)}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${Math.max(4, Math.min(100, (item.value / founderMetrics.maxFunnelValue) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-black">Event Breakdown</h2>
            <p className="mt-1 text-sm text-slate-400">Launch-critical events including results viewed and report saved.</p>

            <div className="mt-4 space-y-3">
              {eventEntries.map(([event, count]) => (
                <div key={event} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-black text-slate-200">{cleanLabel(event)}</p>
                    <p className="text-xl font-black text-blue-200">{formatNumber(count)}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-400"
                      style={{ width: `${Math.max(4, Math.min(100, (count / Math.max(1, summary.totalEvents)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}

              {!eventEntries.length ? (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                  No production analytics yet. Localhost testing is intentionally not counted.
                </p>
              ) : null}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-black">Recruiter Usage</h2>

              <div className="mt-4 space-y-3">
                {recruiterEntries.map(([recruiter, count]) => (
                  <div key={recruiter} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="font-bold text-slate-200">{cleanLabel(recruiter)}</p>
                    <p className="font-black text-blue-200">{formatNumber(count)}</p>
                  </div>
                ))}

                {!recruiterEntries.length ? (
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                    No recruiter usage yet.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-black">Recent Events</h2>

              <div className="mt-4 space-y-3">
                {recentEvents.slice(0, 10).map((event, index) => (
                  <div
                    key={`${event.id || event.session_id || "event"}-${event.created_at || index}`}
                    className={`rounded-2xl border p-3 ${eventTone(event.event)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{cleanLabel(event.event, "Unknown event")}</p>
                        <p className="mt-1 text-xs opacity-70">{formatDate(event.created_at)}</p>
                      </div>
                      <p className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] font-bold opacity-80">
                        {cleanLabel(event.device, "Unknown")}
                      </p>
                    </div>
                    {event.role ? <p className="mt-2 text-sm opacity-80">{event.role}</p> : null}
                    {event.source ? <p className="mt-1 text-xs opacity-60">Source: {event.source}</p> : null}
                  </div>
                ))}

                {!recentEvents.length ? (
                  <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                    No recent production events yet.
                  </p>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
