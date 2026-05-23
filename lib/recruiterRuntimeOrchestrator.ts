import {
  evaluateInterruption,
  type InterruptionResult,
} from "./interruptionEngine";

import {
  updateEmotionalMemory,
  getMemoryBasedRecruiterLine,
  initialEmotionalMemory,
  type EmotionalMemoryState,
} from "./emotionalMemoryEngine";

import { getRecruiterReaction } from "./recruiterReactionEngine";

export type RecruiterRuntimeMood =
  | "neutral"
  | "interested"
  | "skeptical"
  | "pressuring"
  | "impressed"
  | "recovering";

export type RecruiterRuntimeState =
  | "listening"
  | "thinking"
  | "reacting"
  | "interrupting"
  | "typing_notes"
  | "waiting";

export type RecruiterRuntimeDecision =
  | "interrupt"
  | "memory_callback"
  | "challenge"
  | "react"
  | "probe"
  | "continue"
  | "recover";

export type RecruiterRuntimeInput = {
  answer: string;
  score?: number;
  pressureLevel?: number;
  memory?: EmotionalMemoryState;
  turnIndex?: number;
};

export type RecruiterRuntimeOutput = {
  /**
   * One clear decision for the page/orchestrator to use later.
   * Keep /interview simple: read runtimeDecision + suggestedLine + visualState.
   */
  runtimeDecision: RecruiterRuntimeDecision;

  /** Backward-compatible visual state name used by earlier code. */
  state: RecruiterRuntimeState;

  /** Preferred clearer name for future orchestration. */
  visualState: RecruiterRuntimeState;

  mood: RecruiterRuntimeMood;
  pressureLevel: number;
  interruption: InterruptionResult;
  reactionLines: string[];
  memory: EmotionalMemoryState;
  memoryLine: string | null;

  /** The single best recruiter micro-line for this turn. */
  suggestedLine: string;

  /** Optional next probe direction. Do not speak automatically yet. */
  nextAction: "ask_follow_up" | "wait" | "move_on" | "recover_trust";

  /** Simple signal label useful for analytics/debugging later. */
  signal:
    | "strong_answer"
    | "missing_metrics"
    | "vague_answer"
    | "weak_clarity"
    | "too_long"
    | "neutral_answer";

  trust: number;
  confidence: number;
  interest: number;
};

export function runRecruiterRuntime({
  answer,
  score = 70,
  pressureLevel = 50,
  memory = initialEmotionalMemory,
  turnIndex = 0,
}: RecruiterRuntimeInput): RecruiterRuntimeOutput {
  const safeAnswer = normalizeAnswer(answer);
  const answerSignals = analyzeRuntimeAnswer(safeAnswer);

  const interruption = evaluateInterruption(safeAnswer, pressureLevel);
  const updatedMemory = updateEmotionalMemory(memory, safeAnswer);
  const memoryLine = getMemoryBasedRecruiterLine(updatedMemory);

  const reactionLines = getRecruiterReaction({
    score,
    missingMetrics: answerSignals.missingMetrics,
    vague: answerSignals.vague,
  });

  const mood = determineMood({
    score,
    interruption,
    memory: updatedMemory,
    missingMetrics: answerSignals.missingMetrics,
    vague: answerSignals.vague,
    weakClarity: answerSignals.weakClarity,
    tooLong: answerSignals.tooLong,
  });

  const runtimeDecision = determineRuntimeDecision({
    interruption,
    memoryLine,
    mood,
    score,
    answerSignals,
    turnIndex,
  });

  const visualState = determineState({
    interruption,
    mood,
    runtimeDecision,
  });

  const nextPressureLevel = calculateNextPressureLevel({
    currentPressure: pressureLevel,
    interruption,
    memory: updatedMemory,
    score,
    answerSignals,
  });

  const suggestedLine = chooseSuggestedLine({
    runtimeDecision,
    interruption,
    memoryLine,
    reactionLines,
    mood,
    answerSignals,
  });

  return {
    runtimeDecision,
    state: visualState,
    visualState,
    mood,
    pressureLevel: nextPressureLevel,
    interruption,
    reactionLines,
    memory: updatedMemory,
    memoryLine,
    suggestedLine,
    nextAction: determineNextAction(runtimeDecision, mood, updatedMemory),
    signal: getPrimarySignal(answerSignals, score),
    trust: updatedMemory.trust,
    confidence: updatedMemory.confidence,
    interest: updatedMemory.interest,
  };
}

function normalizeAnswer(answer: string) {
  return answer.replace(/\s+/g, " ").trim();
}

function analyzeRuntimeAnswer(answer: string) {
  const lower = answer.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const hasMetrics = /\d|percent|percentage|hours?|days?|weeks?|months?|customers?|tickets?|users?|reduced|increased|saved|improved|faster|revenue|cost/i.test(
    answer,
  );

  const hasOwnership = /\b(i|my|personally|led|owned|handled|resolved|built|created|improved|implemented|analyzed|designed)\b/i.test(
    answer,
  );

  const vague = detectVagueAnswer(answer);
  const missingMetrics = !hasMetrics;
  const weakClarity = wordCount > 0 && wordCount < 14;
  const tooLong = wordCount > 120;
  const strong = hasMetrics && hasOwnership && !vague && wordCount >= 25;

  return {
    wordCount,
    hasMetrics,
    hasOwnership,
    vague,
    missingMetrics,
    weakClarity,
    tooLong,
    strong,
  };
}

function detectVagueAnswer(answer: string) {
  const text = answer.toLowerCase();

  return [
    "hardworking",
    "passionate",
    "quick learner",
    "team player",
    "good communication",
    "helped with",
    "involved in",
    "worked on",
    "responsible for",
    "many things",
    "a lot of things",
    "various tasks",
  ].some((phrase) => text.includes(phrase));
}

function determineRuntimeDecision({
  interruption,
  memoryLine,
  mood,
  score,
  answerSignals,
  turnIndex,
}: {
  interruption: InterruptionResult;
  memoryLine: string | null;
  mood: RecruiterRuntimeMood;
  score: number;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
  turnIndex: number;
}): RecruiterRuntimeDecision {
  // Strict priority order. This prevents engines from competing.
  if (interruption.shouldInterrupt) return "interrupt";

  // Do not overuse memory callbacks in the first 1–2 turns.
  if (memoryLine && turnIndex >= 2) return "memory_callback";

  if (mood === "pressuring" || mood === "skeptical") return "challenge";
  if (mood === "recovering") return "recover";
  if (mood === "impressed" || answerSignals.strong || score >= 85) return "react";

  if (answerSignals.weakClarity || answerSignals.missingMetrics || answerSignals.vague) {
    return "probe";
  }

  return "continue";
}

function determineMood({
  score,
  interruption,
  memory,
  missingMetrics,
  vague,
  weakClarity,
  tooLong,
}: {
  score: number;
  interruption: InterruptionResult;
  memory: EmotionalMemoryState;
  missingMetrics: boolean;
  vague: boolean;
  weakClarity: boolean;
  tooLong: boolean;
}): RecruiterRuntimeMood {
  if (score >= 85 && memory.trust >= 75) return "impressed";

  if (interruption.shouldInterrupt && interruption.severity === "high") {
    return "pressuring";
  }

  if (tooLong || missingMetrics || vague || weakClarity || memory.trust < 55) {
    return "skeptical";
  }

  if (memory.confidence < 45) return "recovering";

  if (score >= 75 || memory.interest >= 75) return "interested";

  return "neutral";
}

function determineState({
  interruption,
  mood,
  runtimeDecision,
}: {
  interruption: InterruptionResult;
  mood: RecruiterRuntimeMood;
  runtimeDecision: RecruiterRuntimeDecision;
}): RecruiterRuntimeState {
  if (interruption.shouldInterrupt || runtimeDecision === "interrupt") {
    return "interrupting";
  }

  if (runtimeDecision === "memory_callback") return "typing_notes";
  if (mood === "skeptical" || mood === "pressuring") return "thinking";
  if (mood === "interested" || mood === "impressed") return "reacting";

  return "listening";
}

function calculateNextPressureLevel({
  currentPressure,
  interruption,
  memory,
  score,
  answerSignals,
}: {
  currentPressure: number;
  interruption: InterruptionResult;
  memory: EmotionalMemoryState;
  score: number;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
}) {
  let next = currentPressure;

  if (interruption.shouldInterrupt) {
    if (interruption.severity === "high") next += 10;
    if (interruption.severity === "medium") next += 6;
    if (interruption.severity === "low") next += 3;
  }

  if (memory.repeatedWeaknesses.length > 0) next += 5;
  if (answerSignals.vague || answerSignals.missingMetrics) next += 4;
  if (answerSignals.tooLong) next += 3;
  if (score >= 85 || answerSignals.strong) next -= 8;
  if (memory.trust < 45) next += 7;

  return clamp(next, 20, 95);
}

function chooseSuggestedLine({
  runtimeDecision,
  interruption,
  memoryLine,
  reactionLines,
  mood,
  answerSignals,
}: {
  runtimeDecision: RecruiterRuntimeDecision;
  interruption: InterruptionResult;
  memoryLine: string | null;
  reactionLines: string[];
  mood: RecruiterRuntimeMood;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
}) {
  if (runtimeDecision === "interrupt" && interruption.interruptionMessage) {
    return interruption.interruptionMessage;
  }

  if (runtimeDecision === "memory_callback" && memoryLine) {
    return memoryLine;
  }

  if (runtimeDecision === "challenge") {
    if (answerSignals.missingMetrics) return "Give me the result, not just the activity.";
    if (answerSignals.vague) return "That is still broad. Give me one concrete situation.";
    if (answerSignals.weakClarity) return "I need more context before I can judge that.";
    return reactionLines[1] ?? reactionLines[0] ?? "I need stronger evidence here.";
  }

  if (runtimeDecision === "recover") {
    return "You can still recover this. Give me a specific example with your role and the result.";
  }

  if (runtimeDecision === "react") {
    return reactionLines[0] ?? "That is stronger.";
  }

  if (runtimeDecision === "probe") {
    if (answerSignals.missingMetrics) return "What changed because of your work? Give me a number or rough estimate.";
    if (!answerSignals.hasOwnership) return "What part of that was directly handled by you?";
    return "Can you make that more specific?";
  }

  if (reactionLines.length > 0) {
    if (mood === "impressed") return reactionLines[0];
    if (mood === "skeptical") return reactionLines[1] ?? reactionLines[0];
    return reactionLines[0];
  }

  return "Okay, continue.";
}

function determineNextAction(
  runtimeDecision: RecruiterRuntimeDecision,
  mood: RecruiterRuntimeMood,
  memory: EmotionalMemoryState,
): RecruiterRuntimeOutput["nextAction"] {
  if (runtimeDecision === "interrupt" || runtimeDecision === "challenge" || runtimeDecision === "probe") {
    return "ask_follow_up";
  }

  if (runtimeDecision === "recover" || memory.trust < 50 || mood === "recovering") {
    return "recover_trust";
  }

  if (runtimeDecision === "react" && memory.trust >= 78) {
    return "move_on";
  }

  return "wait";
}

function getPrimarySignal(
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>,
  score: number,
): RecruiterRuntimeOutput["signal"] {
  if (score >= 85 || answerSignals.strong) return "strong_answer";
  if (answerSignals.tooLong) return "too_long";
  if (answerSignals.weakClarity) return "weak_clarity";
  if (answerSignals.vague) return "vague_answer";
  if (answerSignals.missingMetrics) return "missing_metrics";
  return "neutral_answer";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
