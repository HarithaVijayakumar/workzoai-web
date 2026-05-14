import type { LiveAnswerAnalysis } from "@/lib/liveAnswerAnalyzer";
import type { RecruiterState } from "@/lib/recruiterStateEngine";

export type InterviewPhase = "opening" | "probing" | "pressure" | "recovery" | "closing";

export type InterviewArc = {
  phase: InterviewPhase;
  instruction: string;
  reason: string;
  recruiterTone: "warm" | "curious" | "analytical" | "skeptical" | "direct" | "closing";
};

export function decideInterviewPhase(input: {
  turnCount: number;
  analysis: LiveAnswerAnalysis;
  recruiterState: RecruiterState;
}) {
  const { turnCount, analysis, recruiterState } = input;

  if (turnCount >= 7) {
    return {
      phase: "closing",
      recruiterTone: "closing",
      reason: "Interview has enough signal to start closing evaluation.",
      instruction:
        "Move toward a final evaluation-style question. Ask one closing question about fit, motivation, or risk.",
    } satisfies InterviewArc;
  }

  if (
    recruiterState.weakAnswerStreak >= 2 ||
    recruiterState.patience <= 35 ||
    recruiterState.trust <= 40 ||
    analysis.avoidanceScore >= 65 ||
    analysis.vagueScore >= 70
  ) {
    return {
      phase: "pressure",
      recruiterTone: "direct",
      reason: "Candidate gave weak, vague, or evasive signals.",
      instruction:
        "Increase pressure. Be shorter, more direct, and ask for concrete proof. Do not soften the question.",
    } satisfies InterviewArc;
  }

  if (
    recruiterState.weakAnswerStreak >= 1 &&
    analysis.overallQuality >= 68 &&
    recruiterState.trust < 62
  ) {
    return {
      phase: "recovery",
      recruiterTone: "analytical",
      reason: "Candidate may be recovering after a weak signal.",
      instruction:
        "Give the candidate a chance to recover trust. Ask a focused follow-up that lets them prove ownership and impact.",
    } satisfies InterviewArc;
  }

  if (turnCount <= 1) {
    return {
      phase: "opening",
      recruiterTone: "curious",
      reason: "Interview is still in the opening stage.",
      instruction:
        "Start professionally. Ask broad but role-relevant questions and collect first signal.",
    } satisfies InterviewArc;
  }

  return {
    phase: "probing",
    recruiterTone: "analytical",
    reason: "Candidate has given initial signal; recruiter should go deeper.",
    instruction:
      "Probe deeper. Ask for metrics, ownership, trade-offs, and job-specific relevance.",
  } satisfies InterviewArc;
}

export function buildPhaseInstruction(arc: InterviewArc) {
  return [
    `Interview phase: ${arc.phase}`,
    `Recruiter tone: ${arc.recruiterTone}`,
    `Phase reason: ${arc.reason}`,
    `Phase instruction: ${arc.instruction}`,
  ].join("\n");
}
