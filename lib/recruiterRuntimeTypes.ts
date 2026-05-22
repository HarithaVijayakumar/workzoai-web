export type RecruiterMood =
  | "neutral"
  | "interested"
  | "skeptical"
  | "pressuring"
  | "impressed"
  | "recovering";

export type RecruiterVisualState =
  | "listening"
  | "thinking"
  | "reacting"
  | "interrupting"
  | "typing_notes"
  | "waiting"
  | "recovering_connection";

export type RecruiterSignal =
  | "strong_answer"
  | "vague_answer"
  | "missing_metrics"
  | "weak_confidence"
  | "too_long"
  | "clear_ownership"
  | "connection_issue";

export type RecruiterRuntimeSnapshot = {
  mood: RecruiterMood;
  visualState: RecruiterVisualState;
  trust: number;
  confidence: number;
  interest: number;
  pressureLevel: number;
  lastSignal?: RecruiterSignal;
  lastLine?: string;
};