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

export type RecruiterRuntimePersonality =
  | "analytical_hiring_manager"
  | "friendly_hr"
  | "startup_recruiter"
  | "german_corporate";

export type RecruiterRuntimeInput = {
  answer: string;
  recruiterId?: RecruiterRuntimePersonality;
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

  /** Short human reaction before the main recruiter line. Keep it tiny. */
  microReaction: string | null;

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
  recruiterId = "analytical_hiring_manager",
  score = 70,
  pressureLevel = 50,
  memory = initialEmotionalMemory,
  turnIndex = 0,
}: RecruiterRuntimeInput): RecruiterRuntimeOutput {
  const safeAnswer = normalizeAnswer(answer);
  const answerSignals = analyzeRuntimeAnswer(safeAnswer);

  const baseInterruption = evaluateInterruption(safeAnswer, pressureLevel);
  const updatedMemory = updateEmotionalMemory(memory, safeAnswer);
  const memoryLine = buildRuntimeMemoryLine({
    previousMemory: memory,
    updatedMemory,
    answerSignals,
    turnIndex,
  });

  const recoveryLine = buildRuntimeRecoveryLine({
    previousMemory: memory,
    answerSignals,
    score,
    turnIndex,
  });

  const interruption = buildMemoryEscalatedInterruption({
    baseInterruption,
    previousMemory: memory,
    answerSignals,
    pressureLevel,
    turnIndex,
  });

  const baseReactionLines = getRecruiterReaction({
    score,
    missingMetrics: answerSignals.missingMetrics,
    vague: answerSignals.vague,
  });

  const reactionLines = buildPressureAwareReactionLines({
    baseReactionLines: buildContextAwareReactionLines({
      baseReactionLines,
      answerSignals,
      score,
    }),
    interruption,
    memoryLine,
    answerSignals,
  });

  const mood = determineMood({
    score,
    interruption,
    memory: updatedMemory,
    missingMetrics: answerSignals.missingMetrics,
    vague: answerSignals.vague,
    weakClarity: answerSignals.weakClarity,
    tooLong: answerSignals.tooLong,
    recoveringStrongly: Boolean(recoveryLine),
  });

  const runtimeDecision = determineRuntimeDecision({
    interruption,
    memoryLine,
    recoveryLine,
    mood,
    score,
    answerSignals,
    turnIndex,
  });

  // If the candidate genuinely recovers with evidence after earlier weak turns,
  // do not let an older/high-pressure interruption decision overpower the
  // recovery arc. This keeps the recruiter emotionally realistic: tough when
  // needed, but able to soften when the candidate improves.
  const effectiveInterruption =
    runtimeDecision === "recover" && recoveryLine
      ? {
          ...interruption,
          shouldInterrupt: false,
          severity: "low" as const,
          interruptionMessage: "",
        }
      : interruption;

  const visualState = determineState({
    interruption: effectiveInterruption,
    mood,
    runtimeDecision,
  });

  const nextPressureLevel = calculateNextPressureLevel({
    currentPressure: pressureLevel,
    interruption: effectiveInterruption,
    memory: updatedMemory,
    score,
    answerSignals,
  });

  const microReaction = chooseMicroReaction({
    recruiterId,
    runtimeDecision,
    interruption: effectiveInterruption,
    memoryLine,
    recoveryLine,
    mood,
    answerSignals,
    score,
  });

  const suggestedLine = chooseSuggestedLine({
    runtimeDecision,
    interruption: effectiveInterruption,
    memoryLine,
    recoveryLine,
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
    interruption: effectiveInterruption,
    reactionLines,
    memory: updatedMemory,
    memoryLine,
    microReaction,
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
  const weakClarity = wordCount > 0 && wordCount < 14;
  const tooLong = wordCount > 120;

  const concreteCustomerExample = detectConcreteCustomerExample(answer);
  const concreteTechnicalExample = detectConcreteTechnicalExample(answer);
  const concreteExample = concreteCustomerExample || concreteTechnicalExample;

  // Spoken interview answers often do not include metrics, especially early in the call.
  // A concrete customer/story example should not be treated the same as a vague answer.
  const missingMetrics = !hasMetrics && !concreteExample;
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
    concreteExample,
    concreteCustomerExample,
    concreteTechnicalExample,
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

function detectConcreteCustomerExample(answer: string) {
  const text = answer.toLowerCase();

  const hasCustomer = /\b(customer|client|user|stakeholder|account|caller|person|old lady|older customer|non[- ]technical)\b/i.test(text);
  const hasSituation = /\b(issue|problem|case|ticket|complaint|request|could not|couldn't|unable|failed|not working|down|stuck|confused|scared|urgent)\b/i.test(text);
  const hasAction = /\b(i|my|personally|handled|resolved|fixed|guided|explained|walked|checked|updated|documented|followed up|calmed|listened|asked|showed|gave|took)\b/i.test(text);
  const hasOutcome = /\b(resolved|fixed|worked|happy|satisfied|closed|completed|successful|connected|restored|updated|documented)\b/i.test(text);

  return hasCustomer && hasSituation && hasAction && hasOutcome;
}

function detectConcreteTechnicalExample(answer: string) {
  const text = answer.toLowerCase();

  const productOrTechContext = /\b(router|wifi|wi-fi|internet|firmware|ip address|browser|chrome|belkin|linksys|ticket|crm|dashboard|software|hardware|login|setup|configuration)\b/i.test(text);
  const stepContext = /\b(step by step|walked|guided|checked|updated|opened|connected|documented|troubleshot|diagnosed|verified|configured)\b/i.test(text);
  const userContext = /\b(customer|client|user|non[- ]technical|old|older|scared|confused|not tech savvy)\b/i.test(text);

  return productOrTechContext && stepContext && userContext;
}


function hasPreviousWeakness(
  memory: EmotionalMemoryState,
  signal: "vague_answer" | "missing_metrics" | "weak_clarity",
) {
  const repeatedWeaknesses = new Set(memory.repeatedWeaknesses || []);
  const memorySignals = new Set((memory.memories || []).map((item) => item.signal));

  return repeatedWeaknesses.has(signal) || memorySignals.has(signal);
}

function buildMemoryEscalatedInterruption({
  baseInterruption,
  previousMemory,
  answerSignals,
  pressureLevel,
  turnIndex,
}: {
  baseInterruption: InterruptionResult;
  previousMemory: EmotionalMemoryState;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
  pressureLevel: number;
  turnIndex: number;
}): InterruptionResult {
  if (baseInterruption.shouldInterrupt) return baseInterruption;
  if (turnIndex < 2 || pressureLevel < 70) return baseInterruption;

  const repeatedVague =
    answerSignals.vague && hasPreviousWeakness(previousMemory, "vague_answer");
  const repeatedMissingMetrics =
    answerSignals.missingMetrics && hasPreviousWeakness(previousMemory, "missing_metrics");
  const repeatedWeakClarity =
    answerSignals.weakClarity && hasPreviousWeakness(previousMemory, "weak_clarity");

  if (repeatedVague) {
    return {
      shouldInterrupt: true,
      severity: pressureLevel >= 82 ? "high" : "medium",
      interruptionMessage:
        "Let me stop you there. This is the same broad pattern again — give me one specific situation and what you personally did.",
    };
  }

  if (repeatedMissingMetrics) {
    return {
      shouldInterrupt: true,
      severity: pressureLevel >= 82 ? "high" : "medium",
      interruptionMessage:
        "Hold on. You are avoiding impact again. What changed because of your work? A rough number is fine.",
    };
  }

  if (repeatedWeakClarity) {
    return {
      shouldInterrupt: true,
      severity: "medium",
      interruptionMessage:
        "Let me pause you there. This is still incomplete — give me the situation, your action, and the result in order.",
    };
  }

  return baseInterruption;
}

function buildRuntimeMemoryLine({
  previousMemory,
  updatedMemory,
  answerSignals,
  turnIndex,
}: {
  previousMemory: EmotionalMemoryState;
  updatedMemory: EmotionalMemoryState;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
  turnIndex: number;
}) {
  if (turnIndex < 2) return null;

  const previousWeaknesses = new Set(previousMemory.repeatedWeaknesses || []);
  const updatedWeaknesses = new Set(updatedMemory.repeatedWeaknesses || []);
  const previousSignals = new Set(
    (previousMemory.memories || [])
      .map((item) => item.signal)
      .filter((signal) =>
        signal === "vague_answer" ||
        signal === "missing_metrics" ||
        signal === "weak_clarity",
      ),
  );

  const hasPreviousPattern = (signal: "vague_answer" | "missing_metrics" | "weak_clarity") =>
    previousWeaknesses.has(signal) ||
    updatedWeaknesses.has(signal) ||
    previousSignals.has(signal);

  if (answerSignals.vague && hasPreviousPattern("vague_answer")) {
    return "I’m noticing the same pattern again — this is still too general. Give me one specific situation and what you personally did.";
  }

  if (answerSignals.missingMetrics && hasPreviousPattern("missing_metrics")) {
    return "Earlier you also avoided measurable impact. What changed because of your work? A rough number is fine.";
  }

  if (answerSignals.weakClarity && hasPreviousPattern("weak_clarity")) {
    return "This still feels incomplete. Walk me through the situation, your action, and the result in order.";
  }

  return getMemoryBasedRecruiterLine(updatedMemory);
}

function buildRuntimeRecoveryLine({
  previousMemory,
  answerSignals,
  score,
  turnIndex,
}: {
  previousMemory: EmotionalMemoryState;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
  score: number;
  turnIndex: number;
}) {
  if (turnIndex < 2) return null;

  const hadWeakPattern =
    hasPreviousWeakness(previousMemory, "vague_answer") ||
    hasPreviousWeakness(previousMemory, "missing_metrics") ||
    hasPreviousWeakness(previousMemory, "weak_clarity") ||
    previousMemory.trust < 60 ||
    previousMemory.confidence < 60;

  const recoveredWithEvidence =
    hadWeakPattern &&
    (answerSignals.strong || score >= 82) &&
    answerSignals.hasOwnership &&
    answerSignals.hasMetrics &&
    !answerSignals.vague;

  if (!recoveredWithEvidence) return null;

  return "That is stronger. This is the kind of evidence I was looking for.";
}

function buildContextAwareReactionLines({
  baseReactionLines,
  answerSignals,
  score,
}: {
  baseReactionLines: string[];
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
  score: number;
}) {
  if (answerSignals.concreteCustomerExample) {
    return [
      "Good, that is a real example.",
      "That shows patience and clear communication with a non-technical person.",
      "Now connect it to the role: how would you create longer-term impact after solving it?",
    ];
  }

  if (answerSignals.concreteTechnicalExample) {
    return [
      "That is more concrete.",
      "You translated a technical issue into simple steps for the customer.",
      "What did you do after resolving it so the learning was not lost?",
    ];
  }

  if (answerSignals.strong || score >= 85) {
    return [
      baseReactionLines[0] || "That is a strong example.",
      baseReactionLines[1] || "Good. That shows ownership.",
      baseReactionLines[2] || "That answer feels credible.",
    ];
  }

  return baseReactionLines;
}

function buildPressureAwareReactionLines({
  baseReactionLines,
  interruption,
  memoryLine,
  answerSignals,
}: {
  baseReactionLines: string[];
  interruption: InterruptionResult;
  memoryLine: string | null;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
}) {
  if (
    interruption.shouldInterrupt &&
    interruption.severity === "high" &&
    memoryLine &&
    answerSignals.vague
  ) {
    return [
      "Hold on — this is the same vague pattern again.",
      "I’m not hearing measurable impact yet.",
      "Give me the exact action and result.",
    ];
  }

  if (
    interruption.shouldInterrupt &&
    interruption.severity === "high" &&
    memoryLine &&
    answerSignals.missingMetrics
  ) {
    return [
      "Hold on — you are avoiding impact again.",
      "A rough number is better than no evidence.",
      "What changed because of your work?",
    ];
  }

  if (interruption.shouldInterrupt && interruption.severity === "medium") {
    return [
      baseReactionLines[0] || "Let me pause you there.",
      baseReactionLines[1] || "I need the answer to become more concrete.",
      baseReactionLines[2] || "Give me the action and the result.",
    ];
  }

  return baseReactionLines;
}

function determineRuntimeDecision({
  interruption,
  memoryLine,
  recoveryLine,
  mood,
  score,
  answerSignals,
  turnIndex,
}: {
  interruption: InterruptionResult;
  memoryLine: string | null;
  recoveryLine: string | null;
  mood: RecruiterRuntimeMood;
  score: number;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
  turnIndex: number;
}): RecruiterRuntimeDecision {
  // Strong recovery must override interruption.
  // If the candidate finally gives ownership + measurable evidence after a weak pattern,
  // the recruiter should acknowledge recovery instead of continuing to attack.
  const strongRecovery =
    Boolean(recoveryLine) &&
    answerSignals.strong &&
    answerSignals.hasMetrics &&
    answerSignals.hasOwnership;

  if (strongRecovery) return "recover";

  // Strict priority order after recovery. This prevents engines from competing.
  if (interruption.shouldInterrupt) return "interrupt";

  if (recoveryLine) return "recover";

  // Do not overuse memory callbacks in the first 1–2 turns.
  if (memoryLine && turnIndex >= 2) return "memory_callback";

  if (mood === "pressuring" || mood === "skeptical") return "challenge";
  if (mood === "recovering") return "recover";
  if (mood === "impressed" || answerSignals.strong || score >= 85) return "react";

  // Concrete spoken examples deserve a human acknowledgement and a deeper follow-up,
  // even when they do not include metrics yet. This prevents flat lines like "Okay, continue."
  if (answerSignals.concreteExample && answerSignals.hasOwnership) return "react";

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
  recoveringStrongly,
}: {
  score: number;
  interruption: InterruptionResult;
  memory: EmotionalMemoryState;
  missingMetrics: boolean;
  vague: boolean;
  weakClarity: boolean;
  tooLong: boolean;
  recoveringStrongly: boolean;
}): RecruiterRuntimeMood {
  if (recoveringStrongly) return "interested";
  if (score >= 85 && memory.trust >= 75) return "impressed";

  if (interruption.shouldInterrupt && interruption.severity === "high") {
    return "pressuring";
  }

  if (!tooLong && !vague && !weakClarity && memory.trust >= 55 && !missingMetrics) {
    return score >= 78 || memory.interest >= 72 ? "interested" : "neutral";
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
  if (answerSignals.concreteExample && answerSignals.hasOwnership) next -= 5;
  if (score >= 85 || answerSignals.strong) next -= 8;
  if (memory.trust < 45) next += 7;

  return clamp(next, 20, 95);
}

function chooseSuggestedLine({
  runtimeDecision,
  interruption,
  memoryLine,
  recoveryLine,
  reactionLines,
  mood,
  answerSignals,
}: {
  runtimeDecision: RecruiterRuntimeDecision;
  interruption: InterruptionResult;
  memoryLine: string | null;
  recoveryLine: string | null;
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

  if (runtimeDecision === "recover" && recoveryLine) {
    return recoveryLine;
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
    if (answerSignals.concreteCustomerExample) {
      return "Good, that is a real example. Now connect it to the role: what would you do after the fix to create longer-term impact?";
    }

    if (answerSignals.concreteTechnicalExample) {
      return "That is more concrete. You translated something technical for the customer. What did you do after resolving it?";
    }

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


function chooseMicroReaction({
  recruiterId,
  runtimeDecision,
  interruption,
  memoryLine,
  recoveryLine,
  mood,
  answerSignals,
  score,
}: {
  recruiterId: RecruiterRuntimePersonality;
  runtimeDecision: RecruiterRuntimeDecision;
  interruption: InterruptionResult;
  memoryLine: string | null;
  recoveryLine: string | null;
  mood: RecruiterRuntimeMood;
  answerSignals: ReturnType<typeof analyzeRuntimeAnswer>;
  score: number;
}) {
  const family = recruiterId;

  if (runtimeDecision === "interrupt" && interruption.severity === "high") {
    if (family === "friendly_hr") return memoryLine ? "Let me pause you there." : "Can I stop you for a second?";
    if (family === "startup_recruiter") return "Hold on.";
    if (family === "german_corporate") return "Please be precise.";
    return memoryLine ? "Hold on." : "Let me stop you there.";
  }

  if (runtimeDecision === "interrupt") {
    if (family === "friendly_hr") return "Let me pause you there.";
    if (family === "startup_recruiter") return "Wait.";
    if (family === "german_corporate") return "One moment.";
    return "Wait.";
  }

  if (runtimeDecision === "recover" || recoveryLine) {
    if (family === "friendly_hr") return "That’s better.";
    if (family === "startup_recruiter") return "Better.";
    if (family === "german_corporate") return "That is clearer.";
    return "That’s stronger.";
  }

  if (runtimeDecision === "memory_callback") {
    if (family === "friendly_hr") return "I’m noticing this again.";
    if (family === "startup_recruiter") return "Same pattern.";
    if (family === "german_corporate") return "This pattern is repeating.";
    return "I’m noticing a pattern.";
  }

  if (answerSignals.concreteExample && answerSignals.hasOwnership) {
    if (family === "friendly_hr") return "Good, I’m with you.";
    if (family === "startup_recruiter") return "Good.";
    if (family === "german_corporate") return "Good. That is specific.";
    return "Good.";
  }

  if (answerSignals.strong || score >= 85 || mood === "impressed") {
    if (family === "friendly_hr") return "That’s a strong example.";
    if (family === "startup_recruiter") return "Strong.";
    if (family === "german_corporate") return "That is a solid answer.";
    return "Strong.";
  }

  if (mood === "skeptical" || runtimeDecision === "challenge") {
    if (answerSignals.vague || answerSignals.missingMetrics) {
      if (family === "friendly_hr") return "Okay, let’s make that clearer.";
      if (family === "startup_recruiter") return "Get to the impact.";
      if (family === "german_corporate") return "Please be precise.";
      return "Hmm.";
    }

    if (family === "friendly_hr") return "I need a little more clarity.";
    if (family === "startup_recruiter") return "Not enough yet.";
    if (family === "german_corporate") return "That is not precise enough.";
    return "I’m not convinced yet.";
  }

  if (runtimeDecision === "probe") {
    if (family === "friendly_hr") return "Okay, let’s go deeper.";
    if (family === "startup_recruiter") return "Go deeper.";
    if (family === "german_corporate") return "Let’s structure this.";
    return "Okay.";
  }

  if (mood === "interested") {
    if (family === "friendly_hr") return "Interesting.";
    if (family === "startup_recruiter") return "Right.";
    if (family === "german_corporate") return "Understood.";
    return "Interesting.";
  }

  return null;
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
  if (answerSignals.concreteExample && answerSignals.hasOwnership) return "neutral_answer";
  if (answerSignals.tooLong) return "too_long";
  if (answerSignals.weakClarity) return "weak_clarity";
  if (answerSignals.vague) return "vague_answer";
  if (answerSignals.missingMetrics) return "missing_metrics";
  return "neutral_answer";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
