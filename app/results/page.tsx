"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Flame,
  Gauge,
  Lightbulb,
  MessageSquareText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";

import BetaPrivacyNotice from "@/components/BetaPrivacyNotice";
import FeedbackCapture from "@/components/FeedbackCapture";
import { trackWorkZoLaunchEvent } from "@/lib/workzoLaunchAnalytics";

import {
  buildEmotionalResult,
  compareAnswers,
  type TranscriptItem,
} from "@/lib/launchIntelligenceEngine";

type ResultPayload = {
  transcript?: TranscriptItem[];
  recruiterTrust?: number;
  overallScore?: number;
  pressure?: number;
  scores?: Record<string, number>;
  setup?: {
    targetRole?: string;
    targetMarket?: string;
    recruiterPersonality?: string;
    companyStyle?: string;
  };
};

type TimelineEvent = {
  label: string;
  type: "increase" | "drop" | "neutral" | "recovery";
  reason: string;
  scoreImpact: number;
};

type SaaSTimelineEvent = TimelineEvent & {
  mood: string;
  shortLabel: string;
};

const recruiterNames: Record<string, string> = {
  friendly_hr: "Sarah",
  analytical_hiring_manager: "Daniel",
  startup_recruiter: "Priya",
  german_corporate: "Markus",
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

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function eventIcon(type: string) {
  if (type === "increase") return TrendingUp;
  if (type === "drop") return TrendingDown;
  if (type === "recovery") return CheckCircle2;
  return Sparkles;
}

function eventTone(type: string) {
  if (type === "drop") {
    return {
      border: "border-red-300/14",
      bg: "bg-red-500/[0.055]",
      text: "text-red-200",
      dot: "bg-red-300",
    };
  }

  if (type === "increase" || type === "recovery") {
    return {
      border: "border-emerald-300/14",
      bg: "bg-emerald-400/[0.055]",
      text: "text-emerald-200",
      dot: "bg-emerald-300",
    };
  }

  return {
    border: "border-white/10",
    bg: "bg-white/[0.035]",
    text: "text-slate-300",
    dot: "bg-cyan-300",
  };
}

function hiringSignal(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 72) return "Promising";
  if (score >= 58) return "Needs Proof";
  return "Weak";
}

function hiringSignalCopy(score: number) {
  if (score >= 85) {
    return "The recruiter saw a strong hiring signal. Keep the same clarity and add one more quantified result.";
  }

  if (score >= 72) {
    return "The recruiter saw potential, but still needs stronger measurable proof and sharper ownership.";
  }

  if (score >= 58) {
    return "The recruiter did not receive enough proof yet. Add numbers, ownership, and one concrete example.";
  }

  return "The recruiter lost confidence because the answers were too vague, unmeasured, or not clearly tied to the role.";
}

function normalizeTimeline(events: TimelineEvent[], trust: number): SaaSTimelineEvent[] {
  const fallback: TimelineEvent[] = [
    {
      label: "Interview opened",
      type: "neutral",
      reason: "Recruiter started from a neutral trust baseline and listened for role relevance.",
      scoreImpact: 0,
    },
    {
      label: trust >= 70 ? "Relevant signal found" : "Proof gap appeared",
      type: trust >= 70 ? "increase" : "drop",
      reason:
        trust >= 70
          ? "Candidate showed some role-relevant background."
          : "Answer did not provide enough evidence for impact or ownership.",
      scoreImpact: trust >= 70 ? 8 : -8,
    },
    {
      label: "Recruiter follow-up expected",
      type: "neutral",
      reason: "A recruiter would likely ask for measurable outcomes and a specific example.",
      scoreImpact: 0,
    },
  ];

  const source = events.length ? events : fallback;

  const labelCycle = {
    drop: ["Trust dropped", "Recruiter became skeptical", "Proof gap detected", "Confidence weakened"],
    increase: ["Trust increased", "Recruiter engaged", "Strong signal found", "Credibility improved"],
    recovery: ["Trust recovered", "Answer improved", "Recovery moment", "Signal restored"],
    neutral: ["Recruiter evaluated", "Follow-up risk", "Evidence check", "Question pressure"],
  };

  const moodCycle = {
    drop: ["Skeptical", "Concerned", "Pressuring"],
    increase: ["Engaged", "Interested", "Confident"],
    recovery: ["Recovering", "Re-engaged", "Stabilized"],
    neutral: ["Neutral", "Evaluating", "Watching"],
  };

  return source.slice(0, 6).map((event, index) => {
    const type = event.type || "neutral";
    const labels = labelCycle[type];
    const moods = moodCycle[type];

    return {
      ...event,
      shortLabel: labels[index % labels.length],
      mood: moods[index % moods.length],
    };
  });
}

function buildTrustPoints(events: SaaSTimelineEvent[], startingTrust: number) {
  let score = clamp(Math.max(44, startingTrust - 18));
  const points = [{ label: "Start", score }];

  events.forEach((event, index) => {
    score = clamp(score + event.scoreImpact);
    points.push({
      label: `Q${index + 1}`,
      score,
    });
  });

  points.push({
    label: "Final",
    score: startingTrust,
  });

  return points;
}

function buildMemoryItems(emotional: ReturnType<typeof buildEmotionalResult>) {
  const weaknessReason = emotional.weakestAnswer.reason || emotional.weakestMoment || "missing measurable impact";

  return [
    {
      label: "Strongest signal",
      value: emotional.strongestMoment || "No strong recovery moment captured yet.",
      icon: TrendingUp,
      tone: "text-emerald-200",
    },
    {
      label: "Main doubt",
      value: weaknessReason,
      icon: ShieldAlert,
      tone: "text-red-200",
    },
    {
      label: "Recruiter memory",
      value: "The next round should test ownership, metrics, and role-specific clarity.",
      icon: Brain,
      tone: "text-cyan-200",
    },
  ];
}

function buildImprovementItems(emotional: ReturnType<typeof buildEmotionalResult>) {
  const base = emotional.nextPracticePlan?.length
    ? emotional.nextPracticePlan
    : [
        "Add one measurable result.",
        "Use STAR structure.",
        "Make ownership clearer.",
        "Connect the answer to the target role.",
      ];

  return base.slice(0, 4);
}

function buildAtmosphere(score: number, pressure?: number) {
  const strictness = score >= 75 ? "Balanced" : "High";
  const followUp = score >= 78 ? "Medium" : "High";
  const recovery = score >= 72 ? "Recoverable" : "Needs practice";

  return [
    { label: "Pressure", value: `${clamp(pressure ?? 42)}/100` },
    { label: "Strictness", value: strictness },
    { label: "Follow-ups", value: followUp },
    { label: "Recovery", value: recovery },
  ];
}

function getRecruiterName(value?: string) {
  if (!value) return "Recruiter";
  return recruiterNames[value] || "Recruiter";
}

function MiniTrustGraph({ points }: { points: { label: string; score: number }[] }) {
  const width = 520;
  const height = 170;
  const padding = 22;
  const max = 100;
  const min = 0;

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : padding + (index / (points.length - 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((point.score - min) / (max - min)) * (height - padding * 2);

    return { ...point, x, y };
  });

  const path = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const fillPath = `${path} L ${coords[coords.length - 1]?.x || width - padding} ${
    height - padding
  } L ${coords[0]?.x || padding} ${height - padding} Z`;

  return (
    <div className="rounded-[26px] border border-white/10 bg-slate-950/42 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
            Recruiter trust over interview
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Emotional movement from first answer to final hiring signal.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-black">
          {points[points.length - 1]?.score ?? 0}/100
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl border border-white/10 bg-black/18">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[190px] w-full">
          {[25, 50, 75].map((line) => {
            const y = height - padding - (line / 100) * (height - padding * 2);
            return (
              <line
                key={line}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
            );
          })}

          <path d={fillPath} fill="url(#trustFill)" opacity="0.7" />
          <path
            d={path}
            fill="none"
            stroke="url(#trustLine)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coords.map((point) => (
            <g key={`${point.label}-${point.x}`}>
              <circle cx={point.x} cy={point.y} r="6" fill="#7dd3fc" />
              <circle cx={point.x} cy={point.y} r="11" fill="rgba(125,211,252,0.13)" />
            </g>
          ))}

          <defs>
            <linearGradient id="trustLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="55%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="trustFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,130,246,0.45)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {points.map((point) => (
          <div key={point.label} className="rounded-2xl bg-white/[0.035] px-3 py-2">
            <p className="text-[11px] text-slate-500">{point.label}</p>
            <p className="text-sm font-black">{point.score}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const result = useMemo(() => readResults(), []);
  const transcript = result.transcript || [];
  const emotional = useMemo(() => buildEmotionalResult(transcript), [transcript]);
  const [retryAnswer, setRetryAnswer] = useState("");

  const trust = clamp(result.recruiterTrust ?? result.overallScore ?? 0);
  const signal = hiringSignal(trust);
  const timeline = useMemo(
    () => normalizeTimeline(emotional.trustTimeline || [], trust),
    [emotional.trustTimeline, trust],
  );
  const graphPoints = useMemo(() => buildTrustPoints(timeline, trust), [timeline, trust]);
  const comparison = retryAnswer.trim()
    ? compareAnswers(emotional.weakestAnswer.answer, retryAnswer)
    : null;

  const targetRole = result.setup?.targetRole || "Target role";
  const targetMarket = result.setup?.targetMarket || "Global";
  const recruiterName = getRecruiterName(result.setup?.recruiterPersonality);
  const memoryItems = buildMemoryItems(emotional);
  const improvementItems = buildImprovementItems(emotional);
  const atmosphere = buildAtmosphere(trust, result.pressure);

  useEffect(() => {
    trackWorkZoLaunchEvent({
      event: "results_viewed",
      role: result.setup?.targetRole,
      market: result.setup?.targetMarket,
    });
  }, [result.setup?.targetMarket, result.setup?.targetRole]);

  useEffect(() => {
    if (!comparison) return;

    trackWorkZoLaunchEvent({
      event: "weak_answer_retried",
      role: result.setup?.targetRole,
      market: result.setup?.targetMarket,
      metadata: {
        oldScore: comparison.oldScore,
        newScore: comparison.newScore,
        trustDelta: comparison.trustDelta,
      },
    });
  }, [comparison, result.setup?.targetMarket, result.setup?.targetRole]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_30%),linear-gradient(180deg,#06111f_0%,#050816_100%)] p-4 text-white">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex min-h-[76px] items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.045] px-5 shadow-[0_20px_80px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 text-sm font-black text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            Dashboard
          </Link>

          <div className="hidden text-center md:block">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Post-interview intelligence
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {targetRole} · {targetMarket} · {recruiterName}
            </p>
          </div>

          <Link
            href="/interview"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 text-sm font-black text-white shadow-[0_16px_48px_rgba(59,130,246,0.28)]"
          >
            Practice again
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="space-y-4">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                    <Flame className="h-4 w-4" />
                    Recruiter breakdown
                  </div>

                  <h1 className="mt-5 text-[clamp(34px,4vw,56px)] font-black leading-[0.95] tracking-[-0.06em]">
                    Hiring signal: {signal}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                    {hiringSignalCopy(trust)}
                  </p>
                </div>

                <div className="relative flex h-[150px] w-[150px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-950/50 shadow-[0_0_70px_rgba(59,130,246,0.20)]">
                  <div
                    className="absolute inset-3 rounded-full"
                    style={{
                      background: `conic-gradient(#38bdf8 ${trust * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                    }}
                  />
                  <div className="relative flex h-[112px] w-[112px] flex-col items-center justify-center rounded-full bg-[#07101f]">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                      Trust
                    </p>
                    <p className="text-3xl font-black">{trust}</p>
                    <p className="text-xs text-slate-500">/100</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Target role" value={targetRole} icon={Target} />
                <MetricCard label="Recruiter" value={recruiterName} icon={UserRound} />
                <MetricCard label="Market" value={targetMarket} icon={Gauge} />
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-cyan-200" />
                <h2 className="text-2xl font-black">What the recruiter remembers</h2>
              </div>

              <div className="mt-4 grid gap-3">
                {memoryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-3xl border border-white/10 bg-slate-950/42 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06]">
                          <Icon className={`h-5 w-5 ${item.tone}`} />
                        </div>
                        <div>
                          <p className="font-black">{item.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[30px] border border-red-300/18 bg-red-500/[0.055] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-red-200" />
                <h2 className="text-2xl font-black">Weakest answer detected</h2>
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-black/18 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Question
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {emotional.weakestAnswer.question || "No weak question captured."}
                </p>
              </div>

              <div className="mt-3 rounded-3xl border border-white/10 bg-black/18 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Old answer
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {emotional.weakestAnswer.answer || "No candidate answer captured yet."}
                </p>
              </div>

              <p className="mt-3 text-sm leading-6 text-red-100/90">
                Why confidence dropped: {emotional.weakestAnswer.reason || emotional.weakestMoment}
              </p>
            </div>

            <BetaPrivacyNotice className="hidden lg:block" />
          </section>

          <section className="space-y-4">
            <MiniTrustGraph points={graphPoints} />

            <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">Recruiter trust timeline</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Not just scores — this shows where the recruiter changed their mind.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-black text-slate-300">
                  {timeline.length} moments
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {timeline.map((event, index) => {
                  const Icon = eventIcon(event.type);
                  const tone = eventTone(event.type);

                  return (
                    <div
                      key={`${event.label}-${index}`}
                      className={`rounded-3xl border ${tone.border} ${tone.bg} p-4 transition hover:bg-white/[0.06]`}
                    >
                      <div className="flex gap-4">
                        <div className="relative">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06]">
                            <Icon className={`h-5 w-5 ${tone.text}`} />
                          </div>
                          <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ${tone.dot}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black">{event.shortLabel}</p>
                            <span className={`rounded-full border ${tone.border} px-2 py-0.5 text-[11px] font-black ${tone.text}`}>
                              {event.mood}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-slate-300">{event.reason}</p>
                          <p className="mt-1 text-xs font-black text-slate-500">
                            Trust impact: {event.scoreImpact > 0 ? "+" : ""}
                            {event.scoreImpact}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[30px] border border-emerald-300/20 bg-emerald-400/[0.07] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-emerald-200" />
                  <h2 className="text-xl font-black">What would make you hirable</h2>
                </div>

                <div className="mt-4 space-y-3">
                  {improvementItems.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-black/18 p-3 text-sm leading-6 text-slate-300"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/12 text-xs font-black text-emerald-200">
                        {index + 1}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-200" />
                  <h2 className="text-xl font-black">Interview atmosphere</h2>
                </div>

                <div className="mt-4 grid gap-3">
                  {atmosphere.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/18 p-3"
                    >
                      <p className="text-sm text-slate-400">{item.label}</p>
                      <p className="text-sm font-black">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section className="rounded-[30px] border border-cyan-300/20 bg-cyan-400/[0.07] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCcw className="h-5 w-5 text-cyan-200" />
                  <div>
                    <h2 className="text-2xl font-black">Retry weakest answer</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Rewrite once. See whether recruiter trust improves.
                    </p>
                  </div>
                </div>

                {comparison && (
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200">
                    {comparison.trustDelta > 0 ? "+" : ""}
                    {comparison.trustDelta} trust
                  </div>
                )}
              </div>

              <textarea
                value={retryAnswer}
                onChange={(event) => setRetryAnswer(event.target.value)}
                placeholder="Rewrite your answer here using STAR, metrics, and ownership..."
                className="mt-4 h-36 w-full resize-none rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />

              {comparison && (
                <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-3xl border border-white/10 bg-black/18 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Score movement
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <ScoreBox label="Old" value={comparison.oldScore} />
                      <ScoreBox label="New" value={comparison.newScore} />
                      <ScoreBox
                        label="Delta"
                        value={`${comparison.trustDelta > 0 ? "+" : ""}${comparison.trustDelta}`}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/18 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                      Recruiter reaction
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {comparison.message}
                    </p>
                  </div>
                </div>
              )}
            </section>
          </section>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
          <FeedbackCapture source="results" />
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <MessageSquareText className="h-5 w-5 text-violet-200" />
              <h2 className="text-xl font-black">Product Hunt demo moment</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your best demo flow: weak answer → trust drops → retry answer → trust recovery.
              This page now makes that story visible.
            </p>
            <Link
              href="/copilot"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-black text-white hover:bg-white/10"
            >
              Open Work-O-Bot
              <Zap className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Target;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <Icon className="h-5 w-5 text-blue-200" />
      <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 line-clamp-2 text-sm font-black leading-6">{value}</p>
    </div>
  );
}

function ScoreBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/[0.045] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
