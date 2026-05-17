"use client";

export type RecruiterState =
  | "neutral"
  | "interested"
  | "engaged"
  | "skeptical"
  | "pressuring"
  | "losing_confidence"
  | "recovering_trust";

export type RecruiterMemory = {
  weakMetrics: number;
  vagueAnswers: number;
  ownershipIssues: number;
  confidenceDrops: number;
  strongRecoveries: number;
  recruiterTrust: number;
  lastReaction: string;
  rememberedWeaknesses: string[];
  rememberedStrengths: string[];
};

export type RecruiterSignals = {
  recruiterTrust: number;
  recruiterState: RecruiterState;
  ownershipClarity: number;
  impactEvidence: number;
  pressureHandling: number;
  recoveryAbility: number;
  hiringSignal: number;
  reaction: string;
  followUp: string;
  memory: RecruiterMemory;
};

export const DEFAULT_RECRUITER_MEMORY: RecruiterMemory = {
  weakMetrics: 0,
  vagueAnswers: 0,
  ownershipIssues: 0,
  confidenceDrops: 0,
  strongRecoveries: 0,
  recruiterTrust: 58,
  lastReaction: "Ready to evaluate the answer.",
  rememberedWeaknesses: [],
  rememberedStrengths: [],
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function createInitialRecruiterMemory(): RecruiterMemory {
  return { ...DEFAULT_RECRUITER_MEMORY };
}

export function loadRecruiterMemory(): RecruiterMemory {
  if (typeof window === "undefined") return createInitialRecruiterMemory();

  try {
    const raw = window.localStorage.getItem("workzo-recruiter-memory");
    if (!raw) return createInitialRecruiterMemory();

    return {
      ...createInitialRecruiterMemory(),
      ...(JSON.parse(raw) as Partial<RecruiterMemory>),
    };
  } catch {
    return createInitialRecruiterMemory();
  }
}

export function saveRecruiterMemory(memory: RecruiterMemory) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem("workzo-recruiter-memory", JSON.stringify(memory));
  } catch {
    // ignore
  }
}

export function resetLiveInterviewState() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem("workzo-live-transcript");
    window.localStorage.removeItem("workzo-live-state");
  } catch {
    // ignore
  }
}

export function detectAnswerSignals(answer: string) {
  const text = answer.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const hasMetric =
    /\d+%|\d+\s*(users|customers|tickets|hours|days|weeks|months|cases|incidents|people|team|calls|requests|minutes|seconds)/i.test(
      text,
    );
  const hasOwnership =
    /\b(i|my|owned|led|built|created|implemented|coordinated|resolved|improved|reduced|handled|designed|managed|delivered)\b/i.test(
      text,
    );
  const hasSTAR =
    /\bsituation\b|\btask\b|\baction\b|\bresult\b|\bchallenge\b|\boutcome\b|\bimpact\b|\bbecause\b|\bso i\b/i.test(
      text,
    );
  const vague =
    wordCount < 28 ||
    /\b(various|many things|etc|stuff|some tasks|helped with|worked on things|responsible for things|involved in)\b/i.test(
      lower,
    );
  const rambling = wordCount > 150 || text.length > 850;
  const fillerCount = (lower.match(/\b(um|uh|like|basically|actually|you know|kind of|sort of)\b/g) || []).length;

  return {
    wordCount,
    hasMetric,
    hasOwnership,
    hasSTAR,
    vague,
    rambling,
    fillerCount,
  };
}

export function updateRecruiterMemory(memory: RecruiterMemory, answer: string): RecruiterSignals {
  const signals = detectAnswerSignals(answer);
  const next: RecruiterMemory = {
    ...memory,
    rememberedWeaknesses: [...memory.rememberedWeaknesses],
    rememberedStrengths: [...memory.rememberedStrengths],
  };

  let trustDelta = 0;
  let recruiterState: RecruiterState = "neutral";
  let reaction = "Okay. I need a little more evidence.";
  let followUp = "What was the actual impact?";

  if (!signals.hasMetric) {
    next.weakMetrics += 1;
    trustDelta -= 7;
    next.rememberedWeaknesses.push("Missing measurable impact");
  }

  if (!signals.hasOwnership) {
    next.ownershipIssues += 1;
    trustDelta -= 6;
    next.rememberedWeaknesses.push("Unclear personal ownership");
  }

  if (signals.vague) {
    next.vagueAnswers += 1;
    trustDelta -= 8;
    next.confidenceDrops += 1;
    next.rememberedWeaknesses.push("Answer sounded too vague");
  }

  if (signals.rambling) {
    trustDelta -= 5;
    next.rememberedWeaknesses.push("Answer was too long");
  }

  if (signals.hasMetric && signals.hasOwnership && signals.hasSTAR) {
    trustDelta += 14;
    next.strongRecoveries += 1;
    next.rememberedStrengths.push("Clear ownership with measurable proof");
  } else if (signals.hasMetric || signals.hasOwnership) {
    trustDelta += 5;
    next.rememberedStrengths.push(
      signals.hasMetric ? "Some impact evidence appeared" : "Some ownership signal appeared",
    );
  }

  next.recruiterTrust = clamp(next.recruiterTrust + trustDelta);

  if (next.recruiterTrust >= 78 && trustDelta > 0) {
    recruiterState = "engaged";
    reaction = "Interesting. That gives me stronger signal.";
    followUp = "Go one level deeper. What decision did you personally make?";
  } else if (trustDelta > 8) {
    recruiterState = "recovering_trust";
    reaction = "That is a better answer. Now I can see more proof.";
    followUp = "Can you connect that result directly to this role?";
  } else if (next.recruiterTrust <= 42) {
    recruiterState = "losing_confidence";
    reaction = "I am losing confidence here. This is still not concrete enough.";
    followUp = "Give me one specific example with a measurable result.";
  } else if (trustDelta < -8) {
    recruiterState = "pressuring";
    reaction = "That is still too broad.";
    followUp = "What exactly did YOU own, and how did you measure success?";
  } else if (trustDelta < 0) {
    recruiterState = "skeptical";
    reaction = "Hmm. I need more proof before I trust that answer.";
    followUp = signals.rambling
      ? "Summarize the actual impact in one sentence."
      : "Can you give me numbers or a concrete example?";
  } else {
    recruiterState = "interested";
    reaction = "Okay. There is some useful signal here.";
    followUp = "What was the hardest part of that situation?";
  }

  next.lastReaction = reaction;
  next.rememberedWeaknesses = Array.from(new Set(next.rememberedWeaknesses)).slice(-5);
  next.rememberedStrengths = Array.from(new Set(next.rememberedStrengths)).slice(-5);

  const ownershipClarity = clamp(50 + (signals.hasOwnership ? 28 : -18) + (signals.vague ? -12 : 0));
  const impactEvidence = clamp(46 + (signals.hasMetric ? 34 : -22));
  const pressureHandling = clamp(54 + (signals.rambling ? -18 : 8) + (signals.hasSTAR ? 8 : 0));
  const recoveryAbility = clamp(48 + next.strongRecoveries * 12 - next.confidenceDrops * 5);
  const hiringSignal = clamp((next.recruiterTrust + ownershipClarity + impactEvidence + pressureHandling) / 4);

  return {
    recruiterTrust: next.recruiterTrust,
    recruiterState,
    ownershipClarity,
    impactEvidence,
    pressureHandling,
    recoveryAbility,
    hiringSignal,
    reaction,
    followUp,
    memory: next,
  };
}

export function recruiterStateLabel(state: RecruiterState) {
  const labels: Record<RecruiterState, string> = {
    neutral: "Neutral",
    interested: "Interested",
    engaged: "Engaged",
    skeptical: "Skeptical",
    pressuring: "Pressuring",
    losing_confidence: "Losing confidence",
    recovering_trust: "Recovering trust",
  };

  return labels[state];
}

export function recruiterStateClass(state: RecruiterState) {
  if (state === "engaged" || state === "interested" || state === "recovering_trust") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  }

  if (state === "skeptical" || state === "pressuring") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-200";
  }

  if (state === "losing_confidence") {
    return "border-red-300/20 bg-red-400/10 text-red-200";
  }

  return "border-cyan-300/20 bg-cyan-400/10 text-cyan-200";
}

export function buildOpeningWowMoment({
  recruiterName,
  role,
  cvText,
}: {
  recruiterName: string;
  role: string;
  cvText: string;
}) {
  const lower = cvText.toLowerCase();

  const evidence = [
    lower.includes("support") && "support/customer-facing experience",
    lower.includes("data") && "data-related exposure",
    lower.includes("sql") && "SQL signal",
    lower.includes("python") && "Python signal",
    lower.includes("ticket") && "ticketing or service workflow experience",
    lower.includes("project") && "project experience",
  ].filter(Boolean);

  const noticed = evidence.length
    ? evidence.slice(0, 2).join(" and ")
    : "your background";

  return `${recruiterName} already reviewed your CV. ${recruiterName} noticed ${noticed} and will test whether you can prove measurable impact for ${role}.`;
}

export function buildShortRecruiterPromptRules() {
  return `
VOICE REALISM RULES:
- Keep recruiter responses to 1-3 short sentences.
- Use natural micro-reactions: "Hmm.", "Okay.", "Interesting.", "Go deeper."
- If the candidate rambles, interrupt politely and ask for one-sentence impact.
- If the answer is vague, become shorter and more skeptical.
- If the answer is strong, become more engaged and ask a deeper follow-up.
- Never give long coaching paragraphs during the interview.
- Sound like a real recruiter evaluating the candidate, not an assistant.
`.trim();
}
