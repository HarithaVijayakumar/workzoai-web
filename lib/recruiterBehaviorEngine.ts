import type { LiveAnswerAnalysis } from "@/lib/liveAnswerAnalyzer";
import {
  moodInstruction,
  type RecruiterPersonalityConfig,
  type RecruiterState,
} from "@/lib/recruiterStateEngine";

export type RecruiterBehaviorDecision = {
  shouldInterrupt: boolean;
  interruptionMessage: string;
  responseMode: "continue" | "probe" | "challenge" | "interrupt" | "move_on" | "recover";
  pressureInstruction: string;
  followUpFocus: string;
  stateDelta: {
    trust: number;
    patience: number;
    skepticism: number;
    engagement: number;
    pressure: number;
    warmth: number;
    confidenceInCandidate: number;
    weakAnswer: boolean;
    strongAnswer: boolean;
  };
};

export function decideRecruiterBehavior(input: {
  analysis: LiveAnswerAnalysis;
  recruiterState: RecruiterState;
  personality: RecruiterPersonalityConfig;
}) {
  const { analysis, recruiterState, personality } = input;

  const weak =
    analysis.overallQuality < 48 ||
    analysis.vagueScore >= 58 ||
    analysis.avoidanceScore >= 55 ||
    (!analysis.hasMetric && !analysis.hasExample && analysis.wordCount > 55);

  const strong =
    analysis.overallQuality >= 74 &&
    analysis.hasMetric &&
    analysis.hasOwnership &&
    analysis.hasOutcome;

  const shouldInterrupt =
    analysis.ramblingScore >= 70 ||
    analysis.fillerCount >= 5 ||
    analysis.avoidanceScore >= 70 ||
    (analysis.vagueScore >= 72 && recruiterState.patience < personality.interruptionTolerance);

  const interruptionMessage = getInterruptionMessage(analysis, recruiterState);

  const responseMode = shouldInterrupt
    ? "interrupt"
    : weak && recruiterState.weakAnswerStreak >= 2
      ? "challenge"
      : weak
        ? "probe"
        : strong
          ? "recover"
          : "continue";

  const followUpFocus = getFollowUpFocus(analysis, responseMode);
  const pressureInstruction = buildPressureInstruction({ analysis, recruiterState, responseMode });

  const stateDelta = {
    trust: strong ? 9 : weak ? -10 : 1,
    patience: strong ? 5 : weak ? -12 : -2,
    skepticism: strong ? -8 : weak ? 10 : 1,
    engagement: strong ? 8 : weak ? -7 : 2,
    pressure: strong ? -4 : weak ? 9 : 1,
    warmth: strong ? 3 : weak ? -5 : 0,
    confidenceInCandidate: strong ? 10 : weak ? -12 : 2,
    weakAnswer: weak,
    strongAnswer: strong,
  };

  return { shouldInterrupt, interruptionMessage, responseMode, pressureInstruction, followUpFocus, stateDelta } satisfies RecruiterBehaviorDecision;
}

function getInterruptionMessage(analysis: LiveAnswerAnalysis, recruiterState: RecruiterState) {
  if (analysis.ramblingScore >= 70) return "I’m going to stop you there. Please give me the result first, then one example.";
  if (analysis.fillerCount >= 5) return "Let’s pause. You sound unsure. Give me one concrete example with your exact role.";
  if (analysis.avoidanceScore >= 70) return "That is not directly answering the question. Please answer it more directly.";
  if (analysis.vagueScore >= 72 || recruiterState.weakAnswerStreak >= 2) return "I’m still not hearing a concrete answer. What exactly did you do?";
  return "Let me stop you there. Please make the answer more specific.";
}

function getFollowUpFocus(analysis: LiveAnswerAnalysis, mode: RecruiterBehaviorDecision["responseMode"]) {
  if (mode === "interrupt") return "Interrupt politely and ask for a direct, specific answer.";
  if (!analysis.hasOwnership) return "Ask what the candidate personally owned or delivered.";
  if (!analysis.hasMetric) return "Ask for numbers, scale, impact, or measurable outcome.";
  if (!analysis.hasExample) return "Ask for one concrete example.";
  if (analysis.relevanceScore < 50) return "Redirect answer back to the role and job description.";
  if (analysis.fillerCount >= 3) return "Ask the candidate to slow down and answer with confidence.";
  if (mode === "challenge") return "Challenge the answer and ask for proof.";
  if (mode === "recover") return "Acknowledge the stronger answer briefly and ask a deeper follow-up.";
  return "Ask one focused follow-up.";
}

function buildPressureInstruction(input: {
  analysis: LiveAnswerAnalysis;
  recruiterState: RecruiterState;
  responseMode: RecruiterBehaviorDecision["responseMode"];
}) {
  const { analysis, recruiterState, responseMode } = input;

  const rules = [
    moodInstruction(recruiterState.mood),
    "Ask only one question.",
    "Keep the response short: 1-3 sentences.",
    "Do not coach unless the interview has ended.",
    "Do not over-explain.",
  ];

  if (responseMode === "interrupt") rules.push("Interrupt firmly but professionally. Make the candidate answer directly.");
  if (responseMode === "challenge") rules.push("Become more skeptical. Mention what is missing and ask for evidence.");
  if (analysis.vagueScore >= 55) rules.push("Say that the answer is still too broad or high-level.");
  if (!analysis.hasMetric) rules.push("Ask for measurable impact or scale.");
  if (!analysis.hasOwnership) rules.push("Ask what the candidate personally did, not what the team did.");
  if (analysis.ramblingScore >= 60) rules.push("Ask for a concise version in 45 seconds or less.");

  return rules.join("\n");
}
