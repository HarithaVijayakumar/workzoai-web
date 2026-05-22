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

export type RecruiterRuntimeInput = {
  answer: string;
  score?: number;
  pressureLevel?: number;
  memory?: EmotionalMemoryState;
};

export type RecruiterRuntimeOutput = {
  state: RecruiterRuntimeState;
  mood: RecruiterRuntimeMood;
  pressureLevel: number;
  interruption: InterruptionResult;
  reactionLines: string[];
  memory: EmotionalMemoryState;
  memoryLine: string | null;
  suggestedLine: string;
  trust: number;
  confidence: number;
  interest: number;
};

export function runRecruiterRuntime({
  answer,
  score = 70,
  pressureLevel = 50,
  memory = initialEmotionalMemory,
}: RecruiterRuntimeInput): RecruiterRuntimeOutput {
  const safeAnswer = answer.trim();

  const interruption = evaluateInterruption(safeAnswer, pressureLevel);
  const updatedMemory = updateEmotionalMemory(memory, safeAnswer);
  const memoryLine = getMemoryBasedRecruiterLine(updatedMemory);

  const missingMetrics = !/\d/.test(safeAnswer);
  const vague = detectVagueAnswer(safeAnswer);

  const reactionLines = getRecruiterReaction({
    score,
    missingMetrics,
    vague,
  });

  const mood = determineMood({
    score,
    interruption,
    memory: updatedMemory,
    missingMetrics,
    vague,
  });

  const state = determineState({
    interruption,
    mood,
  });

  const nextPressureLevel = calculateNextPressureLevel({
    currentPressure: pressureLevel,
    interruption,
    memory: updatedMemory,
    score,
  });

  const suggestedLine = chooseSuggestedLine({
    interruption,
    memoryLine,
    reactionLines,
    mood,
  });

  return {
    state,
    mood,
    pressureLevel: nextPressureLevel,
    interruption,
    reactionLines,
    memory: updatedMemory,
    memoryLine,
    suggestedLine,
    trust: updatedMemory.trust,
    confidence: updatedMemory.confidence,
    interest: updatedMemory.interest,
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
  ].some((phrase) => text.includes(phrase));
}

function determineMood({
  score,
  interruption,
  memory,
  missingMetrics,
  vague,
}: {
  score: number;
  interruption: InterruptionResult;
  memory: EmotionalMemoryState;
  missingMetrics: boolean;
  vague: boolean;
}): RecruiterRuntimeMood {
  if (score >= 85 && memory.trust >= 75) return "impressed";

  if (interruption.shouldInterrupt && interruption.severity === "high") {
    return "pressuring";
  }

  if (missingMetrics || vague || memory.trust < 55) {
    return "skeptical";
  }

  if (score >= 75 || memory.interest >= 75) {
    return "interested";
  }

  if (memory.confidence < 45) {
    return "recovering";
  }

  return "neutral";
}

function determineState({
  interruption,
  mood,
}: {
  interruption: InterruptionResult;
  mood: RecruiterRuntimeMood;
}): RecruiterRuntimeState {
  if (interruption.shouldInterrupt) return "interrupting";
  if (mood === "skeptical" || mood === "pressuring") return "thinking";
  if (mood === "interested" || mood === "impressed") return "reacting";

  return "listening";
}

function calculateNextPressureLevel({
  currentPressure,
  interruption,
  memory,
  score,
}: {
  currentPressure: number;
  interruption: InterruptionResult;
  memory: EmotionalMemoryState;
  score: number;
}) {
  let next = currentPressure;

  if (interruption.shouldInterrupt) {
    if (interruption.severity === "high") next += 10;
    if (interruption.severity === "medium") next += 6;
    if (interruption.severity === "low") next += 3;
  }

  if (memory.repeatedWeaknesses.length > 0) {
    next += 5;
  }

  if (score >= 85) {
    next -= 8;
  }

  if (memory.trust < 45) {
    next += 7;
  }

  return clamp(next, 20, 95);
}

function chooseSuggestedLine({
  interruption,
  memoryLine,
  reactionLines,
  mood,
}: {
  interruption: InterruptionResult;
  memoryLine: string | null;
  reactionLines: string[];
  mood: RecruiterRuntimeMood;
}) {
  if (interruption.shouldInterrupt && interruption.interruptionMessage) {
    return interruption.interruptionMessage;
  }

  if (memoryLine) {
    return memoryLine;
  }

  if (reactionLines.length > 0) {
    if (mood === "impressed") return reactionLines[0];
    if (mood === "skeptical") return reactionLines[1] ?? reactionLines[0];
    return reactionLines[0];
  }

  return "Okay, continue.";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}