export type WorkZoRecruiterVisualState =
  | "listening"
  | "thinking"
  | "skeptical"
  | "interested"
  | "interrupting"
  | "typing_notes"
  | "waiting"
  | "recovering_connection";

export type WorkZoReactionIntensity = "soft" | "medium" | "strong";

export type WorkZoLiveReaction = {
  text: string;
  visualState: WorkZoRecruiterVisualState;
  trustDelta: number;
  intensity: WorkZoReactionIntensity;
};

export type WorkZoEmotionalMemory = {
  vagueAnswers: number;
  missingMetrics: number;
  unclearOwnership: number;
  nervousPauses: number;
  strongMoments: string[];
  weakMoments: string[];
  lastCallbackLine?: string;
};

export type WorkZoInterruptionDecision = {
  shouldInterrupt: boolean;
  line: string;
  reason: "too_generic" | "rambling" | "missing_metrics" | "unclear_ownership" | "none";
};

export function createWorkZoEmotionalMemory(): WorkZoEmotionalMemory {
  return {
    vagueAnswers: 0,
    missingMetrics: 0,
    unclearOwnership: 0,
    nervousPauses: 0,
    strongMoments: [],
    weakMoments: [],
  };
}

export function getWorkZoLiveReaction(answer: string): WorkZoLiveReaction {
  const clean = answer.replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();
  const wordCount = clean.split(" ").filter(Boolean).length;
  const hasMetric = /\d|percent|saved|reduced|increased|improved|faster|customers?|users?|tickets?|revenue|cost/i.test(clean);
  const hasOwnership = /\bi\b|\bmy\b|personally|owned|led|built|created|handled|resolved|implemented|improved/i.test(clean);
  const vague = /things|stuff|something|various|many|a lot|helped|worked on|good|nice/i.test(lower);

  if (wordCount > 120) {
    return {
      text: "Let me stop you there — give me the core result.",
      visualState: "interrupting",
      trustDelta: -2,
      intensity: "strong",
    };
  }

  if (wordCount > 18 && !hasMetric) {
    return {
      text: "Okay… but I need numbers or measurable impact.",
      visualState: "skeptical",
      trustDelta: -2,
      intensity: "medium",
    };
  }

  if (wordCount > 18 && !hasOwnership) {
    return {
      text: "I’m not clear what you personally owned there.",
      visualState: "skeptical",
      trustDelta: -1,
      intensity: "medium",
    };
  }

  if (vague) {
    return {
      text: "That still sounds a little general.",
      visualState: "thinking",
      trustDelta: -1,
      intensity: "soft",
    };
  }

  if (hasMetric && hasOwnership) {
    return {
      text: "Good — that gives me something concrete to evaluate.",
      visualState: "interested",
      trustDelta: 2,
      intensity: "medium",
    };
  }

  return {
    text: "Hmm. Go on.",
    visualState: "listening",
    trustDelta: 0,
    intensity: "soft",
  };
}

export function updateWorkZoEmotionalMemory(
  memory: WorkZoEmotionalMemory,
  answer: string,
): WorkZoEmotionalMemory {
  const reaction = getWorkZoLiveReaction(answer);
  const next: WorkZoEmotionalMemory = {
    ...memory,
    strongMoments: [...memory.strongMoments],
    weakMoments: [...memory.weakMoments],
  };

  if (/general|vague/i.test(reaction.text)) next.vagueAnswers += 1;
  if (/numbers|measurable|impact/i.test(reaction.text)) next.missingMetrics += 1;
  if (/personally|owned/i.test(reaction.text)) next.unclearOwnership += 1;

  if (reaction.trustDelta > 0) {
    next.strongMoments = [reaction.text, ...next.strongMoments].slice(0, 5);
  }

  if (reaction.trustDelta < 0) {
    next.weakMoments = [reaction.text, ...next.weakMoments].slice(0, 5);
  }

  if (next.missingMetrics >= 2) {
    next.lastCallbackLine = "Earlier you also avoided giving numbers, so I want you to be specific now.";
  } else if (next.unclearOwnership >= 2) {
    next.lastCallbackLine = "You have mentioned team outcomes a few times, but I still need your personal contribution.";
  } else if (next.vagueAnswers >= 2) {
    next.lastCallbackLine = "I’m noticing a pattern: your answers are still staying too high-level.";
  }

  return next;
}

export function decideWorkZoInterruption(answer: string): WorkZoInterruptionDecision {
  const clean = answer.replace(/\s+/g, " ").trim();
  const wordCount = clean.split(" ").filter(Boolean).length;
  const hasMetric = /\d|percent|saved|reduced|increased|improved|faster|customers?|users?|tickets?/i.test(clean);
  const hasOwnership = /\bi\b|\bmy\b|personally|owned|led|built|created|handled|resolved|implemented/i.test(clean);
  const tooGeneric = /things|stuff|various|many|a lot|helped|worked on/i.test(clean.toLowerCase());

  if (wordCount > 140) {
    return { shouldInterrupt: true, line: "Sorry to interrupt — what was the actual result?", reason: "rambling" };
  }
  if (wordCount > 35 && !hasMetric) {
    return { shouldInterrupt: true, line: "Let me stop you there. Give me one number or measurable result.", reason: "missing_metrics" };
  }
  if (wordCount > 35 && !hasOwnership) {
    return { shouldInterrupt: true, line: "Hold on — what did you personally do?", reason: "unclear_ownership" };
  }
  if (tooGeneric) {
    return { shouldInterrupt: true, line: "That is too general. Give me a specific example.", reason: "too_generic" };
  }
  return { shouldInterrupt: false, line: "", reason: "none" };
}
