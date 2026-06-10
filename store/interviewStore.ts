import { create } from "zustand";
import { persist } from "zustand/middleware";

export type InterviewMode = "text" | "voice";
export type Speaker = "user" | "recruiter" | "system";

export type VapiStatus =
  | "idle"
  | "starting"
  | "active"
  | "ending"
  | "ended"
  | "error";

export type TranscriptItem = {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: number;
};

export type RecruiterMemoryItem = {
  id: string;
  label: string;
  value: string;
  importance: "low" | "medium" | "high";
};

export type LiveScore = {
  clarity: number;
  relevance: number;
  confidence: number;
  structure: number;
  evidence: number;
  overall: number;
  // Extended to align with RecruiterSignalState in interview/page.tsx
  trust?: number;
  interest?: number;
  communication?: number;
  mood?: "Impressed" | "Engaged" | "Neutral" | "Concerned" | "Doubtful";
};

export type AnswerQuality = "weak" | "average" | "strong" | "excellent";
export type FailureSeverity = "low" | "medium" | "high" | "critical";

export type FailureAnalyticsEvent = {
  id: string;
  eventName: string;
  severity: FailureSeverity;
  message?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
};

export type InterviewRecoverySnapshot = {
  id: string;
  sessionId: string | null;
  mode: InterviewMode;
  vapiStatus: VapiStatus;
  setup: InterviewSetup;
  currentQuestion: string;
  lastUserAnswer: string;
  transcript: TranscriptItem[];
  recruiterMemory: RecruiterMemoryItem[];
  liveScore: LiveScore;
  pressureLevel: number;
  emotionState: string;
  startedAt: number | null;
  updatedAt: number;
};

export type InterviewSetup = {
  targetRole: string;
  targetMarket: string;
  companyStyle: string;
  recruiterPersonality: string;
  cvText: string;
  jobDescription: string;
  // Extended fields used by interview/page.tsx
  candidateName?: string;
  targetCompany?: string;
  recruiterId?: string;
  recruiterName?: string;
  recruiterTitle?: string;
  recruiterImage?: string;
  language?: string;
};

export type PersistentPattern = {
  id: string;
  label: string;
  count: number;
  lastSeenAt: number;
  severity: "low" | "medium" | "high";
};

export type AnswerHistoryItem = {
  id: string;
  answer: string;
  mode: InterviewMode;
  score: LiveScore;
  quality: AnswerQuality;
  detectedPatterns: string[];
  emotionState: string;
  pressureLevel: number;
  timestamp: number;
};

export type InterruptionHistoryItem = {
  id: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: number;
};

export type EmotionTimelineItem = {
  id: string;
  emotion: string;
  pressureLevel: number;
  timestamp: number;
};

type InterviewState = {
  sessionId: string | null;
  mode: InterviewMode;
  vapiStatus: VapiStatus;
  vapiError: string | null;

  setup: InterviewSetup;

  currentQuestion: string;
  lastUserAnswer: string;
  transcript: TranscriptItem[];
  recruiterMemory: RecruiterMemoryItem[];

  liveScore: LiveScore;
  pressureLevel: number;
  emotionState: string;

  startedAt: number | null;
  endedAt: number | null;

  persistentPatterns: PersistentPattern[];
  answerHistory: AnswerHistoryItem[];
  interruptionHistory: InterruptionHistoryItem[];
  emotionTimeline: EmotionTimelineItem[];
  recruiterTrustHistory: number[];
  failureAnalytics: FailureAnalyticsEvent[];
  errorEvents: FailureAnalyticsEvent[];
  recoverySnapshot: InterviewRecoverySnapshot | null;
  recoveryAvailable: boolean;

  setMode: (mode: InterviewMode) => void;
  setVapiStatus: (status: VapiStatus) => void;
  setVapiError: (error: string | null) => void;

  updateSetup: (setup: Partial<InterviewSetup>) => void;

  startSession: () => void;
  endSession: () => void;
  resetSession: () => void;

  setCurrentQuestion: (question: string) => void;
  setLastUserAnswer: (answer: string) => void;

  addTranscript: (item: Omit<TranscriptItem, "id" | "timestamp">) => void;
  clearTranscript: () => void;

  addRecruiterMemory: (item: Omit<RecruiterMemoryItem, "id">) => void;
  setRecruiterMemory: (items: RecruiterMemoryItem[]) => void;

  updateLiveScore: (score: Partial<LiveScore>) => void;
  setPressureLevel: (level: number) => void;
  setEmotionState: (state: string) => void;

  recordAnswerHistory: (answer: string, mode: InterviewMode) => void;
  recordInterruption: (
    message: string,
    severity: "low" | "medium" | "high"
  ) => void;
  recordPersistentPattern: (
    label: string,
    severity?: "low" | "medium" | "high"
  ) => void;
  clearPersistentMemory: () => void;

  recordFailureEvent: (
    eventName: string,
    severity?: FailureSeverity,
    message?: string,
    metadata?: Record<string, unknown>
  ) => void;
  recordErrorEvent: (
    eventName: string,
    error: unknown,
    metadata?: Record<string, unknown>,
    severity?: FailureSeverity
  ) => void;
  saveRecoverySnapshot: () => void;
  restoreRecoverySnapshot: () => void;
  discardRecoverySnapshot: () => void;
};

const defaultScore: LiveScore = {
  clarity: 0,
  relevance: 0,
  confidence: 0,
  structure: 0,
  evidence: 0,
  overall: 0,
};

const defaultSetup: InterviewSetup = {
  targetRole: "",
  targetMarket: "Global",
  companyStyle: "Realistic",
  recruiterPersonality: "analytical_hiring_manager",
  cvText: "",
  jobDescription: "",
};

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function detectPatterns(answer: string): string[] {
  const text = answer.toLowerCase();
  const patterns: string[] = [];
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  const hasMetrics =
    text.includes("%") ||
    text.includes("impact") ||
    text.includes("result") ||
    text.includes("improved") ||
    text.includes("reduced") ||
    text.includes("increased") ||
    text.includes("saved") ||
    text.includes("users") ||
    text.includes("customers") ||
    text.includes("tickets");

  if (!hasMetrics) {
    patterns.push("Avoids measurable impact");
  }

  if (
    text.includes("maybe") ||
    text.includes("i think") ||
    text.includes("probably") ||
    text.includes("not sure") ||
    text.includes("kind of")
  ) {
    patterns.push("Uses uncertain language");
  }

  if (
    text.includes("hardworking") ||
    text.includes("quick learner") ||
    text.includes("team player") ||
    text.includes("passionate")
  ) {
    patterns.push("Uses generic interview claims");
  }

  if (!text.includes("i ") && !text.includes("my ") && !text.includes("me ")) {
    patterns.push("Weak ownership signal");
  }

  if (wordCount < 25) {
    patterns.push("Answers too briefly");
  }

  return patterns;
}

function detectAnswerQuality(answer: string, patterns: string[]): AnswerQuality {
  const text = answer.toLowerCase();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const hasMetric =
    /\d|%|percent|impact|result|improved|reduced|increased|saved|users|customers|tickets|revenue|cost|time|quality|sla|csat|nps/i.test(text);
  const hasOwnership = /\b(i|my|me|personally|owned|built|handled|created|led|resolved|analyzed|implemented|managed|supported)\b/i.test(text);
  const hasOutcome = /\b(result|impact|outcome|after|therefore|which led|improved|reduced|increased|saved|resolved|delivered|achieved)\b/i.test(text);

  if (patterns.includes("Answers too briefly") || patterns.includes("Uses generic interview claims")) return "weak";
  if (hasMetric && hasOwnership && hasOutcome && wordCount >= 35) return "excellent";
  if ((hasMetric && hasOwnership) || (hasOwnership && hasOutcome)) return "strong";
  return "average";
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      mode: "text",
      vapiStatus: "idle",
      vapiError: null,

      setup: defaultSetup,

      currentQuestion: "",
      lastUserAnswer: "",
      transcript: [],
      recruiterMemory: [],

      liveScore: defaultScore,
      pressureLevel: 35,
      emotionState: "neutral",

      startedAt: null,
      endedAt: null,

      persistentPatterns: [],
      answerHistory: [],
      interruptionHistory: [],
      emotionTimeline: [],
      recruiterTrustHistory: [],
      failureAnalytics: [],
      errorEvents: [],
      recoverySnapshot: null,
      recoveryAvailable: false,

      setMode: (mode) => set({ mode }),
      setVapiStatus: (status) => set({ vapiStatus: status }),

      setVapiError: (error) =>
        set((state) => ({
          vapiError: error,
          vapiStatus: error ? "error" : state.vapiStatus,
        })),

      updateSetup: (setup) =>
        set((state) => ({
          setup: {
            ...state.setup,
            ...setup,
          },
        })),

      startSession: () =>
        set({
          sessionId: createId("session"),
          startedAt: Date.now(),
          endedAt: null,
          vapiError: null,
          vapiStatus: "idle",
          transcript: [],
          recruiterMemory: [],
          liveScore: defaultScore,
          pressureLevel: 35,
          emotionState: "neutral",
          currentQuestion: "",
          lastUserAnswer: "",
        }),

      endSession: () =>
        set({
          endedAt: Date.now(),
          vapiStatus: "ended",
        }),

      resetSession: () =>
        set({
          sessionId: null,
          mode: "text",
          vapiStatus: "idle",
          vapiError: null,
          setup: defaultSetup,
          currentQuestion: "",
          lastUserAnswer: "",
          transcript: [],
          recruiterMemory: [],
          liveScore: defaultScore,
          pressureLevel: 35,
          emotionState: "neutral",
          startedAt: null,
          endedAt: null,
        }),

      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setLastUserAnswer: (answer) => set({ lastUserAnswer: answer }),

      addTranscript: (item) =>
        set((state) => {
          const last = state.transcript[state.transcript.length - 1];

          if (
            last &&
            last.speaker === item.speaker &&
            normalize(last.text) === normalize(item.text)
          ) {
            return { transcript: state.transcript };
          }

          return {
            transcript: [
              ...state.transcript,
              {
                ...item,
                id: createId("msg"),
                timestamp: Date.now(),
              },
            ].slice(-40),
          };
        }),

      clearTranscript: () => set({ transcript: [] }),

      addRecruiterMemory: (item) =>
        set((state) => {
          const normalizedLabel = normalize(item.label);
          const normalizedValue = normalize(item.value);

          const alreadyExists = state.recruiterMemory.some(
            (memory) =>
              normalize(memory.label) === normalizedLabel &&
              normalize(memory.value) === normalizedValue
          );

          if (alreadyExists) {
            return {
              recruiterMemory: state.recruiterMemory,
            };
          }

          const sameLabelIndex = state.recruiterMemory.findIndex(
            (memory) => normalize(memory.label) === normalizedLabel
          );

          if (sameLabelIndex !== -1) {
            const updatedMemory = [...state.recruiterMemory];

            updatedMemory[sameLabelIndex] = {
              ...updatedMemory[sameLabelIndex],
              value: item.value,
              importance: item.importance,
            };

            return {
              recruiterMemory: updatedMemory.slice(-12),
            };
          }

          return {
            recruiterMemory: [
              ...state.recruiterMemory,
              {
                ...item,
                id: createId("memory"),
              },
            ].slice(-12),
          };
        }),

      setRecruiterMemory: (items) =>
        set({
          recruiterMemory: items.slice(-12),
        }),

      updateLiveScore: (score) =>
        set((state) => {
          const nextScore: LiveScore = {
            clarity: clampScore(score.clarity ?? state.liveScore.clarity),
            relevance: clampScore(score.relevance ?? state.liveScore.relevance),
            confidence: clampScore(
              score.confidence ?? state.liveScore.confidence
            ),
            structure: clampScore(score.structure ?? state.liveScore.structure),
            evidence: clampScore(score.evidence ?? state.liveScore.evidence),
            overall: clampScore(score.overall ?? state.liveScore.overall),
          };

          return {
            liveScore: nextScore,
            recruiterTrustHistory: [
              ...state.recruiterTrustHistory,
              nextScore.overall,
            ].slice(-40),
          };
        }),

      setPressureLevel: (level) =>
        set((state) => {
          const nextPressure = Math.max(0, Math.min(100, Math.round(level)));

          return {
            pressureLevel: nextPressure,
            emotionTimeline: [
              ...state.emotionTimeline,
              {
                id: createId("emotion"),
                emotion: state.emotionState,
                pressureLevel: nextPressure,
                timestamp: Date.now(),
              },
            ].slice(-40),
          };
        }),

      setEmotionState: (emotion) =>
        set((state) => ({
          emotionState: emotion,
          emotionTimeline: [
            ...state.emotionTimeline,
            {
              id: createId("emotion"),
              emotion,
              pressureLevel: state.pressureLevel,
              timestamp: Date.now(),
            },
          ].slice(-40),
        })),

      recordAnswerHistory: (answer, mode) => {
        const detectedPatterns = detectPatterns(answer);
        const quality = detectAnswerQuality(answer, detectedPatterns);

        detectedPatterns.forEach((pattern) => {
          get().recordPersistentPattern(pattern, "medium");
        });

        if (quality === "weak") {
          get().recordFailureEvent("weak_answer_detected", "medium", "Weak answer detected", {
            patterns: detectedPatterns,
          });
        }

        set((state) => ({
          answerHistory: [
            ...state.answerHistory,
            {
              id: createId("answer"),
              answer,
              mode,
              score: state.liveScore,
              quality,
              detectedPatterns,
              emotionState: state.emotionState,
              pressureLevel: state.pressureLevel,
              timestamp: Date.now(),
            },
          ].slice(-40),
        }));
      },

      recordInterruption: (message, severity) =>
        set((state) => {
          const last =
            state.interruptionHistory[state.interruptionHistory.length - 1];

          if (last && normalize(last.message) === normalize(message)) {
            return {
              interruptionHistory: state.interruptionHistory,
            };
          }

          return {
            interruptionHistory: [
              ...state.interruptionHistory,
              {
                id: createId("interrupt"),
                message,
                severity,
                timestamp: Date.now(),
              },
            ].slice(-40),
          };
        }),

      recordPersistentPattern: (label, severity = "medium") =>
        set((state) => {
          const normalizedLabel = normalize(label);

          const existing = state.persistentPatterns.find(
            (item) => normalize(item.label) === normalizedLabel
          );

          if (existing) {
            return {
              persistentPatterns: state.persistentPatterns.map((item) =>
                normalize(item.label) === normalizedLabel
                  ? {
                      ...item,
                      count: item.count + 1,
                      severity,
                      lastSeenAt: Date.now(),
                    }
                  : item
              ),
            };
          }

          return {
            persistentPatterns: [
              ...state.persistentPatterns,
              {
                id: createId("pattern"),
                label,
                count: 1,
                severity,
                lastSeenAt: Date.now(),
              },
            ].slice(-30),
          };
        }),

      clearPersistentMemory: () =>
        set({
          persistentPatterns: [],
          answerHistory: [],
          interruptionHistory: [],
          emotionTimeline: [],
          recruiterTrustHistory: [],
        }),

      recordFailureEvent: (eventName, severity = "medium", message, metadata) =>
        set((state) => ({
          failureAnalytics: [
            {
              id: createId("failure"),
              eventName,
              severity,
              message,
              metadata,
              timestamp: Date.now(),
            },
            ...state.failureAnalytics,
          ].slice(0, 200),
        })),

      saveResultToDb: async (sessionData: Record<string, unknown>) => {
        try {
          await fetch("/api/db/interview-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sessionData),
          });
        } catch {
          // Fire-and-forget: localStorage is the fallback read source.
        }
      },

      recordErrorEvent: (eventName, error, metadata, severity = "medium") => {
        const message = normalizeError(error);

        set((state) => ({
          errorEvents: [
            {
              id: createId("error"),
              eventName,
              severity,
              message,
              metadata,
              timestamp: Date.now(),
            },
            ...state.errorEvents,
          ].slice(0, 200),
          failureAnalytics: [
            {
              id: createId("failure"),
              eventName,
              severity,
              message,
              metadata,
              timestamp: Date.now(),
            },
            ...state.failureAnalytics,
          ].slice(0, 200),
        }));
      },

      saveRecoverySnapshot: () =>
        set((state) => ({
          recoverySnapshot: {
            id: createId("snapshot"),
            sessionId: state.sessionId,
            mode: state.mode,
            vapiStatus: state.vapiStatus,
            setup: state.setup,
            currentQuestion: state.currentQuestion,
            lastUserAnswer: state.lastUserAnswer,
            transcript: state.transcript,
            recruiterMemory: state.recruiterMemory,
            liveScore: state.liveScore,
            pressureLevel: state.pressureLevel,
            emotionState: state.emotionState,
            startedAt: state.startedAt,
            updatedAt: Date.now(),
          },
          recoveryAvailable: true,
        })),

      restoreRecoverySnapshot: () =>
        set((state) => {
          const snapshot = state.recoverySnapshot;
          if (!snapshot) return state;

          return {
            sessionId: snapshot.sessionId,
            mode: snapshot.mode,
            vapiStatus: snapshot.vapiStatus,
            setup: snapshot.setup,
            currentQuestion: snapshot.currentQuestion,
            lastUserAnswer: snapshot.lastUserAnswer,
            transcript: snapshot.transcript,
            recruiterMemory: snapshot.recruiterMemory,
            liveScore: snapshot.liveScore,
            pressureLevel: snapshot.pressureLevel,
            emotionState: snapshot.emotionState,
            startedAt: snapshot.startedAt,
            endedAt: null,
            recoveryAvailable: false,
          };
        }),

      discardRecoverySnapshot: () =>
        set({
          recoverySnapshot: null,
          recoveryAvailable: false,
        }),
    }),
    {
      name: "workzo-interview-memory",
      partialize: (state) => ({
        setup: state.setup,
        sessionId: state.sessionId,
        persistentPatterns: state.persistentPatterns.slice(-20),
        answerHistory: state.answerHistory.slice(-25),
        interruptionHistory: state.interruptionHistory.slice(-20),
        emotionTimeline: state.emotionTimeline.slice(-25),
        recruiterTrustHistory: state.recruiterTrustHistory.slice(-25),
        failureAnalytics: state.failureAnalytics.slice(0, 100),
        errorEvents: state.errorEvents.slice(0, 100),
        recoverySnapshot: state.recoverySnapshot,
        recoveryAvailable: state.recoveryAvailable,
        // Persist liveScore so results page can read it on resume
        liveScore: state.liveScore,
      }),
    }
  )
);
