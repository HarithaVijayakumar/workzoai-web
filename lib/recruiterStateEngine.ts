export type RecruiterMood =
  | "warm"
  | "curious"
  | "analytical"
  | "skeptical"
  | "impatient"
  | "disengaged"
  | "impressed";

export type RecruiterState = {
  trust: number;
  patience: number;
  skepticism: number;
  engagement: number;
  pressure: number;
  warmth: number;
  confidenceInCandidate: number;
  mood: RecruiterMood;
  turns: number;
  weakAnswerStreak: number;
  strongAnswerStreak: number;
};

export type RecruiterPersonalityConfig = {
  id: string;
  displayName: string;
  warmth: number;
  skepticism: number;
  patience: number;
  pressure: number;
  interruptionTolerance: number;
  pressureStyle: "friendly_hr" | "analytical_hiring_manager" | "startup_recruiter" | "corporate_recruiter" | "realistic";
};

export const RECRUITER_PERSONALITIES: Record<string, RecruiterPersonalityConfig> = {
  sarah: { id: "sarah", displayName: "Sarah", warmth: 78, skepticism: 34, patience: 76, pressure: 34, interruptionTolerance: 72, pressureStyle: "friendly_hr" },
  daniel: { id: "daniel", displayName: "Daniel", warmth: 48, skepticism: 72, patience: 56, pressure: 62, interruptionTolerance: 48, pressureStyle: "analytical_hiring_manager" },
  priya: { id: "priya", displayName: "Priya", warmth: 62, skepticism: 58, patience: 52, pressure: 66, interruptionTolerance: 54, pressureStyle: "startup_recruiter" },
  markus: { id: "markus", displayName: "Markus", warmth: 36, skepticism: 82, patience: 45, pressure: 74, interruptionTolerance: 38, pressureStyle: "corporate_recruiter" },
  realistic: { id: "realistic", displayName: "Recruiter", warmth: 52, skepticism: 60, patience: 58, pressure: 58, interruptionTolerance: 55, pressureStyle: "realistic" },
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function normalizeRecruiterPersonality(value?: string) {
  const raw = (value || "realistic").toLowerCase();
  if (raw.includes("sarah") || raw.includes("friendly")) return RECRUITER_PERSONALITIES.sarah;
  if (raw.includes("daniel") || raw.includes("analytical") || raw.includes("hiring")) return RECRUITER_PERSONALITIES.daniel;
  if (raw.includes("priya") || raw.includes("startup")) return RECRUITER_PERSONALITIES.priya;
  if (raw.includes("markus") || raw.includes("german") || raw.includes("corporate")) return RECRUITER_PERSONALITIES.markus;
  return RECRUITER_PERSONALITIES.realistic;
}

export function createInitialRecruiterState(personality?: string): RecruiterState {
  const profile = normalizeRecruiterPersonality(personality);
  return {
    trust: clamp(58 + (profile.warmth - profile.skepticism) * 0.08),
    patience: profile.patience,
    skepticism: profile.skepticism,
    engagement: 58,
    pressure: profile.pressure,
    warmth: profile.warmth,
    confidenceInCandidate: 55,
    mood: profile.skepticism > 70 ? "analytical" : "curious",
    turns: 0,
    weakAnswerStreak: 0,
    strongAnswerStreak: 0,
  };
}

export type RecruiterStateDelta = {
  trust?: number;
  patience?: number;
  skepticism?: number;
  engagement?: number;
  pressure?: number;
  warmth?: number;
  confidenceInCandidate?: number;
  weakAnswer?: boolean;
  strongAnswer?: boolean;
};

export function updateRecruiterState(current: RecruiterState, delta: RecruiterStateDelta): RecruiterState {
  const weakAnswerStreak = delta.weakAnswer ? current.weakAnswerStreak + 1 : delta.strongAnswer ? 0 : current.weakAnswerStreak;
  const strongAnswerStreak = delta.strongAnswer ? current.strongAnswerStreak + 1 : delta.weakAnswer ? 0 : current.strongAnswerStreak;

  const next: RecruiterState = {
    ...current,
    trust: clamp(current.trust + (delta.trust || 0)),
    patience: clamp(current.patience + (delta.patience || 0)),
    skepticism: clamp(current.skepticism + (delta.skepticism || 0)),
    engagement: clamp(current.engagement + (delta.engagement || 0)),
    pressure: clamp(current.pressure + (delta.pressure || 0)),
    warmth: clamp(current.warmth + (delta.warmth || 0)),
    confidenceInCandidate: clamp(current.confidenceInCandidate + (delta.confidenceInCandidate || 0)),
    turns: current.turns + 1,
    weakAnswerStreak,
    strongAnswerStreak,
    mood: current.mood,
  };

  next.mood = deriveRecruiterMood(next);
  return next;
}

export function deriveRecruiterMood(state: RecruiterState): RecruiterMood {
  if (state.trust >= 78 && state.engagement >= 70) return "impressed";
  if (state.trust <= 30 || state.engagement <= 24) return "disengaged";
  if (state.patience <= 28 || state.weakAnswerStreak >= 3) return "impatient";
  if (state.skepticism >= 72 || state.pressure >= 72) return "skeptical";
  if (state.skepticism >= 55) return "analytical";
  if (state.warmth >= 68) return "warm";
  return "curious";
}

export function moodInstruction(mood: RecruiterMood) {
  switch (mood) {
    case "impressed": return "Recruiter is engaged and slightly impressed. Ask a deeper follow-up, but do not overpraise.";
    case "disengaged": return "Recruiter is losing confidence. Become brief, direct, and skeptical. Do not coach.";
    case "impatient": return "Recruiter is impatient. Interrupt rambling, ask for a direct answer, and reduce warmth.";
    case "skeptical": return "Recruiter is skeptical. Probe for proof, numbers, ownership, and contradictions.";
    case "analytical": return "Recruiter is analytical. Ask structured follow-ups and evaluate evidence carefully.";
    case "warm": return "Recruiter is warm but still professional. Encourage clarity without sounding like a coach.";
    default: return "Recruiter is curious and professional. Ask one focused follow-up.";
  }
}
