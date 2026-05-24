"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import {
  getCareerMemoryCoachLine,
  readCareerMemory,
  updateCareerMemoryFromAnswer,
  type WorkZoCareerMemory,
} from "@/lib/workzoCareerMemory";
import {
  getRecruiterIntentInsight,
  getRecruiterSpecificFollowUp,
} from "@/lib/workzoRecruiterIntent";
import { analyzeEmotionalSignals } from "@/lib/workzoEmotionalCoach";

type LiveCopilotPanelProps = {
  question?: string;
  latestAnswer?: string;
  recruiterState?: string;
  recruiterTrust?: number;
  targetRole?: string;
  recruiterId?: string;
};

type PriorityMode = "intent" | "rescue" | "emotional" | "memory" | "followup";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function hasMetric(text: string) {
  return /\d|percent|%|reduced|increased|saved|improved|faster|tickets|users|customers|revenue|cost|hours|days|weeks/i.test(
    text,
  );
}

function hasOwnership(text: string) {
  return /\bi\b|\bmy\b|\bpersonally\b|\bled\b|\bowned\b|\bcreated\b|\bimproved\b|\bhandled\b|\bresolved\b|\bimplemented\b/i.test(
    text,
  );
}

function isVague(text: string) {
  return /\bhelped\b|\bworked on\b|\binvolved in\b|\bthings\b|\bstuff\b|\bvarious\b|\ba lot\b|\bgood\b|\bnice\b/i.test(
    text,
  );
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getPriorityMode({
  answer,
  recruiterState,
  recruiterTrust,
  hasMissingMetric,
  hasMissingOwnership,
  vague,
  emotionalCount,
}: {
  answer: string;
  recruiterState: string;
  recruiterTrust: number;
  hasMissingMetric: boolean;
  hasMissingOwnership: boolean;
  vague: boolean;
  emotionalCount: number;
}): PriorityMode {
  if (!answer || wordCount(answer) < 7) return "intent";

  const pressureState = /skeptical|pressuring|losing_confidence|doubt|concern/i.test(
    recruiterState,
  );

  if (recruiterTrust < 52 || pressureState || emotionalCount > 0) {
    return "emotional";
  }

  if (hasMissingMetric || hasMissingOwnership || vague) {
    return "rescue";
  }

  if (recruiterTrust > 72 && answer) return "followup";

  return "intent";
}

function getRescueLine({
  answer,
  targetRole,
  hasOwnershipSignal,
  hasMetricSignal,
  isShort,
  vague,
}: {
  answer: string;
  targetRole: string;
  hasOwnershipSignal: boolean;
  hasMetricSignal: boolean;
  isShort: boolean;
  vague: boolean;
}) {
  if (!answer) return `Start with one specific example related to ${targetRole}.`;
  if (!hasOwnershipSignal) return "Add: “My specific responsibility was…”";
  if (!hasMetricSignal) {
    return "Add measurable impact now: time saved, quality improved, users helped, tickets reduced, or rough scale.";
  }
  if (isShort) return "Expand with Situation → Action → Result.";
  if (vague) return "Replace vague wording with one concrete example.";
  return "Strong enough. Now keep it concise and prepare for a follow-up.";
}

function priorityStyles(mode: PriorityMode) {
  if (mode === "emotional") {
    return {
      border: "border-rose-300/18",
      bg: "bg-rose-400/[0.07]",
      text: "text-rose-200",
      icon: AlertTriangle,
      label: "Live coaching",
    };
  }

  if (mode === "rescue") {
    return {
      border: "border-amber-300/18",
      bg: "bg-amber-400/[0.07]",
      text: "text-amber-200",
      icon: ShieldAlert,
      label: "Rescue hint",
    };
  }

  if (mode === "followup") {
    return {
      border: "border-emerald-300/16",
      bg: "bg-emerald-400/[0.07]",
      text: "text-emerald-200",
      icon: Target,
      label: "Likely follow-up",
    };
  }

  if (mode === "memory") {
    return {
      border: "border-violet-300/16",
      bg: "bg-violet-400/[0.07]",
      text: "text-violet-200",
      icon: Sparkles,
      label: "Career memory",
    };
  }

  return {
    border: "border-cyan-300/16",
    bg: "bg-cyan-400/[0.06]",
    text: "text-cyan-200",
    icon: Lightbulb,
    label: "Recruiter intent",
  };
}

export default function LiveCopilotPanel({
  question = "",
  latestAnswer = "",
  recruiterState = "listening",
  recruiterTrust = 70,
  targetRole = "this role",
  recruiterId = "friendly_hr",
}: LiveCopilotPanelProps) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [careerMemory, setCareerMemory] = useState<WorkZoCareerMemory>(() =>
    readCareerMemory(),
  );

  const answer = latestAnswer.trim();

  const signals = useMemo(() => {
    const count = wordCount(answer);

    return {
      metric: hasMetric(answer),
      ownership: hasOwnership(answer),
      short: count > 0 && count < 35,
      vague: isVague(answer),
      hasAnswer: count > 0,
      wordCount: count,
    };
  }, [answer]);

  useEffect(() => {
    if (!answer || signals.wordCount < 8) return;

    const timer = window.setTimeout(() => {
      setCareerMemory(updateCareerMemoryFromAnswer(answer));
    }, 900);

    return () => window.clearTimeout(timer);
  }, [answer, signals.wordCount]);

  const recruiterIntent = useMemo(
    () =>
      getRecruiterIntentInsight({
        recruiterId,
        recruiterState: recruiterState as any,
        question,
        trust: recruiterTrust,
      }),
    [recruiterId, recruiterState, question, recruiterTrust],
  );

  const personaFollowUp = useMemo(
    () =>
      getRecruiterSpecificFollowUp({
        recruiterId,
        question,
        answer,
      }),
    [recruiterId, question, answer],
  );

  const emotionalInsights = useMemo(
    () =>
      analyzeEmotionalSignals({
        answer,
        recruiterTrust,
        recruiterState,
      }),
    [answer, recruiterTrust, recruiterState],
  );

  const rescueLine = useMemo(
    () =>
      getRescueLine({
        answer,
        targetRole,
        hasOwnershipSignal: signals.ownership,
        hasMetricSignal: signals.metric,
        isShort: signals.short,
        vague: signals.vague,
      }),
    [answer, targetRole, signals.ownership, signals.metric, signals.short, signals.vague],
  );

  const priorityMode = useMemo(
    () =>
      getPriorityMode({
        answer,
        recruiterState,
        recruiterTrust,
        hasMissingMetric: signals.hasAnswer && !signals.metric,
        hasMissingOwnership: signals.hasAnswer && !signals.ownership,
        vague: signals.vague,
        emotionalCount: emotionalInsights.length,
      }),
    [
      answer,
      recruiterState,
      recruiterTrust,
      signals.hasAnswer,
      signals.metric,
      signals.ownership,
      signals.vague,
      emotionalInsights.length,
    ],
  );

  const mainInsight = useMemo(() => {
    if (priorityMode === "emotional") {
      const first = emotionalInsights[0];
      if (first) {
        return {
          title: first.headline,
          body: first.explanation,
          action: first.coaching,
        };
      }

      return {
        title: "Recruiter confidence needs protection.",
        body: "The answer may not be giving enough evidence yet.",
        action: "Add one specific result or clear ownership line now.",
      };
    }

    if (priorityMode === "rescue") {
      return {
        title: "Fix the answer before it weakens.",
        body: rescueLine,
        action: !signals.metric
          ? "Add one measurable result."
          : !signals.ownership
            ? "Clarify what you personally owned."
            : "Make the example more concrete.",
      };
    }

    if (priorityMode === "followup") {
      return {
        title: "Prepare for the next probe.",
        body: `“${personaFollowUp}”`,
        action: "Answer with one decision, one action, and one result.",
      };
    }

    if (priorityMode === "memory") {
      return {
        title: "Pattern across practice.",
        body: getCareerMemoryCoachLine(careerMemory),
        action: "Use this pattern to adjust your next answer.",
      };
    }

    return {
      title: recruiterIntent.headline,
      body: recruiterIntent.hiddenEvaluation,
      action: recruiterIntent.coachingHint,
    };
  }, [
    priorityMode,
    emotionalInsights,
    rescueLine,
    signals.metric,
    signals.ownership,
    personaFollowUp,
    careerMemory,
    recruiterIntent,
  ]);

  const style = priorityStyles(priorityMode);
  const PriorityIcon = style.icon;

  const trustTone =
    recruiterTrust < 50 || /skeptical|pressuring|losing_confidence/i.test(recruiterState)
      ? "Needs proof now"
      : recruiterTrust > 75
        ? "Recruiter engaged"
        : "Listening for evidence";

  return (
    <div className="fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-4 z-[70] w-[min(360px,calc(100vw-32px))] md:bottom-6">
      {open ? (
        <section className="overflow-hidden rounded-[26px] border border-cyan-300/18 bg-[#06111f]/94 shadow-[0_24px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-between border-b border-white/[0.06] px-4 py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/12 text-cyan-200">
                <Brain className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-white">Live Copilot</p>
                <p className="text-xs font-semibold text-cyan-200">{trustTone}</p>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-slate-400" />
          </button>

          <div className="space-y-3 p-4">
            <div className={cn("rounded-2xl border p-3", style.border, style.bg)}>
              <div className={cn("flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em]", style.text)}>
                <PriorityIcon className="h-4 w-4" />
                {style.label}
              </div>
              <p className="mt-2 text-sm font-black text-white">{mainInsight.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{mainInsight.body}</p>
              <p className={cn("mt-2 text-sm font-semibold", style.text)}>{mainInsight.action}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                ["Metrics", signals.metric],
                ["Ownership", signals.ownership],
                ["Specific", !signals.vague],
                ["Enough detail", !signals.short],
              ].map(([label, ok]) => (
                <div
                  key={String(label)}
                  className={cn(
                    "rounded-2xl border px-3 py-2",
                    ok
                      ? "border-emerald-300/15 bg-emerald-400/[0.07] text-emerald-200"
                      : "border-rose-300/15 bg-rose-400/[0.07] text-rose-200",
                  )}
                >
                  {ok ? "✓" : "!"} {label}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.035] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300 transition hover:bg-white/[0.06]"
            >
              {showDetails ? "Hide supporting signals" : "Show supporting signals"}
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDetails ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-cyan-300/12 bg-cyan-400/[0.04] p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                    <Lightbulb className="h-4 w-4" />
                    Recruiter psychology
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    <strong className="block text-white">{recruiterIntent.headline}</strong>
                    <span className="mt-1 block">{recruiterIntent.hiddenEvaluation}</span>
                    <span className="mt-2 block text-cyan-200">{recruiterIntent.coachingHint}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-300/12 bg-violet-400/[0.06] p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                    <Sparkles className="h-4 w-4" />
                    Career memory
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {getCareerMemoryCoachLine(careerMemory)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Likely follow-up
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">“{personaFollowUp}”</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-auto flex h-14 items-center gap-3 rounded-full border border-cyan-300/20 bg-[#06111f]/92 px-4 text-sm font-black text-white shadow-[0_18px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition hover:scale-[1.02]"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600">
            <Wand2 className="h-4 w-4" />
          </span>
          Work-O-Bot
          <ChevronUp className="h-4 w-4 text-cyan-200" />
        </button>
      )}
    </div>
  );
}
