"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  RotateCcw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SaveInterviewSessionCard from "./SaveInterviewSessionCard";

type TranscriptItem = {
  id?: string;
  time?: string;
  role: "recruiter" | "candidate" | "system";
  speaker?: string;
  text: string;
};

type RecruiterSignalState = {
  overall: number;
  confidence: number;
  clarity: number;
  relevance: number;
  communication: number;
  trust: number;
  interest: number;
  mood: string;
  concern: string;
};

type TrustPoint = { time: string; trust: number; interest: number; note: string };
type AnswerQuality = "weak" | "average" | "strong" | "excellent";

type InterviewResult = {
  id: string;
  savedAt: string;
  candidateName: string;
  targetRole: string;
  targetCompany?: string;
  recruiterName: string;
  recruiterTitle: string;
  companyStyle?: string;
  durationSeconds: number;
  score: RecruiterSignalState | null;
  transcript: TranscriptItem[];
  trustTimeline?: TrustPoint[];
  weakestMoment?: { answer: string; problem: string; advice: string };
  verdict?: { decision: string; reason: string };
  memory?: {
    vagueAnswers: number;
    missingMetrics: number;
    missingOwnership: number;
    unsupportedClaims: number;
    strongAnswers: number;
    liveNote: string;
    patterns: string[];
  };
  summary?: {
    mood?: string;
    trust?: number | null;
    interest?: number | null;
    concern?: string;
    liveNote?: string;
    patterns?: string[];
    verdict?: string;
    answerQualitySummary?: Record<AnswerQuality, number>;
  };
  answerQuality?: {
    records?: Array<{
      id?: string;
      quality: AnswerQuality;
      wordCount?: number;
      hasMetric?: boolean;
      hasOwnership?: boolean;
      hasOutcome?: boolean;
      unsupported?: boolean;
      concern?: string;
      answer?: string;
    }>;
    summary?: Record<AnswerQuality, number>;
  };
};

type CandidatePattern = {
  id?: string;
  pattern?: string;
  label?: string;
  count?: number;
  targetRole?: string;
  recruiterName?: string;
  lastSeenAt?: string;
  severity?: "low" | "medium" | "high";
};

function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m ${secs}s`;
}

function loadLatestResult(): InterviewResult | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("workzo_latest_interview_result");
    if (!raw) return null;
    return JSON.parse(raw) as InterviewResult;
  } catch {
    return null;
  }
}

function loadCandidatePatterns(): CandidatePattern[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem("workzo_candidate_patterns");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function getWorkZoAnalyticsSessionId() {
  if (typeof window === "undefined") return "server-session";

  try {
    const existing = window.localStorage.getItem("workzo_analytics_session_id");
    if (existing) return existing;

    const next = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem("workzo_analytics_session_id", next);
    return next;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function trackWorkZoAnalyticsEvent(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getWorkZoAnalyticsSessionId(),
      event,
      path: window.location.pathname,
      origin: window.location.origin,
      host: window.location.hostname,
      isLocal: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
      environment: process.env.NODE_ENV,
      ...payload,
    }),
  }).catch(() => {});
}

function scoreTone(score?: number | null) {
  if (!score) return "text-slate-300";
  if (score >= 78) return "text-emerald-300";
  if (score >= 65) return "text-blue-300";
  if (score >= 50) return "text-amber-300";
  return "text-red-300";
}

function cleanAnswerText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function hasMetricSignal(answer: string) {
  return /\d|percent|%|customers?|users?|tickets?|hours?|days?|weeks?|months?|saved|reduced|increased|improved|revenue|cost|time|quality|sla|csat|nps|conversion|retention/i.test(answer);
}

function hasOwnershipSignal(answer: string) {
  return /\b(i|my|me|personally|owned|built|handled|created|led|resolved|analyzed|improved|reduced|increased|designed|implemented|managed|supported|debugged|troubleshot)\b/i.test(answer);
}

function hasOutcomeSignal(answer: string) {
  return /\b(result|impact|outcome|after|therefore|which led|improved|reduced|increased|saved|resolved|delivered|achieved)\b/i.test(answer);
}

function hasUnsupportedSignal(answer: string) {
  return /\b(i lied|i made that up|not true|wasn't true|false|fake|exaggerated|tesla|google|microsoft|amazon|meta|apple)\b/i.test(answer);
}

function classifyAnswerQuality(answer: string): AnswerQuality {
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const metric = hasMetricSignal(answer);
  const ownership = hasOwnershipSignal(answer);
  const outcome = hasOutcomeSignal(answer);
  const vague = /\b(stuff|things|many things|good|nice|various|some|helped|worked on|responsible for|involved in|team player|hardworking)\b/i.test(answer) && !metric;

  if (wordCount < 14 || vague || hasUnsupportedSignal(answer)) return "weak";
  if (metric && ownership && outcome && wordCount >= 35) return "excellent";
  if ((metric && ownership) || (ownership && outcome)) return "strong";
  return "average";
}

function summarizeAnswerQuality(transcript: TranscriptItem[], result?: InterviewResult | null) {
  const storedSummary = result?.answerQuality?.summary || result?.summary?.answerQualitySummary;
  if (storedSummary) {
    return {
      weak: storedSummary.weak || 0,
      average: storedSummary.average || 0,
      strong: storedSummary.strong || 0,
      excellent: storedSummary.excellent || 0,
    };
  }

  const summary: Record<AnswerQuality, number> = { weak: 0, average: 0, strong: 0, excellent: 0 };

  transcript
    .filter((item) => item.role === "candidate")
    .forEach((item) => {
      summary[classifyAnswerQuality(item.text)] += 1;
    });

  return summary;
}

function getTrustJourney(timeline: TrustPoint[]) {
  if (!timeline.length) return [];

  return timeline.slice(-8).map((point, index, list) => {
    const previous = index > 0 ? list[index - 1] : null;
    const delta = previous ? point.trust - previous.trust : 0;
    const direction = delta > 1 ? "up" : delta < -1 ? "down" : "flat";
    const label = direction === "up" ? "Trust increased" : direction === "down" ? "Trust dropped" : "Trust held steady";

    return {
      ...point,
      delta,
      direction,
      label,
    };
  });
}

function splitPatternType(pattern: string) {
  const lower = pattern.toLowerCase();
  if (lower.includes("strong") || lower.includes("positive") || lower.includes("evidence") || lower.includes("customer")) return "Strong";
  return "Weak";
}

export default function ResultsPage() {
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [candidatePatterns, setCandidatePatterns] = useState<CandidatePattern[]>([]);

  useEffect(() => {
    const latest = loadLatestResult();
    setResult(latest);
    setCandidatePatterns(loadCandidatePatterns());

    trackWorkZoAnalyticsEvent("results_viewed", {
      recruiter: latest?.recruiterName || null,
      role: latest?.targetRole || null,
      metadata: {
        hasResult: Boolean(latest),
        localResultId: latest?.id || null,
        targetCompany: latest?.targetCompany || null,
      },
    });
  }, []);

  const recruiterTurns = useMemo(
    () => result?.transcript?.filter((item) => item.role === "recruiter") || [],
    [result],
  );

  const candidateTurns = useMemo(
    () => result?.transcript?.filter((item) => item.role === "candidate") || [],
    [result],
  );

  const answerQualitySummary = useMemo(
    () => summarizeAnswerQuality(result?.transcript || [], result),
    [result],
  );

  const trustJourney = useMemo(
    () => getTrustJourney(result?.trustTimeline || []),
    [result?.trustTimeline],
  );

  if (!result) {
    return (
      <main className="min-h-screen bg-[#050b14] px-5 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <Link href="/interview" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to interview
          </Link>

          <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <h1 className="text-3xl font-black">No interview result yet</h1>
            <p className="mt-3 text-slate-300">Complete an interview first, then your recruiter verdict, trust timeline, and weakest answer will appear here.</p>
          </section>
        </div>
      </main>
    );
  }

  const score = result.score;
  const verdict = result.verdict || {
    decision: result.summary?.verdict || "Not enough signal",
    reason: result.summary?.concern || "Complete more interview answers to receive a stronger verdict.",
  };

  const repeatedPatterns = result.memory?.patterns || result.summary?.patterns || [];
  const crossSessionPatterns = candidatePatterns
    .map((item) => item.pattern || item.label || "")
    .filter(Boolean)
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/interview" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to interview
          </Link>

          <Link href="/interview" className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-black">
            <RotateCcw className="h-4 w-4" />
            Retry interview
          </Link>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-white/[0.03] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Interview Results</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{result.targetRole}</h1>
              <p className="mt-2 text-slate-300">
                {result.recruiterName} · {result.recruiterTitle}
                {result.targetCompany ? ` · ${result.targetCompany}` : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Overall</p>
                <p className={`mt-1 text-2xl font-black ${scoreTone(score?.overall)}`}>{score?.overall ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Trust</p>
                <p className={`mt-1 text-2xl font-black ${scoreTone(score?.trust)}`}>{score?.trust ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Answers</p>
                <p className="mt-1 text-2xl font-black">{candidateTurns.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Duration</p>
                <p className="mt-1 text-2xl font-black">{formatDuration(result.durationSeconds)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(["weak", "average", "strong", "excellent"] as AnswerQuality[]).map((quality) => (
            <div key={quality} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm capitalize text-slate-400">{quality} answers</p>
              <p className={`mt-2 text-3xl font-black ${quality === "weak" ? "text-red-300" : quality === "average" ? "text-amber-300" : quality === "strong" ? "text-blue-300" : "text-emerald-300"}`}>
                {answerQualitySummary[quality]}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {quality === "weak" ? "Needs evidence or structure" : quality === "average" ? "Acceptable but shallow" : quality === "strong" ? "Good proof signal" : "Clear, measured, owned"}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              {verdict.decision?.toLowerCase().includes("proceed") && !verdict.decision?.toLowerCase().includes("not") ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-300" />
              )}
              <h2 className="text-xl font-black">Recruiter Verdict</h2>
            </div>
            <p className="mt-4 text-2xl font-black">{verdict.decision}</p>
            <p className="mt-2 leading-7 text-slate-300">{verdict.reason}</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-black">Weakest Answer</h3>
              <p className="mt-2 text-sm text-amber-200">{result.weakestMoment?.problem || "No weakest answer detected yet."}</p>
              {result.weakestMoment?.answer ? (
                <blockquote className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
                  “{cleanAnswerText(result.weakestMoment.answer)}”
                </blockquote>
              ) : null}
              <p className="mt-3 text-sm leading-6 text-slate-300">{result.weakestMoment?.advice}</p>
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-300" />
                <h2 className="font-black">Trust Journey</h2>
              </div>

              <div className="mt-4 space-y-3">
                {trustJourney.map((point, index) => {
                  const Icon = point.direction === "down" ? TrendingDown : TrendingUp;
                  return (
                    <div key={`${point.time}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${point.direction === "down" ? "text-red-300" : point.direction === "up" ? "text-emerald-300" : "text-slate-300"}`} />
                          <p className="text-sm font-black">{point.label}</p>
                        </div>
                        <span className="text-xs text-slate-400">{point.time}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Trust {point.trust}/100</span>
                        <span>{point.delta > 0 ? "+" : ""}{point.delta}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.max(4, Math.min(100, point.trust))}%` }} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs text-slate-300">{point.note}</p>
                    </div>
                  );
                })}

                {!trustJourney.length ? (
                  <p className="text-sm text-slate-400">Trust journey will appear after scored answers.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-300" />
                <h2 className="font-black">Patterns This Interview</h2>
              </div>

              <div className="mt-4 space-y-2">
                {repeatedPatterns.map((pattern, index) => (
                  <p key={`${pattern}-${index}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                    {pattern}
                  </p>
                ))}

                {!repeatedPatterns.length ? (
                  <p className="text-sm text-slate-400">No repeated pattern detected yet.</p>
                ) : null}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-emerald-300" />
            <h2 className="font-black">Patterns Across Interviews</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">This uses WorkZo's local cross-session memory to show repeated strengths and weak spots.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {crossSessionPatterns.map((pattern, index) => {
              const type = splitPatternType(pattern);
              return (
                <div key={`${pattern}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className={`text-xs font-black uppercase tracking-[0.16em] ${type === "Strong" ? "text-emerald-300" : "text-amber-300"}`}>{type}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{pattern}</p>
                </div>
              );
            })}

            {!crossSessionPatterns.length ? (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400 md:col-span-2">
                Cross-session memory appears after multiple completed or recovered interviews.
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-cyan-300" />
            <h2 className="font-black">Transcript</h2>
          </div>

          <div className="mt-4 space-y-3">
            {(result.transcript || []).filter((item) => item.role !== "system").map((item, index) => (
              <div key={item.id || index} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span className="font-bold text-slate-300">{item.speaker || (item.role === "candidate" ? "You" : "Recruiter")}</span>
                  <span>{item.time}</span>
                </div>
                <p className="mt-2 leading-7 text-slate-200">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <SaveInterviewSessionCard result={result} />
      </div>
    </main>
  );
}
