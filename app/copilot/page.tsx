"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  FileText,
  Flame,
  Lightbulb,
  MessageSquareText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";

import {
  buildCvIntelligenceSummary,
  compareAnswers,
  detectAnswerSignals,
  getRecruiterProfile,
  runWorkobotAction,
  type WorkobotAction,
} from "@/lib/launchIntelligenceEngine";
import FeedbackCapture from "@/components/FeedbackCapture";
import { trackWorkZoLaunchEvent } from "@/lib/workzoLaunchAnalytics";

type SavedSetup = {
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  targetMarket?: string;
  recruiterPersonality?: string;
};

type SmartAction = {
  id: WorkobotAction | "magic";
  title: string;
  description: string;
  icon: typeof Sparkles;
  priority: "high" | "medium" | "normal";
};

function readSetup(): SavedSetup {
  if (typeof window === "undefined") return {};

  const keys = [
    "workzo-latest-interview-setup",
    "workzo-interview-setup-v4",
    "workzo-interview-setup-latest",
  ];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as SavedSetup;
    } catch {
      // ignore broken localStorage
    }
  }

  return {};
}

function getMood(score: number) {
  if (score >= 82) {
    return {
      label: "Engaged",
      tone: "Recruiter is receiving strong signal.",
      className: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
      icon: TrendingUp,
    };
  }

  if (score >= 65) {
    return {
      label: "Neutral",
      tone: "Recruiter needs more proof before trusting the answer.",
      className: "border-cyan-300/25 bg-cyan-400/10 text-cyan-200",
      icon: Sparkles,
    };
  }

  if (score >= 45) {
    return {
      label: "Skeptical",
      tone: "Recruiter may challenge this answer with follow-ups.",
      className: "border-amber-300/25 bg-amber-400/10 text-amber-200",
      icon: ShieldAlert,
    };
  }

  return {
    label: "Concerned",
    tone: "Recruiter trust is dropping. Recover with proof and ownership.",
    className: "border-red-300/25 bg-red-400/10 text-red-200",
    icon: TrendingDown,
  };
}

function buildWeaknessRadar(answer: string) {
  const signals = detectAnswerSignals(answer);

  return [
    {
      label: "Measurable impact",
      ok: signals.hasMetric,
      advice: signals.hasMetric ? "Metric signal detected." : "Add numbers, scale, time saved, users, tickets, or impact.",
    },
    {
      label: "Ownership",
      ok: signals.hasOwnership,
      advice: signals.hasOwnership ? "Ownership signal detected." : "Say what YOU personally owned, decided, or delivered.",
    },
    {
      label: "STAR structure",
      ok: signals.hasSTAR,
      advice: signals.hasSTAR ? "Structure is visible." : "Add situation, task, action, and result.",
    },
    {
      label: "Concise clarity",
      ok: !signals.rambling && !signals.vague,
      advice: signals.rambling
        ? "Too long. Cut it to 45–75 seconds."
        : signals.vague
          ? "Too vague. Use one concrete example."
          : "Answer length and clarity look usable.",
    },
  ];
}

function buildFollowUps(answer: string, recruiterName: string) {
  const signals = detectAnswerSignals(answer);
  const questions: string[] = [];

  if (!signals.hasMetric) questions.push("What measurable impact did that create?");
  if (!signals.hasOwnership) questions.push("What exactly did you personally own?");
  if (signals.vague) questions.push("Can you give me one specific example?");
  if (signals.rambling) questions.push("Can you summarize that in 60 seconds?");
  if (!signals.hasSTAR) questions.push("What was the situation, action, and result?");

  questions.push(`${recruiterName} may ask: why is this relevant to this role?`);

  return questions.slice(0, 5);
}

function getSmartActions(answer: string): SmartAction[] {
  const signals = detectAnswerSignals(answer);

  const actions: SmartAction[] = [
    {
      id: "magic",
      title: "Save my answer",
      description: "Rewrite with structure, ownership, proof, and recruiter trust.",
      icon: Flame,
      priority: "high",
    },
    {
      id: "expectation",
      title: "Hidden recruiter intent",
      description: "See what the recruiter is actually testing.",
      icon: Target,
      priority: "medium",
    },
  ];

  if (!signals.hasMetric) {
    actions.push({
      id: "metrics",
      title: "Add metrics",
      description: "Find places where numbers would increase trust.",
      icon: BarChart3,
      priority: "high",
    });
  }

  if (!signals.hasOwnership) {
    actions.push({
      id: "ownership",
      title: "Show ownership",
      description: "Make your personal contribution clearer.",
      icon: CheckCircle2,
      priority: "high",
    });
  }

  if (!signals.hasSTAR) {
    actions.push({
      id: "star",
      title: "STAR conversion",
      description: "Turn your answer into a recruiter-ready structure.",
      icon: Brain,
      priority: "medium",
    });
  }

  actions.push(
    {
      id: "rewrite",
      title: "Rewrite stronger",
      description: "Improve clarity, confidence, and role fit.",
      icon: Wand2,
      priority: "normal",
    },
    {
      id: "concise",
      title: "Make concise",
      description: "Shorten without losing impact.",
      icon: MessageSquareText,
      priority: "normal",
    },
  );

  return actions.slice(0, 6);
}

function buildMagicAnswer({
  question,
  answer,
  targetRole,
}: {
  question: string;
  answer: string;
  targetRole: string;
}) {
  const signals = detectAnswerSignals(answer);

  const missing = [
    !signals.hasMetric && "a measurable result",
    !signals.hasOwnership && "clear personal ownership",
    !signals.hasSTAR && "STAR structure",
    signals.vague && "one concrete example",
    signals.rambling && "a shorter version",
  ].filter(Boolean);

  return [
    "Recruiter-ready answer:",
    "",
    `“One relevant example is from a situation where [specific situation related to ${targetRole || "the role"}]. My responsibility was [your exact ownership]. I handled it by [specific action you took], working with [team/customer/stakeholder] to solve [problem]. The result was [measurable impact — tickets reduced, time saved, customers helped, quality improved, or process improved]. This is relevant to ${targetRole || "this role"} because it shows [role-relevant skill].”`,
    "",
    "Why this is stronger:",
    "• It gives one clear example.",
    "• It shows what you personally owned.",
    "• It adds measurable impact.",
    "• It connects your experience to the target role.",
    "",
    missing.length
      ? `Still missing from your original answer: ${missing.join(", ")}.`
      : "Your original answer already has useful signal. This version makes it sharper.",
    "",
    `Question being answered: ${question}`,
  ].join("\n");
}

export default function WorkOBotCopilotPage() {
  const setup = useMemo(() => readSetup(), []);
  const [question, setQuestion] = useState(
    "Tell me about a challenging project you worked on and how you handled it.",
  );
  const [answer, setAnswer] = useState("");
  const [output, setOutput] = useState("");
  const [improvedAnswer, setImprovedAnswer] = useState("");
  const [comparison, setComparison] = useState<ReturnType<typeof compareAnswers> | null>(null);
  const [loading, setLoading] = useState(false);

  const targetRole = setup.targetRole || "your target role";
  const cvText = setup.cvText || "";
  const recruiter = getRecruiterProfile(setup.recruiterPersonality);
  const cvSummary = useMemo(
    () => buildCvIntelligenceSummary(cvText, targetRole),
    [cvText, targetRole],
  );

  const signals = useMemo(() => detectAnswerSignals(answer), [answer]);
  const mood = useMemo(() => getMood(answer.trim() ? signals.score : 50), [answer, signals.score]);
  const weaknessRadar = useMemo(() => buildWeaknessRadar(answer), [answer]);
  const followUps = useMemo(() => buildFollowUps(answer, recruiter.name), [answer, recruiter.name]);
  const smartActions = useMemo(() => getSmartActions(answer), [answer]);
  const MoodIcon = mood.icon;

  useEffect(() => {
    trackWorkZoLaunchEvent({
      event: "copilot_opened",
      role: targetRole,
      recruiter: recruiter.name,
      mode: "copilot",
    });
  }, [targetRole, recruiter.name]);

  async function runAction(action: SmartAction["id"]) {
    trackWorkZoLaunchEvent({
      event: "copilot_action_used",
      role: targetRole,
      recruiter: recruiter.name,
      mode: "copilot",
      metadata: { action },
    });

    try {
      setLoading(true);
      setComparison(null);

      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          question,
          answer,
          cvText,
          jobDescription: setup.jobDescription || "",
          targetRole,
          targetMarket: setup.targetMarket || "Global",
          recruiterName: recruiter.name,
          recruiterRole: recruiter.role,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        output?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Copilot failed");
      }

      const aiOutput = data.output || "No recruiter analysis generated.";
      setOutput(aiOutput);
      setImprovedAnswer(aiOutput);

      if (action === "magic" || action === "rewrite" || action === "star" || action === "concise") {
        setComparison(compareAnswers(answer, aiOutput));
      }
    } catch (error) {
      console.warn("AI copilot failed, using local fallback:", error);

      if (action === "magic") {
        const result = buildMagicAnswer({ question, answer, targetRole });
        setOutput(result);
        setImprovedAnswer(result);
        setComparison(compareAnswers(answer, result));
        return;
      }

      const result = runWorkobotAction({
        action,
        question,
        answer,
        cvText,
        targetRole,
      });

      setOutput(result);
      setImprovedAnswer(result);

      if (action === "rewrite" || action === "star" || action === "concise") {
        setComparison(compareAnswers(answer, result));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_32%),linear-gradient(180deg,#06111f_0%,#050816_100%)] p-4 text-white">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.045] px-5 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
          <Link href="/interview" className="inline-flex items-center gap-3 text-sm font-black text-slate-300 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
            Back to interview
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/16 text-blue-200">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black">Work-O-Bot</p>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                Recruiter-aware copilot
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[0.72fr_1.12fr_0.88fr]">
          <aside className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              <FileText className="h-4 w-4" />
              CV intelligence
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-tight">
              Your recruiter noticed
            </h1>

            <div className="mt-4 space-y-3">
              {cvSummary.bullets.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/18 p-3 text-sm leading-6 text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/8 p-4">
              <p className="text-sm font-black text-cyan-100">
                {recruiter.name} · {recruiter.role}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Focus: {recruiter.focus.join(", ")}.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/8 p-4 text-sm leading-6 text-amber-100">
              Work-O-Bot is not a generic chatbot. It predicts recruiter doubts and helps you recover trust.
            </div>
          </aside>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Recruiter question
                </p>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  className="mt-2 h-24 w-full resize-none rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-white outline-none focus:border-cyan-300/40"
                />
              </div>

              <div className={`rounded-3xl border px-4 py-3 ${mood.className}`}>
                <div className="flex items-center gap-2">
                  <MoodIcon className="h-5 w-5" />
                  <p className="text-sm font-black">{mood.label}</p>
                </div>
                <p className="mt-1 max-w-[220px] text-xs leading-5 opacity-90">{mood.tone}</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                Your answer
              </label>
              <textarea
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  setComparison(null);
                }}
                placeholder="Paste or type your answer here..."
                className="mt-2 h-52 w-full resize-none rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/18 p-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-200" />
                  <h2 className="font-black">Weakness radar</h2>
                </div>

                <div className="mt-3 space-y-2">
                  {weaknessRadar.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black">{item.label}</p>
                        <span
                          className={
                            item.ok
                              ? "rounded-full bg-emerald-400/12 px-2 py-1 text-xs font-black text-emerald-200"
                              : "rounded-full bg-red-400/12 px-2 py-1 text-xs font-black text-red-200"
                          }
                        >
                          {item.ok ? "OK" : "Weak"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.advice}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/18 p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-cyan-200" />
                  <h2 className="font-black">Likely follow-ups</h2>
                </div>

                <div className="mt-3 space-y-2">
                  {followUps.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-slate-300">
                      “{item}”
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {smartActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => runAction(action.id)}
                    className={`rounded-2xl border p-4 text-left transition hover:scale-[1.01] ${
                      action.priority === "high"
                        ? "border-cyan-300/30 bg-cyan-400/8"
                        : "border-white/10 bg-white/[0.045] hover:border-cyan-300/25 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-cyan-200" />
                      <p className="font-black">{action.title}</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{action.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Copilot output</h2>
              <button
                type="button"
                onClick={() => {
                  setOutput("");
                  setImprovedAnswer("");
                  setComparison(null);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-2 text-slate-300 hover:text-white"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 min-h-[360px] max-h-[540px] overflow-y-auto whitespace-pre-line rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-200">
              {loading ? (
                <div className="flex h-[260px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                    <p className="mt-4 text-sm text-slate-400">
                      Work-O-Bot is analyzing recruiter intent...
                    </p>
                  </div>
                </div>
              ) : (
                output || "Choose an action to get recruiter-aware coaching."
              )}
            </div>

            {comparison && (
              <div className="mt-4 rounded-3xl border border-emerald-300/20 bg-emerald-400/8 p-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-emerald-200" />
                  <p className="font-black">Before vs after</p>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-black/18 p-3">
                    <p className="text-xs text-slate-500">Original</p>
                    <p className="text-2xl font-black">{comparison.oldScore}</p>
                  </div>
                  <div className="rounded-2xl bg-black/18 p-3">
                    <p className="text-xs text-slate-500">Improved</p>
                    <p className="text-2xl font-black">{comparison.newScore}</p>
                  </div>
                  <div className="rounded-2xl bg-black/18 p-3">
                    <p className="text-xs text-slate-500">Trust</p>
                    <p className="text-2xl font-black">
                      {comparison.trustDelta > 0 ? "+" : ""}
                      {comparison.trustDelta}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">{comparison.message}</p>
              </div>
            )}

            {improvedAnswer && (
              <button
                type="button"
                onClick={() => {
                  setAnswer(improvedAnswer);
                  setOutput("Saved as your new answer. Run another action to improve it further.");
                  setComparison(null);
                }}
                className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 text-sm font-black text-white shadow-[0_14px_34px_rgba(59,130,246,0.25)]"
              >
                Use improved answer
              </button>
            )}

            <div className="mt-4">
              <FeedbackCapture source="copilot" />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
