import type { LiveAnswerAnalysis } from "@/lib/liveAnswerAnalyzer";
import type { RecruiterState } from "@/lib/recruiterStateEngine";
import type { InterviewArc } from "@/lib/interviewPhaseEngine";

export type RecruiterChallengeMoment = {
  shouldTrigger: boolean;
  line: string;
  emotionalTag:
    | "missing-proof"
    | "unclear-ownership"
    | "rambling"
    | "avoidance"
    | "pressure"
    | "recovery"
    | "strong-signal";
  type: "challenge" | "interruption" | "recovery" | "positive";
};

export function getRecruiterChallengeMoment(input: {
  analysis: LiveAnswerAnalysis;
  recruiterState: RecruiterState;
  arc: InterviewArc;
}) {
  const { analysis, recruiterState, arc } = input;

  if (analysis.ramblingScore >= 70) {
    return {
      shouldTrigger: true,
      type: "interruption",
      emotionalTag: "rambling",
      line: "I’m going to stop you there. You’re giving too much context. Give me the result first.",
    } satisfies RecruiterChallengeMoment;
  }

  if (!analysis.hasOwnership && analysis.wordCount > 35) {
    return {
      shouldTrigger: true,
      type: "challenge",
      emotionalTag: "unclear-ownership",
      line: "I’m hearing what the team did, but I’m not hearing what you personally owned.",
    } satisfies RecruiterChallengeMoment;
  }

  if (!analysis.hasMetric && analysis.wordCount > 45) {
    return {
      shouldTrigger: true,
      type: "challenge",
      emotionalTag: "missing-proof",
      line: "That still sounds broad. What was the measurable impact?",
    } satisfies RecruiterChallengeMoment;
  }

  if (analysis.avoidanceScore >= 60) {
    return {
      shouldTrigger: true,
      type: "challenge",
      emotionalTag: "avoidance",
      line: "That does not directly answer my question. Let’s bring it back to the role.",
    } satisfies RecruiterChallengeMoment;
  }

  if (recruiterState.weakAnswerStreak >= 2 || arc.phase === "pressure") {
    return {
      shouldTrigger: true,
      type: "challenge",
      emotionalTag: "pressure",
      line: "I’m still missing a concrete reason to trust this answer.",
    } satisfies RecruiterChallengeMoment;
  }

  if (arc.phase === "recovery") {
    return {
      shouldTrigger: true,
      type: "recovery",
      emotionalTag: "recovery",
      line: "This is a chance to recover. Be specific and prove your ownership.",
    } satisfies RecruiterChallengeMoment;
  }

  if (analysis.overallQuality >= 76 && analysis.hasMetric && analysis.hasOwnership) {
    return {
      shouldTrigger: true,
      type: "positive",
      emotionalTag: "strong-signal",
      line: "That is stronger. Now I can see ownership and measurable impact.",
    } satisfies RecruiterChallengeMoment;
  }

  return {
    shouldTrigger: false,
    type: "challenge",
    emotionalTag: "pressure",
    line: "",
  } satisfies RecruiterChallengeMoment;
}
