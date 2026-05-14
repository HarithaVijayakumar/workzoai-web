"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, BarChart3, Mic, RefreshCw, Upload, Users } from "lucide-react";

type AnalyticsResponse = {
  summary: {
    totalEvents: number;
    uniqueSessions: number;
    uploads: number;
    interviewsStarted: number;
    answersSubmitted: number;
    voiceStarts: number;
    resultsViewed: number;
    answerRate: number;
    resultRate: number;
    counts: Record<string, number>;
    recruiters: Record<string, number>;
    roles: Record<string, number>;
  };
  events: Array<{
    event: string;
    sessionId: string;
    role: string;
    market: string;
    recruiter: string;
    mode: string;
    score: number | null;
    trust: number | null;
    pressure: number | null;
    path: string;
    timestamp: string;
    receivedAt: string;
  }>;
};

const emptyData: AnalyticsResponse = {
  summary: {
    totalEvents: 0,
    uniqueSessions: 0,
    uploads: 0,
    interviewsStarted: 0,
    answersSubmitted: 0,
    voiceStarts: 0,
    resultsViewed: 0,
    answerRate: 0,
    resultRate: 0,
    counts: {},
    recruiters: {},
    roles: {},
  },
  events: [],
};

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <div className="text-cyan-200">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default function FounderAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse>(emptyData);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/analytics", { cache: "no-store" });
      const json = (await response.json()) as AnalyticsResponse;
      setData(json);
    } catch {
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const topRoles = useMemo(
    () => Object.entries(data.summary.roles || {}).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [data.summary.roles]
  );

  const topRecruiters = useMemo(
    () => Object.entries(data.summary.recruiters || {}).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [data.summary.recruiters]
  );

  return (
    <main className="min-h-screen bg-[#020712] px-4 py-5 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-2xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-slate-200">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-black">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        <section className="mt-5 rounded-[32px] border border-white/10 bg-gradient-to-br from-blue-600/18 via-white/[0.045] to-cyan-400/10 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.42)] sm:p-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-cyan-200" />
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Founder analytics</h1>
          </div>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Tracks launch-readiness events: CV uploads, interview starts, voice starts, answers, and results.
          </p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Sessions" value={data.summary.uniqueSessions} icon={<Users className="h-5 w-5" />} />
          <StatCard label="CV uploads" value={data.summary.uploads} icon={<Upload className="h-5 w-5" />} />
          <StatCard label="Interviews" value={data.summary.interviewsStarted} icon={<Activity className="h-5 w-5" />} />
          <StatCard label="Voice starts" value={data.summary.voiceStarts} icon={<Mic className="h-5 w-5" />} />
          <StatCard label="Answers" value={data.summary.answersSubmitted} icon={<Activity className="h-5 w-5" />} />
          <StatCard label="Results" value={data.summary.resultsViewed} icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard label="Answer rate" value={`${data.summary.answerRate}%`} icon={<Activity className="h-5 w-5" />} />
          <StatCard label="Result rate" value={`${data.summary.resultRate}%`} icon={<BarChart3 className="h-5 w-5" />} />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-black">Top roles</h2>
            <div className="mt-4 space-y-2">
              {topRoles.length ? topRoles.map(([role, count]) => (
                <div key={role} className="flex justify-between rounded-2xl bg-white/[0.04] p-3 text-sm">
                  <span>{role}</span>
                  <b>{count}</b>
                </div>
              )) : <p className="text-sm text-slate-500">No role data yet.</p>}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
            <h2 className="text-xl font-black">Recruiter usage</h2>
            <div className="mt-4 space-y-2">
              {topRecruiters.length ? topRecruiters.map(([recruiter, count]) => (
                <div key={recruiter} className="flex justify-between rounded-2xl bg-white/[0.04] p-3 text-sm">
                  <span>{recruiter}</span>
                  <b>{count}</b>
                </div>
              )) : <p className="text-sm text-slate-500">No recruiter data yet.</p>}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-xl font-black">Recent events</h2>
          <div className="mt-4 max-h-[520px] overflow-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="p-3">Event</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Recruiter</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Trust</th>
                  <th className="p-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event, index) => (
                  <tr key={`${event.receivedAt}-${index}`} className="border-t border-white/10">
                    <td className="p-3 font-black">{event.event}</td>
                    <td className="p-3 text-slate-300">{event.role}</td>
                    <td className="p-3 text-slate-300">{event.recruiter}</td>
                    <td className="p-3 text-slate-300">{event.mode}</td>
                    <td className="p-3 text-slate-300">{event.trust ?? ""}</td>
                    <td className="p-3 text-slate-500">{new Date(event.receivedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
