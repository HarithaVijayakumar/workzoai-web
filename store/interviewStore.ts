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
            ].slice(-50),
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
            ].slice(-50),
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
            ].slice(-50),
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
          ].slice(-50),
        })),

      recordAnswerHistory: (answer, mode) => {
        const detectedPatterns = detectPatterns(answer);

        detectedPatterns.forEach((pattern) => {
          get().recordPersistentPattern(pattern, "medium");
        });

        set((state) => ({
          answerHistory: [
            ...state.answerHistory,
            {
              id: createId("answer"),
              answer,
              mode,
              score: state.liveScore,
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
            ].slice(-50),
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
    }),
    {
      name: "workzo-interview-memory",
      partialize: (state) => ({
        setup: state.setup,
        persistentPatterns: state.persistentPatterns.slice(-20),
        answerHistory: state.answerHistory.slice(-25),
        interruptionHistory: state.interruptionHistory.slice(-20),
        emotionTimeline: state.emotionTimeline.slice(-25),
        recruiterTrustHistory: state.recruiterTrustHistory.slice(-25),
      }),
    }
  )
);
