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
};

export type InterviewSetup = {
  targetRole: string;
  targetMarket: string;
  companyStyle: string;
  recruiterPersonality: string;
  cvText: string;
  jobDescription: string;
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
  targetMarket: "",
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

function detectPatterns(answer: string): string[] {
  const text = answer.toLowerCase();
  const patterns: string[] = [];

  if (
    !text.includes("%") &&
    !text.includes("impact") &&
    !text.includes("result") &&
    !text.includes("improved") &&
    !text.includes("reduced") &&
    !text.includes("increased")
  ) {
    patterns.push("Avoids measurable impact");
  }

  if (
    text.includes("maybe") ||
    text.includes("i think") ||
    text.includes("probably") ||
    text.includes("not sure")
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

  if (
    !text.includes("i ") &&
    !text.includes("my ") &&
    !text.includes("me ")
  ) {
    patterns.push("Weak ownership signal");
  }

  if (answer.split(/\s+/).filter(Boolean).length < 25) {
    patterns.push("Answers too briefly");
  }

  return patterns;
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

      setMode: (mode) => set({ mode }),

      setVapiStatus: (status) => set({ vapiStatus: status }),

      setVapiError: (error) =>
        set({
          vapiError: error,
          vapiStatus: error ? "error" : get().vapiStatus,
        }),

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
        set((state) => ({
          transcript: [
            ...state.transcript,
            {
              ...item,
              id: createId("msg"),
              timestamp: Date.now(),
            },
          ],
        })),

      clearTranscript: () => set({ transcript: [] }),

      addRecruiterMemory: (item) =>
        set((state) => ({
          recruiterMemory: [
            ...state.recruiterMemory,
            {
              ...item,
              id: createId("memory"),
            },
          ].slice(-20),
        })),

      setRecruiterMemory: (items) =>
        set({
          recruiterMemory: items.slice(-20),
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
            ].slice(-50),
          };
        }),

      setPressureLevel: (level) =>
        set((state) => ({
          pressureLevel: Math.max(0, Math.min(100, Math.round(level))),
          emotionTimeline: [
            ...state.emotionTimeline,
            {
              id: createId("emotion"),
              emotion: state.emotionState,
              pressureLevel: Math.max(0, Math.min(100, Math.round(level))),
              timestamp: Date.now(),
            },
          ].slice(-50),
        })),

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
          ].slice(-50),
        })),

      recordAnswerHistory: (answer, mode) => {
        const state = get();

        const detectedPatterns = detectPatterns(answer);

        detectedPatterns.forEach((pattern) => {
          get().recordPersistentPattern(pattern, "medium");
        });

        set((current) => ({
          answerHistory: [
            ...current.answerHistory,
            {
              id: createId("answer"),
              answer,
              mode,
              score: current.liveScore,
              emotionState: current.emotionState,
              pressureLevel: current.pressureLevel,
              timestamp: Date.now(),
            },
          ].slice(-100),
        }));
      },

      recordInterruption: (message, severity) =>
        set((state) => ({
          interruptionHistory: [
            ...state.interruptionHistory,
            {
              id: createId("interrupt"),
              message,
              severity,
              timestamp: Date.now(),
            },
          ].slice(-50),
        })),

      recordPersistentPattern: (label, severity = "medium") =>
        set((state) => {
          const existing = state.persistentPatterns.find(
            (item) => item.label === label
          );

          if (existing) {
            return {
              persistentPatterns: state.persistentPatterns.map((item) =>
                item.label === label
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
    }),
    {
      name: "workzo-interview-memory",
      partialize: (state) => ({
        setup: state.setup,
        persistentPatterns: state.persistentPatterns,
        answerHistory: state.answerHistory,
        interruptionHistory: state.interruptionHistory,
        emotionTimeline: state.emotionTimeline,
        recruiterTrustHistory: state.recruiterTrustHistory,
      }),
    }
  )
);