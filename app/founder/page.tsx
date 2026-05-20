"use client";

import { useEffect, useMemo, useState } from "react";

type FounderSummary = {
  totalEvents?: number;
  uniqueSessions?: number;
  uploads?: number;
  interviewsStarted?: number;
  answersSubmitted?: number;
  completedInterviews?: number;
  resultsViewed?: number;
  completionRate?: number;
  answerRate?: number;
  resultRate?: number;
  voiceStarts?: number;
  voiceFailures?: number;
  voiceFailureRate?: number;
  mobileShare?: number;
  recruiters?: Record<string, number>;
  devices?: Record<string, number>;
  trafficSources?: Record<string, number>;
  dropoffFunnel?: Array<{ stage: string; count: number }>;
  sessionReplay?: Array<{ sessionId?: string; events?: number; first?: string; last?: string; device?: string; recruiter?: string; completed?: boolean }>;
  topWeakness?: string;
  insight?: string;
  storage?: { backend?: string; supabaseConfigured?: boolean; supabaseTable?: string; note?: string };
};

type ApiResponse = {
  success?: boolean;
  summary?: FounderSummary;
  stats?: {
    totalEvents?: number;
    interviewStarts?: number;
    interviewCompleted?: number;
    completionRate?: number;
    mobileUsers?: number;
    desktopUsers?: number;
    recruiterCounts?: Record<string, number>;
  };
  events?: any[];
  recentEvents?: any[];
};

const emptySummary: FounderSummary = {
  totalEvents: 0,
  uniqueSessions: 0,
  uploads: 0,
  interviewsStarted: 0,
  answersSubmitted: 0,
  completedInterviews: 0,
  resultsViewed: 0,
  completionRate: 0,
  answerRate: 0,
  resultRate: 0,
  voiceStarts: 0,
  voiceFailures: 0,
  voiceFailureRate: 0,
  mobileShare: 0,
  recruiters: {},
  devices: {},
  trafficSources: {},
  dropoffFunnel: [],
  sessionReplay: [],
  topWeakness: "Not enough data yet",
  insight: "Collecting analytics...",
};

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function timeLabel(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function FounderDashboard() {
  const [summary, setSummary] = useState<FounderSummary>(emptySummary);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analytics", { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(typeof (data as any)?.error === "string" ? (data as any).error : "Analytics request failed");
      }

      const fallbackSummary: FounderSummary = {
        totalEvents: data.stats?.totalEvents ?? 0,
        interviewsStarted: data.stats?.interviewStarts ?? 0,
        completedInterviews: data.stats?.interviewCompleted ?? 0,
        completionRate: data.stats?.completionRate ?? 0,
        devices: {
          mobile: data.stats?.mobileUsers ?? 0,
          desktop: data.stats?.desktopUsers ?? 0,
        },
        recruiters: data.stats?.recruiterCounts ?? {},
      };

      setSummary({
        ...emptySummary,
        ...fallbackSummary,
        ...(data.summary ?? {}),
        recruiters: data.summary?.recruiters ?? fallbackSummary.recruiters ?? {},
        devices: data.summary?.devices ?? fallbackSummary.devices ?? {},
        trafficSources: data.summary?.trafficSources ?? {},
        dropoffFunnel: Array.isArray(data.summary?.dropoffFunnel) ? data.summary?.dropoffFunnel : [],
        sessionReplay: Array.isArray(data.summary?.sessionReplay) ? data.summary?.sessionReplay : [],
      });

      setEvents(Array.isArray(data.events) ? data.events.slice(0, 60) : Array.isArray(data.recentEvents) ? data.recentEvents : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics");
      setSummary(emptySummary);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  const recruiterRows = useMemo(() => Object.entries(summary.recruiters ?? {}).sort((a, b) => b[1] - a[1]), [summary.recruiters]);
  const deviceRows = useMemo(() => Object.entries(summary.devices ?? {}).sort((a, b) => b[1] - a[1]), [summary.devices]);

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Founder analytics</p>
            <h1 className="mt-2 text-3xl font-black sm:text-5xl">WorkZo AI Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Live Supabase-ready analytics for launch traffic, interviews, devices, drop-offs, and recruiter usage.</p>
          </div>
          <button onClick={loadAnalytics} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15">
            Refresh
          </button>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-300">Loading analytics...</div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric title="Total events" value={numberValue(summary.totalEvents)} />
              <Metric title="Unique sessions" value={numberValue(summary.uniqueSessions)} />
              <Metric title="Interview starts" value={numberValue(summary.interviewsStarted)} />
              <Metric title="Completed" value={numberValue(summary.completedInterviews)} />
              <Metric title="Completion rate" value={`${numberValue(summary.completionRate)}%`} />
              <Metric title="Answer rate" value={`${numberValue(summary.answerRate)}%`} />
              <Metric title="Mobile share" value={`${numberValue(summary.mobileShare)}%`} />
              <Metric title="Voice failures" value={numberValue(summary.voiceFailures)} />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-3">
              <Panel title="Drop-off funnel" className="lg:col-span-2">
                <div className="space-y-3">
                  {(summary.dropoffFunnel ?? []).length === 0 ? (
                    <Empty text="No funnel data yet." />
                  ) : (
                    (summary.dropoffFunnel ?? []).map((stage) => (
                      <div key={stage.stage} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-bold text-slate-200">{stage.stage}</span>
                          <span className="text-2xl font-black text-cyan-200">{stage.count}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${Math.min(100, Math.max(4, stage.count * 12))}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>

              <Panel title="Launch insight">
                <p className="text-lg font-bold text-white">{summary.insight}</p>
                <p className="mt-4 text-sm text-slate-400">Top weakness: {summary.topWeakness}</p>
                <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                  Storage: {summary.storage?.backend ?? "analytics route"}
                </p>
              </Panel>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <Panel title="Recruiter popularity">
                {recruiterRows.length === 0 ? <Empty text="No recruiter data yet." /> : <Rows rows={recruiterRows} />}
              </Panel>
              <Panel title="Device mix">
                {deviceRows.length === 0 ? <Empty text="No device data yet." /> : <Rows rows={deviceRows} />}
              </Panel>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <Panel title="Session replay summary">
                <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                  {(summary.sessionReplay ?? []).length === 0 ? (
                    <Empty text="No session replay summary yet." />
                  ) : (
                    (summary.sessionReplay ?? []).slice(0, 25).map((session, index) => (
                      <div key={`${session.sessionId}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-bold text-slate-100">{session.sessionId ?? "unknown session"}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${session.completed ? "bg-emerald-500/15 text-emerald-200" : "bg-yellow-500/15 text-yellow-200"}`}>
                            {session.completed ? "Completed" : "In progress / dropped"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          {session.events ?? 0} events · {session.device ?? "unknown device"} · {session.recruiter ?? "no recruiter"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Last: {timeLabel(session.last)}</div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>

              <Panel title="Recent events">
                <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                  {events.length === 0 ? (
                    <Empty text="No events yet." />
                  ) : (
                    events.map((event, index) => (
                      <div key={`${event.id ?? index}-${event.event}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-slate-100">{event.event ?? "unknown_event"}</span>
                          <span className="text-xs text-slate-500">{event.device ?? ""}</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-400">{event.path ?? "/"}</div>
                        <div className="mt-1 text-xs text-slate-500">{timeLabel(event.created_at ?? event.timestamp)}</div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl ${className}`}>
      <h2 className="mb-4 text-xl font-black text-white">{title}</h2>
      {children}
    </div>
  );
}

function Rows({ rows }: { rows: Array<[string, number]> }) {
  return (
    <div className="space-y-3">
      {rows.map(([name, count]) => (
        <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
          <span className="font-bold capitalize text-slate-200">{name}</span>
          <span className="text-xl font-black text-cyan-200">{count}</span>
        </div>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">{text}</p>;
}
