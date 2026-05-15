"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  buildEmotionalResult,
  compareAnswers,
  type TranscriptItem,
} from "@/lib/launchIntelligenceEngine";

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

function readResults(): ResultPayload {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem("workzo-last-results");
    if (!raw) return {};
    return JSON.parse(raw) as ResultPayload;
  } catch {
    return {};
  }
}

function eventIcon(type: string) {
  if (type === "increase") return TrendingUp;
  if (type === "drop") return TrendingDown;
  if (type === "recovery") return CheckCircle2;
  return Sparkles;
}

export default function ResultsPage() {
  const result = useMemo(() => readResults(), []);
  const transcript = result.transcript || [];
  const emotional = useMemo(() => buildEmotionalResult(transcript), [transcript]);
  const [retryAnswer, setRetryAnswer] = useState("");
  const comparison = retryAnswer.trim()
    ? compareAnswers(emotional.weakestAnswer.answer, retryAnswer)
    : null;

  const trust = result.recruiterTrust ?? result.overallScore ?? 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#06111f_0%,#050816_100%)] p-4 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.045] px-5 py-4 backdrop-blur-2xl">
          <Link href="/dashboard" className="inline-flex items-center gap-3 text-sm font-bold text-slate-300 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
            Dashboard
          </Link>

          <Link
            href="/interview"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-black text-white"
          >
            Practice again
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
              <Flame className="h-4 w-4" />
              Recruiter breakdown
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-tight">
              Hiring signal: {emotional.hiringSignal}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              {emotional.recruiterSummary}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Trust score</p>
                <p className="mt-2 text-4xl font-black">{trust}/100</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Strongest moment</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{emotional.strongestMoment}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Weakest moment</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{emotional.weakestMoment}</p>
              </div>
            </div>

            <section className="mt-6 rounded-[26px] border border-red-300/20 bg-red-500/8 p-5">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-red-200" />
                <h2 className="text-xl font-black">Weakest answer detected</h2>
              </div>

              <p className="mt-4 text-sm font-black text-slate-200">Question</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{emotional.weakestAnswer.question}</p>

              <p className="mt-4 text-sm font-black text-slate-200">Old answer</p>
              <p className="mt-1 rounded-2xl bg-black/24 p-4 text-sm leading-6 text-slate-300">
                {emotional.weakestAnswer.answer}
              </p>

              <p className="mt-3 text-sm text-red-100">
                Trust dropped because: {emotional.weakestAnswer.reason}
              </p>
            </section>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-2xl">
            <h2 className="text-2xl font-black">Recruiter trust timeline</h2>
            <div className="mt-5 space-y-3">
              {emotional.trustTimeline.map((event, index) => {
                const Icon = eventIcon(event.type);
                return (
                  <div
                    key={`${event.label}-${index}`}
                    className="flex gap-4 rounded-3xl border border-white/10 bg-slate-950/42 p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06]">
                      <Icon
                        className={
                          event.type === "drop"
                            ? "h-5 w-5 text-red-200"
                            : event.type === "increase" || event.type === "recovery"
                              ? "h-5 w-5 text-emerald-200"
                              : "h-5 w-5 text-slate-300"
                        }
                      />
                    </div>
                    <div>
                      <p className="font-black">{event.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{event.reason}</p>
                      <p className="mt-1 text-xs font-black text-slate-500">
                        Trust impact: {event.scoreImpact > 0 ? "+" : ""}
                        {event.scoreImpact}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <section className="mt-6 rounded-[26px] border border-emerald-300/20 bg-emerald-400/8 p-5">
              <div className="flex items-center gap-3">
                <RefreshCcw className="h-5 w-5 text-emerald-200" />
                <h2 className="text-xl font-black">Retry weakest answer</h2>
              </div>

              <textarea
                value={retryAnswer}
                onChange={(event) => setRetryAnswer(event.target.value)}
                placeholder="Rewrite your answer here using STAR, metrics, and ownership..."
                className="mt-4 h-40 w-full resize-none rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/40"
              />

              {comparison && (
                <div className="mt-4 rounded-3xl border border-white/10 bg-black/24 p-4">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-200">
                    Trust comparison
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Old</p>
                      <p className="text-2xl font-black">{comparison.oldScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">New</p>
                      <p className="text-2xl font-black">{comparison.newScore}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Delta</p>
                      <p className="text-2xl font-black">
                        {comparison.trustDelta > 0 ? "+" : ""}
                        {comparison.trustDelta}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{comparison.message}</p>
                </div>
              )}
            </section>

            <section className="mt-6 rounded-[26px] border border-white/10 bg-slate-950/42 p-5">
              <h2 className="text-xl font-black">Next practice plan</h2>
              <div className="mt-4 space-y-3">
                {emotional.nextPracticePlan.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/16 text-xs font-black text-blue-200">
                      {index + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
