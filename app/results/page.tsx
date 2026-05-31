"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, RefreshCcw, ShieldAlert, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TranscriptItem = { role?: string; text?: string; time?: string };
type ResultPayload = {
  transcript?: TranscriptItem[];
  recruiterTrust?: number;
  overallScore?: number;
  setup?: {
    targetRole?: string;
    targetMarket?: string;
    recruiterPersonality?: string;
  };
};

type LightweightInsight = {
  trustDrops: string[];
  trustRecoveries: string[];
  repeatedPatterns: string[];
  topFixes: string[];
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function readResults(): ResultPayload {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("workzo-last-results");
    return raw ? (JSON.parse(raw) as ResultPayload) : {};
  } catch {
    return {};
  }
}

function analyzeTranscript(transcript: TranscriptItem[]): LightweightInsight {
  const joined = transcript.map((item) => item.text || "").join(" ").toLowerCase();
  const hasUnsupported = /not.*cv|resume.*doesn|unsupported|unlisted|clarify|lied|made that up|not true/.test(joined);
  const hasMissingMetrics = /metric|measurable|number|impact|what changed|outcome/.test(joined);
  const hasOwnership = /personally|your responsibility|what did you do|individual/.test(joined);
  const hasVague = /vague|concrete|specific situation|more context/.test(joined);

  const trustDrops = [
    hasUnsupported ? "Unsupported or unclear claim needed clarification." : "Recruiter needed stronger evidence before moving on.",
    hasMissingMetrics ? "Measurable impact was not clear enough in one or more answers." : "Some outcomes needed clearer business impact.",
    hasOwnership ? "Recruiter pushed for clearer individual ownership." : "Ownership could be stated more directly.",
  ];

  const trustRecoveries = [
    "Trust improves when you give a specific situation, personal action, and outcome.",
    "Clarifying mistakes honestly helps reset the conversation, but verified CV experience must lead the answer.",
  ];

  const repeatedPatterns = [
    hasVague ? "Answers were sometimes too broad before becoming specific." : "Keep answers structured from the first sentence.",
    hasMissingMetrics ? "Impact often needed numbers, scale, or a before/after result." : "Add at least one result or measurable signal.",
  ];

  const topFixes = [
    "Start with the verified role/experience from your CV.",
    "Use STAR: situation, task, action, result.",
    "Add one metric, scale, customer impact, or qualitative outcome.",
  ];

  return { trustDrops, trustRecoveries, repeatedPatterns, topFixes };
}

function signalLabel(score: number) {
  if (score >= 82) return "Strong hiring signal";
  if (score >= 70) return "Promising, needs proof";
  if (score >= 55) return "Mixed signal";
  return "Needs stronger interview evidence";
}

export default function ResultsPage() {
  const [result, setResult] = useState<ResultPayload>({});
  const [detailsReady, setDetailsReady] = useState(false);

  useEffect(() => {
    setResult(readResults());
    const timer = window.setTimeout(() => setDetailsReady(true), 250);
    return () => window.clearTimeout(timer);
  }, []);

  const transcript = result.transcript || [];
  const trust = clamp(result.recruiterTrust ?? result.overallScore ?? 64);
  const role = result.setup?.targetRole || "Target role";
  const market = result.setup?.targetMarket || "Global";
  const insight = useMemo(() => analyzeTranscript(transcript), [transcript]);

  return (
    <main className="min-h-screen bg-[#020817] px-5 py-5 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/interview" className="rounded-full bg-blue-500 px-4 py-2 text-sm font-black text-white hover:bg-blue-400">
            Practice again
          </Link>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-black uppercase tracking-[.22em] text-blue-200">Interview result</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">{trust}%</h1>
            <p className="mt-2 text-lg font-black text-slate-100">{signalLabel(trust)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{role} · {market}</p>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${trust}%` }} />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              Results page is in lightweight mode. Summary loads first; deeper details render after the page is ready.
            </div>
          </aside>

          <section className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-red-300/15 bg-red-500/[0.055] p-5">
                <div className="flex items-center gap-3 text-red-100">
                  <TrendingDown className="h-5 w-5" />
                  <h2 className="text-lg font-black">Why trust dropped</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-red-50/90">
                  {insight.trustDrops.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>

              <div className="rounded-[1.6rem] border border-emerald-300/15 bg-emerald-500/[0.055] p-5">
                <div className="flex items-center gap-3 text-emerald-100">
                  <TrendingUp className="h-5 w-5" />
                  <h2 className="text-lg font-black">Where trust can recover</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-50/90">
                  {insight.trustRecoveries.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>

            {detailsReady ? (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-center gap-3 text-blue-100">
                    <ShieldAlert className="h-5 w-5" />
                    <h2 className="text-lg font-black">Repeated patterns</h2>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    {insight.repeatedPatterns.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-center gap-3 text-blue-100">
                    <Target className="h-5 w-5" />
                    <h2 className="text-lg font-black">Top fixes before real interview</h2>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    {insight.topFixes.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5 text-sm text-slate-400">
                Loading deeper explanation…
              </div>
            )}

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="text-lg font-black">Next action</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Retry your weakest answer with one verified CV detail, one personal action, and one measurable or observable outcome.
              </p>
              <Link href="/interview" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400">
                <RefreshCcw className="h-4 w-4" /> Retry interview
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
