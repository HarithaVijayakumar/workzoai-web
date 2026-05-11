"use client";

import Link from "next/link";
import { useInterviewStore } from "@/store/interviewStore";

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item) => typeof item === "string" && item.trim().length > 0
      )
    : [];
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && !Number.isNaN(value)
    ? value
    : fallback;
}

function scoreLabel(score: number) {
  if (score >= 80) return "Strong interview performance";
  if (score >= 65) return "Good, but still needs polish";
  if (score >= 45) return "Needs clearer proof";
  return "Not enough recruiter confidence yet";
}

export default function ResultsPage() {
  const {
    setup,
    transcript,
    recruiterMemory,
    liveScore,
    pressureLevel,
    emotionState,
    startedAt,
    endedAt,
    persistentPatterns,
    answerHistory,
    interruptionHistory,
    recruiterTrustHistory,
    clearPersistentMemory,
  } = useInterviewStore();

  const userAnswers = transcript.filter((item) => item.speaker === "user");

  const generatedStrengths = safeArray(
    recruiterMemory
      .filter((item) => item.importance === "high")
      .map((item) => item.label)
  );

  const generatedWeaknesses = safeArray(
    recruiterMemory
      .filter(
        (item) =>
          item.value.toLowerCase().includes("need") ||
          item.value.toLowerCase().includes("gap") ||
          item.value.toLowerCase().includes("missing") ||
          item.value.toLowerCase().includes("transition")
      )
      .map((item) => item.label)
  );

  const strengths =
    generatedStrengths.length > 0
      ? [...new Set(generatedStrengths)]
      : liveScore.overall >= 60
        ? ["Completed the interview with enough signal for evaluation"]
        : [];

  const weaknesses =
    generatedWeaknesses.length > 0
      ? [...new Set(generatedWeaknesses)]
      : liveScore.overall < 60
        ? ["Needs clearer examples, structure, and measurable results"]
        : [];

  const improvements = [
    liveScore.evidence < 65
      ? "Add measurable outcomes such as percentages, time saved, tickets handled, or business impact."
      : "",
    liveScore.structure < 65
      ? "Use STAR format: situation, task, action, and result."
      : "",
    liveScore.relevance < 65
      ? "Connect each answer more directly to the target role and job description."
      : "",
    liveScore.confidence < 65
      ? "Answer with more ownership and reduce uncertain phrases like 'maybe' or 'I think'."
      : "",
  ].filter(Boolean);

  const duration =
    startedAt && endedAt
      ? Math.max(1, Math.round((endedAt - startedAt) / 60000))
      : null;

  const overall = safeNumber(liveScore.overall);
  const trustPoints =
    recruiterTrustHistory.length > 0 ? recruiterTrustHistory : [overall];

  const finalTrust = trustPoints[trustPoints.length - 1] || overall;
  const highestTrust = Math.max(...trustPoints);
  const lowestTrust = Math.min(...trustPoints);

  const targetRole = setup.targetRole || "Target role";
  const targetMarket = setup.targetMarket || "Global";
  const companyStyle = setup.companyStyle || "Realistic";
  const recruiterPersonality =
    setup.recruiterPersonality || "Realistic recruiter";

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10">
          <div className="inline-flex rounded-full border border-green-400/20 bg-green-500/10 px-4 py-2 text-sm text-green-200">
            Interview Completed
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Your recruiter simulation report
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                WorkZo reviewed your answers, recruiter memory, pressure
                response, and live scoring signals to summarize your interview
                performance.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-blue-500/10 px-4 py-2 text-blue-200">
                  Role: {targetRole}
                </span>

                <span className="rounded-full bg-purple-500/10 px-4 py-2 text-purple-200">
                  Market: {targetMarket}
                </span>

                <span className="rounded-full bg-cyan-500/10 px-4 py-2 text-cyan-200">
                  Recruiter: {recruiterPersonality}
                </span>

                <span className="rounded-full bg-white/10 px-4 py-2 text-slate-300">
                  Style: {companyStyle}
                </span>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-black/20 p-6">
              <p className="text-sm text-slate-400">Overall score</p>

              <div className="mt-3 flex items-end gap-3">
                <span className="text-6xl font-bold">{overall}</span>
                <span className="pb-2 text-slate-400">/100</span>
              </div>

              <p className="mt-3 text-lg font-semibold text-blue-200">
                {scoreLabel(overall)}
              </p>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${overall}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[32px] border border-cyan-400/20 bg-cyan-500/10 p-6 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">
                Long-term recruiter patterns
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                WorkZo remembers recurring interview habits across practice
                sessions on this device.
              </p>
            </div>

            <button
              onClick={clearPersistentMemory}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Clear memory
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Answers tracked</p>
              <p className="mt-1 text-3xl font-bold">{answerHistory.length}</p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Interruptions recorded</p>
              <p className="mt-1 text-3xl font-bold">
                {interruptionHistory.length}
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Trust trend points</p>
              <p className="mt-1 text-3xl font-bold">
                {recruiterTrustHistory.length}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {persistentPatterns.length > 0 ? (
              persistentPatterns
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map((pattern) => (
                  <div
                    key={pattern.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">
                        {pattern.label}
                      </p>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                        Seen {pattern.count}x
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {pattern.count >= 3
                        ? "This is becoming a recurring interview habit."
                        : "This appeared in recent practice and should be watched."}
                    </p>
                  </div>
                ))
            ) : (
              <p className="rounded-2xl bg-black/20 p-4 text-sm text-slate-400">
                No long-term patterns yet. Complete a few more answers to build
                memory.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-[32px] border border-purple-400/20 bg-purple-500/10 p-6 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">
                Recruiter trust evolution
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                WorkZo tracks how recruiter confidence changed during the
                interview.
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 px-4 py-3 text-right">
              <p className="text-xs text-slate-400">Final trust</p>
              <p className="text-2xl font-bold text-white">{finalTrust}%</p>
            </div>
          </div>

          <div className="mt-8 flex h-48 items-end gap-2 overflow-hidden">
            {trustPoints.slice(-25).map((value, index) => (
              <div
                key={`${value}-${index}`}
                className="flex flex-1 flex-col items-center justify-end"
              >
                <div
                  className={`w-full rounded-t-xl transition-all duration-500 ${
                    value >= 75
                      ? "bg-green-400"
                      : value >= 55
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                  style={{
                    height: `${Math.max(12, safeNumber(value))}%`,
                  }}
                />

                <span className="mt-2 text-[10px] text-slate-500">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Highest trust</p>
              <p className="mt-1 text-3xl font-bold">{highestTrust}%</p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Lowest trust</p>
              <p className="mt-1 text-3xl font-bold">{lowestTrust}%</p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Emotional state</p>
              <p className="mt-1 text-3xl font-bold capitalize">
                {emotionState || "neutral"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-sm text-green-200">Strengths</p>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {strengths.length > 0 ? (
                strengths.map((item, index) => (
                  <li key={`${item}-${index}`}>• {item}</li>
                ))
              ) : (
                <li>No strengths detected yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-sm text-red-200">Weaknesses</p>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {weaknesses.length > 0 ? (
                weaknesses.map((item, index) => (
                  <li key={`${item}-${index}`}>• {item}</li>
                ))
              ) : (
                <li>No major weaknesses detected yet.</li>
              )}
            </ul>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-sm text-amber-200">Next improvements</p>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {improvements.length > 0 ? (
                improvements.map((item, index) => (
                  <li key={`${item}-${index}`}>• {item}</li>
                ))
              ) : (
                <li>Keep practicing with role-specific examples.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Recruiter state</h2>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-400">Final emotion</p>
                <p className="mt-1 text-lg font-semibold capitalize">
                  {emotionState || "neutral"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-400">Pressure level</p>
                <p className="mt-1 text-lg font-semibold">
                  {safeNumber(pressureLevel)}%
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-400">Candidate answers</p>
                <p className="mt-1 text-lg font-semibold">
                  {userAnswers.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-400">Duration</p>
                <p className="mt-1 text-lg font-semibold">
                  {duration ? `${duration} min` : "Session"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ["Overall", liveScore.overall],
                ["Confidence", liveScore.confidence],
                ["Clarity", liveScore.clarity],
                ["Relevance", liveScore.relevance],
                ["Structure", liveScore.structure],
                ["Evidence", liveScore.evidence],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <div className="mb-2 flex justify-between text-sm text-slate-300">
                    <span>{label}</span>
                    <span>{safeNumber(value)}%</span>
                  </div>

                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${safeNumber(value)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Recruiter memory</h2>

            <div className="mt-5 space-y-3">
              {recruiterMemory.length > 0 ? (
                recruiterMemory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">{item.label}</p>

                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase tracking-wide text-slate-300">
                        {item.importance}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.value}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-black/20 p-4 text-sm text-slate-400">
                  No recruiter memory captured yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Interview transcript</h2>

          <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {transcript.length > 0 ? (
              transcript.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 text-sm leading-6 ${
                    item.speaker === "user"
                      ? "ml-auto max-w-3xl bg-blue-500 text-white"
                      : "max-w-3xl bg-white/10 text-slate-200"
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold uppercase opacity-70">
                    {item.speaker === "user" ? "You" : "Recruiter"}
                  </p>

                  {item.text}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No transcript available yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/interview"
            className="rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400"
          >
            Practice again
          </Link>

          <Link
            href="/onboarding"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Change setup
          </Link>

          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}