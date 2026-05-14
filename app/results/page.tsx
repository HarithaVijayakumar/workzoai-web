"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type TranscriptItem = {
  role?: "recruiter" | "candidate" | "system";
  text?: string;
  time?: string;
};

type ScoreSet = {
  confidence?: number;
  clarity?: number;
  relevance?: number;
  evidence?: number;
  structure?: number;
  overall?: number;
};

type MemoryBlock = {
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  risks?: string[];
  contradictions?: string[];
  missingMetrics?: string[];
  vagueAnswers?: string[];
  repeatedPatterns?: string[];
};

type TrustTimelineEvent = {
  direction?: "up" | "down" | "stable";
  value?: number;
  reason?: string;
  phase?: string;
  timestamp?: string;
};

type PsychologyReport = {
  finalDecision?: "continue" | "borderline" | "reject";
  finalPerception?: string;
  strongestSignal?: string;
  weakestPattern?: string;
  nextPracticeAction?: string;
};

type ResultsPayload = {
  setup?: {
    targetRole?: string;
    targetMarket?: string;
    recruiterPersonality?: string;
    jobMemoryProfile?: {
      roleTitle?: string;
    } | null;
  };
  overallScore?: number;
  scores?: ScoreSet;
  memory?: MemoryBlock;
  contradictions?: string[];
  transcript?: TranscriptItem[];
  pressure?: number;
  recruiterTrust?: number;
  feedback?: string;
  trustTimeline?: TrustTimelineEvent[];
  postInterviewPsychologyReport?: PsychologyReport | null;
};

type AnswerAnalysis = {
  score: number;
  confidence: number;
  clarity: number;
  relevance: number;
  evidence: number;
  structure: number;
  issues: string[];
  strengths: string[];
  trustImpact: number;
};

const emptyResults: ResultsPayload = {
  overallScore: 0,
  scores: {},
  memory: {},
  transcript: [],
  pressure: 0,
  recruiterTrust: 0,
  trustTimeline: [],
  postInterviewPsychologyReport: null,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function getOverallScore(results: ResultsPayload) {
  const direct = safeNumber(results.overallScore || results.scores?.overall || 0);
  if (direct > 0) return direct;

  const scores = results.scores || {};
  const values = [
    scores.confidence,
    scores.clarity,
    scores.relevance,
    scores.evidence,
    scores.structure,
  ]
    .map((value) => safeNumber(value))
    .filter((value) => value > 0);

  if (!values.length) return 0;

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function scoreColor(value: number) {
  if (value >= 75) return "text-emerald-200";
  if (value >= 55) return "text-cyan-200";
  if (value >= 40) return "text-amber-200";
  return "text-rose-200";
}

function decisionLabel(results: ResultsPayload) {
  const decision = results.postInterviewPsychologyReport?.finalDecision;
  if (decision === "continue") return "Recruiter would continue";
  if (decision === "borderline") return "Borderline signal";
  if (decision === "reject") return "Recruiter confidence is weak";

  const score = getOverallScore(results);
  if (score >= 75) return "Recruiter would continue";
  if (score >= 55) return "Borderline signal";
  return "Needs stronger proof";
}

function analyzeAnswer(answer: string, roleContext = ""): AnswerAnalysis {
  const text = answer.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const fillerMatches =
    lower.match(/\b(um|uh|like|you know|actually|basically|maybe|probably|i think|kind of|sort of|i guess)\b/g) || [];

  const hasMetric = /\d|%|percent|reduced|increased|improved|saved|users|customers|tickets|revenue|cost|time|days|weeks|months|hours/i.test(text);
  const hasOwnership = /\b(i|my|me|i led|i built|i resolved|i created|i improved|i handled|i automated|i analyzed)\b/i.test(text);
  const hasOutcome = /\b(result|impact|outcome|therefore|so that|which helped|improved|reduced|increased|saved|boosted|cut)\b/i.test(text) || hasMetric;
  const hasExample = /\b(example|for instance|once|when i|during|project|at my previous|in my role|while working)\b/i.test(text);
  const vagueHits =
    lower.match(/\b(things|stuff|many things|various|some|helped|worked on|responsible for|involved in|good|nice)\b/g) || [];

  const relevance = roleContext
    ? Math.min(
        100,
        45 +
          roleContext
            .toLowerCase()
            .split(/[^a-z0-9+#.]+/i)
            .filter((word) => word.length > 4 && lower.includes(word))
            .slice(0, 8).length *
            7
      )
    : 62;

  const evidence = Math.max(15, Math.min(100, 40 + (hasMetric ? 34 : -10) + (hasOutcome ? 18 : 0)));
  const structure = Math.max(
    15,
    Math.min(
      100,
      42 + (hasExample ? 16 : -6) + (hasOutcome ? 16 : -5) + (wordCount >= 45 && wordCount <= 130 ? 12 : 0)
    )
  );
  const clarity = Math.max(
    12,
    Math.min(100, 68 - fillerMatches.length * 7 - vagueHits.length * 5 - (wordCount > 170 ? 16 : 0) - (wordCount < 25 ? 18 : 0))
  );
  const confidence = Math.max(
    12,
    Math.min(100, 70 - fillerMatches.length * 9 + (hasOwnership ? 8 : -8) + (hasMetric ? 8 : 0))
  );

  const score = Math.round(
    relevance * 0.2 + evidence * 0.25 + structure * 0.2 + clarity * 0.18 + confidence * 0.17
  );

  const issues: string[] = [];
  const strengths: string[] = [];

  if (!hasMetric) issues.push("Missing measurable impact");
  if (!hasOwnership) issues.push("Ownership is unclear");
  if (!hasExample) issues.push("No concrete example");
  if (!hasOutcome) issues.push("Outcome is not clear");
  if (wordCount < 25) issues.push("Too brief");
  if (wordCount > 170) issues.push("Too long");
  if (fillerMatches.length >= 3) issues.push("Too many filler/uncertain phrases");
  if (vagueHits.length >= 2) issues.push("Sounds too generic");

  if (hasMetric) strengths.push("Includes measurable proof");
  if (hasOwnership) strengths.push("Shows personal ownership");
  if (hasExample) strengths.push("Uses a concrete example");
  if (hasOutcome) strengths.push("Connects to outcome");

  return {
    score,
    confidence: Math.round(confidence),
    clarity: Math.round(clarity),
    relevance: Math.round(relevance),
    evidence: Math.round(evidence),
    structure: Math.round(structure),
    issues,
    strengths,
    trustImpact: Math.round((score - 55) / 3),
  };
}

function findWeakestAnswer(results: ResultsPayload) {
  const candidates =
    results.transcript?.filter(
      (item) => item.role === "candidate" && item.text && item.text.trim().length > 10
    ) || [];

  const roleContext = [
    results.setup?.targetRole,
    results.setup?.jobMemoryProfile?.roleTitle,
    results.setup?.targetMarket,
  ]
    .filter(Boolean)
    .join(" ");

  if (!candidates.length) {
    return {
      text: "",
      analysis: analyzeAnswer("", roleContext),
      index: -1,
    };
  }

  const scored = candidates.map((item, index) => ({
    text: item.text || "",
    analysis: analyzeAnswer(item.text || "", roleContext),
    index,
  }));

  scored.sort((a, b) => a.analysis.score - b.analysis.score);
  return scored[0];
}

function loadResults(): ResultsPayload {
  if (typeof window === "undefined") return emptyResults;

  try {
    const raw = window.localStorage.getItem("workzo-last-results");
    if (!raw) return emptyResults;
    return { ...emptyResults, ...JSON.parse(raw) };
  } catch {
    return emptyResults;
  }
}

function saveRetryComparison(payload: unknown) {
  try {
    window.localStorage.setItem("workzo-last-retry-comparison", JSON.stringify(payload));
  } catch {
    // Ignore storage errors.
  }
}

function ScoreCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
          {label}
        </p>
        <div className="text-cyan-200">{icon}</div>
      </div>
      <p className={cn("mt-4 text-3xl font-black", scoreColor(value))}>
        {value > 0 ? value : "—"}
        <span className="text-lg text-slate-500">/100</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function BulletPanel({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "neutral" | "good" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-emerald-200"
      : tone === "bad"
        ? "text-rose-200"
        : "text-cyan-200";

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.26)]">
      <h2 className={cn("text-xl font-black", color)}>{title}</h2>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-slate-200"
            >
              {item}
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-500">
            No signal captured yet.
          </p>
        )}
      </div>
    </section>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultsPayload>(emptyResults);
  const [retryAnswer, setRetryAnswer] = useState("");
  const [retryAnalysis, setRetryAnalysis] = useState<AnswerAnalysis | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setResults(loadResults());
    setHasHydrated(true);
  }, []);

  const overallScore = useMemo(() => getOverallScore(results), [results]);
  const weakest = useMemo(() => findWeakestAnswer(results), [results]);
  const originalWeakScore = weakest.analysis.score;
  const roleTitle =
    results.setup?.jobMemoryProfile?.roleTitle ||
    results.setup?.targetRole ||
    "Target role";
  const market = results.setup?.targetMarket || "Global";

  const trustTimeline = results.trustTimeline || [];
  const memory = results.memory || {};
  const report = results.postInterviewPsychologyReport;

  function runRetryAnalysis() {
    const context = `${roleTitle} ${market}`;
    const analysis = analyzeAnswer(retryAnswer, context);
    setRetryAnalysis(analysis);

    saveRetryComparison({
      originalAnswer: weakest.text,
      originalAnalysis: weakest.analysis,
      retryAnswer,
      retryAnalysis: analysis,
      improvedBy: analysis.score - originalWeakScore,
      createdAt: new Date().toISOString(),
    });
  }

  if (!hasHydrated) {
    return (
      <main className="min-h-screen bg-[#020712] p-4 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="h-[86px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.045]" />
          <div className="mt-4 h-[520px] animate-pulse rounded-[32px] border border-white/10 bg-white/[0.045]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020712] px-3 py-3 text-white sm:px-5">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-260px] top-[-220px] h-[520px] w-[520px] rounded-full bg-blue-600/13 blur-[120px]" />
        <div className="absolute right-[-220px] top-[-160px] h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-white/[0.045] px-3 py-3 shadow-[0_18px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <Image
              src="/workzo_icon.png"
              alt="WorkZo AI"
              width={38}
              height={38}
              className="rounded-2xl"
            />
            <div>
              <p className="text-base font-black leading-tight sm:text-lg">WorkZo AI</p>
              <p className="hidden text-xs text-slate-400 sm:block">
                Interview results and retry practice
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-300">
              {roleTitle}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-300">
              {market}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/interview"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-black text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Practice again
            </Link>
          </div>
        </header>

        <section className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(135deg,rgba(15,23,42,.92),rgba(2,6,23,.92))] p-5 shadow-[0_34px_120px_rgba(0,0,0,0.38)] sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                <Sparkles className="h-4 w-4" />
                Recruiter decision
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {decisionLabel(results)}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                {report?.finalPerception ||
                  "WorkZo has captured your interview signals. Review where trust changed, then retry the weakest answer to improve recruiter confidence."}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Overall
                  </p>
                  <p className={cn("mt-2 text-4xl font-black", scoreColor(overallScore))}>
                    {overallScore > 0 ? overallScore : "—"}
                    <span className="text-lg text-slate-500">/100</span>
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Trust
                  </p>
                  <p className={cn("mt-2 text-4xl font-black", scoreColor(safeNumber(results.recruiterTrust)))}>
                    {results.recruiterTrust ? safeNumber(results.recruiterTrust) : "—"}
                    <span className="text-lg text-slate-500">/100</span>
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Pressure
                  </p>
                  <p className={cn("mt-2 text-4xl font-black", scoreColor(safeNumber(results.pressure)))}>
                    {results.pressure ? safeNumber(results.pressure) : "—"}
                    <span className="text-lg text-slate-500">/100</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-slate-950/55 p-5">
              <h2 className="text-xl font-black text-white">Next best action</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {report?.nextPracticeAction ||
                  "Retry the weakest answer with one specific example, one measurable result, and your exact ownership."}
              </p>
              <a
                href="#retry"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-black text-white"
              >
                Retry weakest answer
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <ScoreCard label="Clarity" value={safeNumber(results.scores?.clarity)} icon={<Brain className="h-5 w-5" />} />
          <ScoreCard label="Relevance" value={safeNumber(results.scores?.relevance)} icon={<Target className="h-5 w-5" />} />
          <ScoreCard label="Confidence" value={safeNumber(results.scores?.confidence)} icon={<Sparkles className="h-5 w-5" />} />
          <ScoreCard label="Evidence" value={safeNumber(results.scores?.evidence)} icon={<ShieldAlert className="h-5 w-5" />} />
          <ScoreCard label="Structure" value={safeNumber(results.scores?.structure)} icon={<CheckCircle2 className="h-5 w-5" />} />
        </section>

        <section id="retry" className="mt-4 rounded-[34px] border border-cyan-300/15 bg-white/[0.045] p-5 shadow-[0_28px_110px_rgba(0,0,0,0.34)] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-rose-100">
                <TrendingDown className="h-4 w-4" />
                Weakest answer
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight">
                Retry the answer that hurt recruiter trust.
              </h2>

              <div className="mt-4 rounded-3xl border border-white/10 bg-black/24 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Original answer
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {weakest.text || "No candidate answer was captured yet. Run an interview and submit or speak at least one answer."}
                </p>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Original score
                  </p>
                  <p className={cn("mt-2 text-3xl font-black", scoreColor(originalWeakScore))}>
                    {weakest.text ? originalWeakScore : "—"}
                    <span className="text-lg text-slate-500">/100</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Main issue
                  </p>
                  <p className="mt-2 text-sm font-bold text-rose-100">
                    {weakest.analysis.issues[0] || "No clear issue detected yet."}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-rose-300/20 bg-rose-500/10 p-4">
                <p className="text-sm font-black text-rose-100">Why the recruiter disliked it</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(weakest.analysis.issues.length ? weakest.analysis.issues : ["Needs more proof"]).map((issue) => (
                    <span
                      key={issue}
                      className="rounded-full bg-black/24 px-3 py-1 text-xs font-black text-rose-100"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-100">
                <TrendingUp className="h-4 w-4" />
                Recovery attempt
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight">
                Rewrite it with proof.
              </h2>

              <textarea
                value={retryAnswer}
                onChange={(event) => setRetryAnswer(event.target.value)}
                placeholder="Rewrite your answer here. Include: situation, what YOU did, measurable result, and why it matters for the job."
                className="mt-4 min-h-[220px] w-full resize-none rounded-3xl border border-white/10 bg-[#050b16] p-4 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
              />

              <button
                type="button"
                onClick={runRetryAnalysis}
                disabled={!retryAnswer.trim()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RefreshCcw className="h-4 w-4" />
                Compare old vs new answer
              </button>

              {retryAnalysis && (
                <div className="mt-4 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/70">
                        New answer score
                      </p>
                      <p className={cn("mt-1 text-4xl font-black", scoreColor(retryAnalysis.score))}>
                        {retryAnalysis.score}
                        <span className="text-lg text-slate-500">/100</span>
                      </p>
                    </div>

                    <div className="rounded-2xl bg-black/24 px-4 py-3 text-right">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Change
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-2xl font-black",
                          retryAnalysis.score - originalWeakScore >= 0 ? "text-emerald-200" : "text-rose-200"
                        )}
                      >
                        {retryAnalysis.score - originalWeakScore >= 0 ? "+" : ""}
                        {retryAnalysis.score - originalWeakScore}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-black/24 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Improved signals
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-emerald-100">
                        {(retryAnalysis.strengths.length ? retryAnalysis.strengths : ["No strong new signal yet"]).map((item) => (
                          <p key={item}>• {item}</p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-black/24 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Still weak
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-rose-100">
                        {(retryAnalysis.issues.length ? retryAnalysis.issues : ["No major issue detected"]).map((item) => (
                          <p key={item}>• {item}</p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-slate-200">
                    Recruiter trust impact:{" "}
                    <span className={retryAnalysis.trustImpact >= 0 ? "font-black text-emerald-200" : "font-black text-rose-200"}>
                      {retryAnalysis.trustImpact >= 0 ? "+" : ""}
                      {retryAnalysis.trustImpact}
                    </span>
                    .{" "}
                    {retryAnalysis.score > originalWeakScore
                      ? "This version is more likely to recover recruiter confidence."
                      : "This still needs stronger proof, ownership, or measurable outcome."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <BulletPanel
            title="What looked strong"
            tone="good"
            items={[
              ...(memory.strengths || []),
              ...(report?.strongestSignal ? [report.strongestSignal] : []),
            ].filter(Boolean)}
          />

          <BulletPanel
            title="Weak patterns"
            tone="bad"
            items={[
              ...(memory.weaknesses || []),
              ...(memory.repeatedPatterns || []),
              ...(report?.weakestPattern ? [report.weakestPattern] : []),
            ].filter(Boolean)}
          />

          <BulletPanel
            title="Improve next"
            items={[
              ...(memory.improvements || []),
              ...(report?.nextPracticeAction ? [report.nextPracticeAction] : []),
            ].filter(Boolean)}
          />
        </section>

        <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.26)]">
          <h2 className="text-xl font-black">Trust timeline</h2>
          <div className="mt-4 grid gap-3">
            {trustTimeline.length ? (
              trustTimeline.slice(-8).map((item, index) => (
                <div
                  key={`${item.timestamp || index}-${item.reason || index}`}
                  className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-[110px_1fr]"
                >
                  <div>
                    <p
                      className={cn(
                        "text-sm font-black",
                        item.direction === "up"
                          ? "text-emerald-200"
                          : item.direction === "down"
                            ? "text-rose-200"
                            : "text-slate-300"
                      )}
                    >
                      {item.direction === "up"
                        ? "Trust up"
                        : item.direction === "down"
                          ? "Trust down"
                          : "Stable"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {typeof item.value === "number" ? `${item.value}/100` : ""}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {item.reason || "Trust changed based on recruiter perception."}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
                Trust timeline will appear after the interview captures answer-level signals.
              </p>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_90px_rgba(0,0,0,0.26)]">
          <h2 className="text-xl font-black">Transcript</h2>
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
            {results.transcript?.length ? (
              results.transcript.map((item, index) => (
                <div
                  key={`${item.time || index}-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {item.role || "message"} {item.time ? `· ${item.time}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{item.text}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-500">
                No transcript captured yet.
              </p>
            )}
          </div>
        </section>

        <div className="h-6" />
      </div>
    </main>
  );
}
