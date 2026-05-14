"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  ChevronDown,
  Clock3,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react";

import { useInterviewStore } from "@/store/interviewStore";
import { trackWorkZoEvent } from "@/lib/workzoAnalytics";

import {
  clearAllInterviewSetup,
  getInterviewSetupDebugInfo,
  readLatestInterviewSetup,
  saveLatestInterviewSetup,
  type WorkZoInterviewSetup,
} from "@/lib/workzoInterviewSetup";
import {
  getRecruiterVoiceProfile,
  getVapiAssistantIdForRecruiter,
} from "@/lib/recruiterVoiceConfig";

type TranscriptItem = {
  role: "recruiter" | "candidate" | "system";
  text: string;
  time: string;
};

type ScoreSet = {
  confidence: number;
  clarity: number;
  relevance: number;
  evidence: number;
  structure: number;
  overall?: number;
};

type MemoryBlock = {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  risks: string[];
  contradictions?: string[];
  missingMetrics?: string[];
  vagueAnswers?: string[];
  repeatedPatterns?: string[];
};

type Interruption = {
  shouldInterrupt: boolean;
  interruptionMessage: string;
  severity: "low" | "medium" | "high";
};

type WowMoment = {
  shouldTrigger?: boolean;
  line?: string;
  emotionalTag?: string;
  type?: string;
};

type TrustTimelineEvent = {
  direction?: "up" | "down" | "stable";
  value?: number;
  reason?: string;
};

type LiveUiState = {
  label?: string;
  theme?: string;
};

type InterviewArc = {
  phase?: "opening" | "probing" | "pressure" | "recovery" | "closing";
  instruction?: string;
};

type PsychologyReport = {
  finalDecision?: "continue" | "borderline" | "reject";
  finalPerception?: string;
  strongestSignal?: string;
  weakestPattern?: string;
  nextPracticeAction?: string;
};

type InterviewApiResponse = {
  question?: string;
  reply?: string;
  message?: string;
  content?: string;
  recruiterMessage?: string;
  followUpQuestion?: string;
  feedback?: string;
  mood?: string;
  emotion?: string;
  pressure?: number;
  recruiterTrust?: number;
  trust?: number;
  score?: Partial<ScoreSet>;
  scores?: Partial<ScoreSet>;
  memory?: Partial<MemoryBlock>;
  contradiction?: string;
  contradictions?: string[];
  interruption?: Interruption | string | null;
  wowMoment?: WowMoment;
  arc?: InterviewArc;
  trustTimeline?: TrustTimelineEvent[];
  liveUiState?: LiveUiState;
  postInterviewPsychologyReport?: PsychologyReport;
};

const DEFAULT_QUESTION =
  "Good to meet you. I’ve reviewed your profile and the role details. Please introduce yourself briefly and connect your background to this position.";

const defaultScores: ScoreSet = {
  confidence: 0,
  clarity: 0,
  relevance: 0,
  evidence: 0,
  structure: 0,
  overall: 0,
};

const defaultMemory: MemoryBlock = {
  strengths: [],
  weaknesses: [],
  improvements: [],
  risks: [],
  contradictions: [],
  missingMetrics: [],
  vagueAnswers: [],
  repeatedPatterns: [],
};

const waveform = [10, 22, 15, 34, 18, 26, 12, 30, 16, 24, 38, 14, 27, 19, 33, 21];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function timeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function getOverallScore(scores: ScoreSet) {
  if (typeof scores.overall === "number" && scores.overall > 0) return scores.overall;

  const values = [scores.confidence, scores.clarity, scores.relevance, scores.evidence, scores.structure];
  const active = values.filter((value) => value > 0);
  if (!active.length) return 0;

  return Math.round(active.reduce((sum, value) => sum + value, 0) / active.length);
}

function normalizeMemory(memory?: Partial<MemoryBlock>): MemoryBlock {
  return {
    strengths: memory?.strengths || [],
    weaknesses: memory?.weaknesses || [],
    improvements: memory?.improvements || [],
    risks: memory?.risks || [],
    contradictions: memory?.contradictions || [],
    missingMetrics: memory?.missingMetrics || [],
    vagueAnswers: memory?.vagueAnswers || [],
    repeatedPatterns: memory?.repeatedPatterns || [],
  };
}

function normalizeInterruption(value: InterviewApiResponse["interruption"]): Interruption | null {
  if (!value) return null;

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;

    return {
      shouldInterrupt: true,
      interruptionMessage: text,
      severity: "medium",
    };
  }

  if (!value.interruptionMessage?.trim()) return null;

  return {
    shouldInterrupt: Boolean(value.shouldInterrupt),
    interruptionMessage: value.interruptionMessage,
    severity: value.severity || "medium",
  };
}

function normalizeSetup(input?: Partial<WorkZoInterviewSetup> | null): WorkZoInterviewSetup {
  const source = input || readLatestInterviewSetup();

  return {
    cvText: source.cvText || "",
    jobDescription: source.jobDescription || "",
    targetRole: source.targetRole || "General Role",
    targetMarket: source.targetMarket || "Global",
    companyStyle: source.companyStyle || "Realistic",
    recruiterPersonality: source.recruiterPersonality || "analytical_hiring_manager",
    language: source.language || "English",
    recruiterMemoryProfile: source.recruiterMemoryProfile || null,
    jobMemoryProfile: source.jobMemoryProfile || null,
    source: source.source || "latest-upload",
    setupVersion: 4,
    setupId: source.setupId || "",
    updatedAt: source.updatedAt || "",
  };
}

function getRecruiterImage(recruiterName: string) {
  const name = recruiterName.toLowerCase();

  if (name.includes("markus")) return "/recruiters/markus.png";
  if (name.includes("daniel")) return "/recruiters/daniel.png";
  if (name.includes("priya")) return "/recruiters/priya.png";
  if (name.includes("sarah")) return "/recruiters/sarah.png";

  return "/recruiters/daniel.png";
}

function getRecruiterEmoji(recruiterName: string) {
  const name = recruiterName.toLowerCase();

  if (name.includes("markus")) return "👨🏼‍💼";
  if (name.includes("daniel")) return "👨🏻‍💼";
  if (name.includes("priya")) return "👩🏽‍💼";
  if (name.includes("sarah")) return "👩🏻‍💼";

  return "👤";
}

function getLocalSignal(answer: string) {
  const text = answer.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (!text) {
    return {
      label: "Ready",
      message: "Recruiter is waiting for your answer.",
      intensity: "low",
    };
  }

  const hasMetric = /\d|%|percent|reduced|increased|improved|saved|customers|users|tickets|revenue/i.test(text);
  const hasOwnership = /\b(i|my|me)\b/i.test(text);

  if (wordCount < 25) {
    return {
      label: "Too brief",
      message: "Add situation, action, and result.",
      intensity: "medium",
    };
  }

  if (wordCount > 150) {
    return {
      label: "Too long",
      message: "Shorten and lead with the result.",
      intensity: "medium",
    };
  }

  if (!hasMetric) {
    return {
      label: "Needs proof",
      message: "Add a number, result, user impact, or time saved.",
      intensity: "high",
    };
  }

  if (!hasOwnership) {
    return {
      label: "Ownership unclear",
      message: "Make clear what you personally did.",
      intensity: "medium",
    };
  }

  return {
    label: "Strong signal",
    message: "This answer has ownership and proof.",
    intensity: "low",
  };
}


function analyzeVoiceConfidence(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lower = text.toLowerCase();

  const fillerMatches =
    lower.match(/\b(um|uh|like|you know|actually|basically|maybe|probably|i think|kind of|sort of)\b/g) || [];

  const hesitationScore = Math.min(100, fillerMatches.length * 12);
  const tooShort = words.length < 18;
  const tooLong = words.length > 170;
  const hasMetric = /\d|%|percent|reduced|increased|improved|saved|users|customers|tickets|revenue|time/i.test(text);
  const hasOwnership = /\b(i|my|me)\b/i.test(text);

  const confidence = Math.max(
    12,
    Math.min(
      96,
      78 -
        hesitationScore -
        (tooShort ? 18 : 0) -
        (tooLong ? 12 : 0) +
        (hasMetric ? 10 : 0) +
        (hasOwnership ? 8 : 0)
    )
  );

  return {
    fillerCount: fillerMatches.length,
    wordCount: words.length,
    confidence: Math.round(confidence),
    nervousPacing: tooShort || tooLong || fillerMatches.length >= 3,
    shouldInterrupt:
      words.length > 130 ||
      fillerMatches.length >= 5 ||
      (!hasMetric && words.length > 85),
    interruptReason:
      words.length > 130
        ? "You are giving too much context. Give me the result first."
        : fillerMatches.length >= 5
          ? "You sound uncertain. Slow down and give me one concrete example."
          : !hasMetric && words.length > 85
            ? "I am still missing measurable impact."
            : "",
  };
}

function buildResultsPayload(input: {
  setup: WorkZoInterviewSetup;
  scores: ScoreSet;
  memory: MemoryBlock;
  contradictions: string[];
  transcript: TranscriptItem[];
  recruiter: ReturnType<typeof getRecruiterVoiceProfile>;
  pressure: number;
  recruiterTrust: number;
  feedback: string;
  wowMoment: WowMoment | null;
  arc: InterviewArc | null;
  trustTimeline: TrustTimelineEvent[];
  liveUiState: LiveUiState | null;
  postInterviewPsychologyReport: PsychologyReport | null;
}) {
  return {
    setup: input.setup,
    overallScore: getOverallScore(input.scores),
    scores: input.scores,
    memory: input.memory,
    contradictions: input.contradictions,
    transcript: input.transcript,
    recruiter: input.recruiter,
    pressure: input.pressure,
    recruiterTrust: input.recruiterTrust,
    feedback: input.feedback,
    wowMoment: input.wowMoment,
    arc: input.arc,
    trustTimeline: input.trustTimeline,
    liveUiState: input.liveUiState,
    postInterviewPsychologyReport: input.postInterviewPsychologyReport,
  };
}

function RecruiterRoom({
  recruiterName,
  recruiterRole,
  question,
  hasStarted,
  recruiterThinking,
  voiceActive,
  recruiterTrust,
  pressure,
  liveStatus,
}: {
  recruiterName: string;
  recruiterRole: string;
  question: string;
  hasStarted: boolean;
  recruiterThinking: boolean;
  voiceActive: boolean;
  recruiterTrust: number;
  pressure: number;
  liveStatus: string;
}) {
  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] shadow-[0_34px_120px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:min-h-[640px] lg:min-h-[calc(100vh-116px)]">
      <div className="absolute inset-0">
        <img
          src={getRecruiterImage(recruiterName)}
          alt={`${recruiterName} recruiter`}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-95"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,7,18,.82)_0%,rgba(2,7,18,.25)_38%,rgba(2,7,18,.45)_100%),linear-gradient(180deg,rgba(2,7,18,.08)_0%,rgba(2,7,18,.15)_45%,rgba(2,7,18,.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.18),transparent_32%)]" />
      </div>

      <div className="relative z-10 flex min-h-[560px] flex-col justify-between p-4 sm:min-h-[640px] sm:p-6 lg:min-h-[calc(100vh-116px)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/58 p-4 shadow-2xl backdrop-blur-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
              AI Recruiter
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-xl">
                {getRecruiterEmoji(recruiterName)}
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-black text-white">{recruiterName}</p>
                <p className="text-sm text-slate-300">{recruiterRole}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-black text-emerald-200">
                {voiceActive ? "Voice live" : "Ready"}
              </span>
              <span className="rounded-full bg-blue-400/12 px-3 py-1 text-xs font-black text-blue-100">
                {liveStatus}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/32 px-4 py-3 text-sm font-black text-slate-200 backdrop-blur-2xl">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-cyan-200" />
              {timeLabel()}
            </div>
          </div>
        </div>

        <div className="max-w-3xl rounded-[28px] border border-white/10 bg-slate-950/72 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.58)] backdrop-blur-2xl sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-black text-emerald-200">
              {hasStarted ? "Recruiter says" : "Interview room ready"}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
              Trust {recruiterTrust}/100
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
              Pressure {pressure}/100
            </span>
          </div>

          <p className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
            {recruiterThinking
              ? "I’m evaluating your answer..."
              : hasStarted
                ? `“${question}”`
                : "Step into a real interview simulation."}
          </p>

          {!hasStarted && (
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              WorkZo has prepared {recruiterName} using your recruiter memory profile,
              job description, target role, and interview market. Start when you are ready.
            </p>
          )}

          <div className="mt-5 flex h-8 items-end gap-1 overflow-hidden">
            {waveform.map((height, index) => (
              <span
                key={index}
                className={cn(
                  "w-2 shrink-0 rounded-full bg-gradient-to-t from-blue-500 via-cyan-300 to-emerald-300",
                  recruiterThinking || voiceActive ? "animate-pulse" : ""
                )}
                style={{ height: Math.max(8, height) }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContextCheck({
  setup,
  open,
  onToggle,
  onRefresh,
  onClear,
  debugRows,
}: {
  setup: WorkZoInterviewSetup;
  open: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onClear: () => void;
  debugRows: ReturnType<typeof getInterviewSetupDebugInfo>;
}) {
  const profile = setup.recruiterMemoryProfile;
  const job = setup.jobMemoryProfile;

  return (
    <section className="rounded-[24px] border border-amber-300/20 bg-amber-500/10 p-4 text-amber-50 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h2 className="text-base font-black">Check recruiter context</h2>
          <p className="mt-1 text-xs leading-5 text-amber-100/80">
            Testing panel: verifies what the recruiter can see.
          </p>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-2xl bg-black/20 p-3">
              <span className="font-black">Name:</span> {profile?.candidateName || "Not detected"}
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <span className="font-black">Role:</span> {job?.roleTitle || setup.targetRole}
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <span className="font-black">Memory:</span> {profile ? "Loaded" : "Missing"}
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <span className="font-black">JD:</span> {job ? "Loaded" : "Missing"}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100/70">
              Recruiter memory facts
            </p>
            <div className="mt-1 max-h-32 overflow-auto rounded-2xl bg-black/25 p-3 text-xs leading-5">
              {profile?.recruiterMemory?.length
                ? profile.recruiterMemory.map((item) => <div key={item}>• {item}</div>)
                : "No recruiter memory profile found. Go back to onboarding and rebuild setup."}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100/70">
              Job focus
            </p>
            <div className="mt-1 max-h-28 overflow-auto rounded-2xl bg-black/25 p-3 text-xs leading-5">
              {job?.interviewFocus?.length
                ? job.interviewFocus.map((item) => <div key={item}>• {item}</div>)
                : setup.jobDescription.slice(0, 700) || "No job description loaded."}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-2xl border border-amber-100/20 bg-white/10 px-3 py-2 text-xs font-black"
            >
              Refresh check
            </button>
            <button
              type="button"
              onClick={onClear}
              className="rounded-2xl border border-red-100/20 bg-red-500/20 px-3 py-2 text-xs font-black text-red-50"
            >
              Clear stored setup
            </button>
          </div>

          {debugRows.length > 0 && (
            <div className="max-h-28 overflow-auto rounded-2xl bg-black/20 p-2 text-[11px] text-amber-50/80">
              {debugRows.map((row) => (
                <div key={row.key} className="border-b border-white/10 py-1 last:border-0">
                  {row.key}: {row.exists ? "exists" : "empty"} · CV {row.cvChars} · JD {row.jdChars}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function InterviewPage() {
  const [, startTransition] = useTransition();
  const updateSetup = useInterviewStore((state) => state.updateSetup);
  const resetSession = useInterviewStore((state) => state.resetSession);

  const [isHydrated, setIsHydrated] = useState(false);
  const [activeSetup, setActiveSetup] = useState<WorkZoInterviewSetup>(() =>
    normalizeSetup(readLatestInterviewSetup())
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [feedback, setFeedback] = useState("");
  const [scores, setScores] = useState<ScoreSet>(defaultScores);
  const [memory, setMemory] = useState<MemoryBlock>(defaultMemory);
  const [contradictions, setContradictions] = useState<string[]>([]);
  const [interruption, setInterruption] = useState<Interruption | null>(null);
  const [pressure, setPressure] = useState(35);
  const [recruiterTrust, setRecruiterTrust] = useState(46);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Voice ready");
  const [voiceError, setVoiceError] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [debugRows, setDebugRows] = useState<ReturnType<typeof getInterviewSetupDebugInfo>>([]);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [recruiterThinking, setRecruiterThinking] = useState(false);
  const [trustTimeline, setTrustTimeline] = useState<TrustTimelineEvent[]>([]);
  const [wowMoment, setWowMoment] = useState<WowMoment | null>(null);
  const [interviewArc, setInterviewArc] = useState<InterviewArc | null>(null);
  const [liveUiState, setLiveUiState] = useState<LiveUiState | null>(null);
  const [postInterviewPsychologyReport, setPostInterviewPsychologyReport] =
    useState<PsychologyReport | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  const vapiRef = useRef<unknown>(null);

  const recruiterProfile = useMemo(
    () => getRecruiterVoiceProfile(activeSetup.recruiterPersonality),
    [activeSetup.recruiterPersonality]
  );

  const overallScore = useMemo(() => getOverallScore(scores), [scores]);
  const localSignal = useMemo(() => getLocalSignal(answer), [answer]);
  const role = activeSetup.jobMemoryProfile?.roleTitle || activeSetup.targetRole || "General Role";
  const market = activeSetup.targetMarket || "Global";
  const liveStatus = liveUiState?.label || localSignal.message || "Recruiter is listening";

  useEffect(() => {
    trackWorkZoEvent({
      event: "interview_room_viewed",
      setupId: activeSetup.setupId,
      role,
      market,
      recruiter: recruiterProfile.name,
    });

    const latest = normalizeSetup(readLatestInterviewSetup());
    setActiveSetup(latest);
    updateSetup(latest);
    setDebugRows(getInterviewSetupDebugInfo());
    setIsHydrated(true);
    // Run only once to avoid Zustand/localStorage hydration loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      const current = vapiRef.current as { stop?: () => void } | null;
      try {
        current?.stop?.();
      } catch {
        // Vapi/Krisp cleanup can fail if WASM worker is not ready.
      }
      vapiRef.current = null;
    };
  }, []);

  const persistResults = useCallback((payload: ReturnType<typeof buildResultsPayload>) => {
    try {
      window.localStorage.setItem("workzo-last-results", JSON.stringify(payload));
    } catch {
      // Ignore storage errors.
    }
  }, []);

  const startInterview = useCallback(() => {
    const setup = normalizeSetup(readLatestInterviewSetup());
    const saved = saveLatestInterviewSetup(setup);
    setActiveSetup(saved);
    updateSetup(saved);
    trackWorkZoEvent({
      event: "interview_started",
      setupId: saved.setupId,
      role: saved.jobMemoryProfile?.roleTitle || saved.targetRole,
      market: saved.targetMarket,
      recruiter: recruiterProfile.name,
      mode: "text",
    });

    setHasStarted(true);
    setQuestion(DEFAULT_QUESTION);
    setTranscript([
      {
        role: "recruiter",
        text: DEFAULT_QUESTION,
        time: timeLabel(),
      },
    ]);
    setContextOpen(false);
  }, [recruiterProfile.name, updateSetup]);

  const submitAnswer = useCallback(async () => {
    const candidateAnswer = answer.trim();
    if (!candidateAnswer || isSubmitting) return;

    setIsSubmitting(true);
    setRecruiterThinking(true);
    setFeedback("");
    setInterruption(null);

    const nextTranscript: TranscriptItem[] = [
      ...transcript,
      {
        role: "candidate",
        text: candidateAnswer,
        time: timeLabel(),
      },
    ];

    setTranscript(nextTranscript);
    setAnswer("");

    try {
      const voiceConfidence = analyzeVoiceConfidence(candidateAnswer);

      trackWorkZoEvent({
        event: "answer_submitted",
        setupId: activeSetup.setupId,
        role,
        market,
        recruiter: recruiterProfile.name,
        mode: "text",
        score: voiceConfidence.confidence,
        trust: recruiterTrust,
        pressure,
        metadata: voiceConfidence,
      });

      if (voiceConfidence.shouldInterrupt) {
        trackWorkZoEvent({
          event: "voice_interruption",
          setupId: activeSetup.setupId,
          role,
          market,
          recruiter: recruiterProfile.name,
          mode: "text",
          trust: recruiterTrust,
          pressure,
          metadata: voiceConfidence,
        });
      }

      const response = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answer: candidateAnswer,
          currentQuestion: question,
          transcript: nextTranscript.slice(-10),
          setup: activeSetup,
          cvText: activeSetup.cvText,
          jobDescription: activeSetup.jobDescription,
          targetRole: activeSetup.targetRole,
          targetMarket: activeSetup.targetMarket,
          companyStyle: activeSetup.companyStyle,
          recruiterPersonality: activeSetup.recruiterPersonality,
          pressure,
          recruiterTrust,
          scores,
          memory,
          contradictions,
          trustTimeline,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as InterviewApiResponse;

      if (!response.ok) {
        throw new Error(data.feedback || data.message || "Interview response failed.");
      }

      const normalizedInterruption = normalizeInterruption(data.interruption);
      const nextQuestion =
        data.followUpQuestion ||
        data.question ||
        data.reply ||
        data.message ||
        data.content ||
        "Give me one specific example from your background and connect it to this job.";

      const mergedScores: ScoreSet = {
        confidence: safeNumber(data.score?.confidence ?? data.scores?.confidence, scores.confidence),
        clarity: safeNumber(data.score?.clarity ?? data.scores?.clarity, scores.clarity),
        relevance: safeNumber(data.score?.relevance ?? data.scores?.relevance, scores.relevance),
        evidence: safeNumber(data.score?.evidence ?? data.scores?.evidence, scores.evidence),
        structure: safeNumber(data.score?.structure ?? data.scores?.structure, scores.structure),
        overall: safeNumber(data.score?.overall ?? data.scores?.overall, scores.overall || 0),
      };

      const nextTrust = safeNumber(data.recruiterTrust ?? data.trust, recruiterTrust);
      const nextPressure = safeNumber(data.pressure, pressure);
      const nextMemory = normalizeMemory(data.memory);
      const nextContradictions = Array.from(
        new Set([
          ...contradictions,
          ...(data.contradiction ? [data.contradiction] : []),
          ...(data.contradictions || []),
        ].filter(Boolean))
      ).slice(-6);

      const recruiterText = normalizedInterruption?.shouldInterrupt
        ? normalizedInterruption.interruptionMessage
        : nextQuestion;

      const finalTranscript: TranscriptItem[] = [
        ...nextTranscript,
        {
          role: "recruiter",
          text: recruiterText,
          time: timeLabel(),
        },
      ];

      startTransition(() => {
        setQuestion(nextQuestion);
        setFeedback(data.feedback || "");
        setPressure(nextPressure);
        setRecruiterTrust(nextTrust);
        setScores(mergedScores);
        setMemory(nextMemory);
        setContradictions(nextContradictions);
        setInterruption(normalizedInterruption);
        setTranscript(finalTranscript.slice(-30));
        setWowMoment(data.wowMoment || null);
        setInterviewArc(data.arc || null);
        setTrustTimeline(data.trustTimeline || trustTimeline);
        setLiveUiState(data.liveUiState || null);
        setPostInterviewPsychologyReport(data.postInterviewPsychologyReport || null);
      });

      persistResults(
        buildResultsPayload({
          setup: activeSetup,
          scores: mergedScores,
          memory: nextMemory,
          contradictions: nextContradictions,
          transcript: finalTranscript.slice(-30),
          recruiter: recruiterProfile,
          pressure: nextPressure,
          recruiterTrust: nextTrust,
          feedback: data.feedback || "",
          wowMoment: data.wowMoment || null,
          arc: data.arc || null,
          trustTimeline: data.trustTimeline || trustTimeline,
          liveUiState: data.liveUiState || null,
          postInterviewPsychologyReport: data.postInterviewPsychologyReport || null,
        })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The recruiter could not respond.";

      setFeedback(message);
      setTranscript([
        ...nextTranscript,
        {
          role: "system",
          text: message,
          time: timeLabel(),
        },
      ]);
    } finally {
      setIsSubmitting(false);
      setRecruiterThinking(false);
    }
  }, [
    activeSetup,
    answer,
    contradictions,
    isSubmitting,
    memory,
    persistResults,
    pressure,
    question,
    recruiterProfile,
    recruiterTrust,
    scores,
    startTransition,
    transcript,
    trustTimeline,
  ]);

  const startVoiceInterview = useCallback(async () => {
    setVoiceError("");

    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      const assistantId = getVapiAssistantIdForRecruiter(activeSetup.recruiterPersonality);

      if (!publicKey || !assistantId) {
        throw new Error("Missing Vapi public key or recruiter assistant ID.");
      }

      const existing = vapiRef.current as { stop?: () => void } | null;
      try {
        existing?.stop?.();
      } catch {
        // Ignore stale Vapi cleanup.
      }

      const VapiModule = await import("@vapi-ai/web");
      const Vapi = VapiModule.default;
      const vapi = new Vapi(publicKey);

      vapiRef.current = vapi;
      setVoiceStatus(`${recruiterProfile.name} voice connecting...`);

      vapi.on("call-start", () => {
        trackWorkZoEvent({
          event: "voice_started",
          setupId: activeSetup.setupId,
          role,
          market,
          recruiter: recruiterProfile.name,
          mode: "voice",
        });

        setVoiceActive(true);
        setVoiceStatus(`${recruiterProfile.name} is listening`);
      });

      vapi.on("call-end", () => {
        trackWorkZoEvent({
          event: "voice_stopped",
          setupId: activeSetup.setupId,
          role,
          market,
          recruiter: recruiterProfile.name,
          mode: "voice",
        });

        setVoiceActive(false);
        setVoiceStatus("Voice interview stopped");
      });

      vapi.on("message", (message: unknown) => {
        const payload = message as {
          type?: string;
          transcript?: string;
          role?: "assistant" | "user";
          transcriptType?: string;
        };

        if (
          payload.type === "transcript" &&
          payload.transcript &&
          payload.transcriptType === "final"
        ) {
          const roleFromVoice: TranscriptItem["role"] =
            payload.role === "assistant" ? "recruiter" : "candidate";

          const finalText = payload.transcript || "";

          if (roleFromVoice === "candidate") {
            const confidence = analyzeVoiceConfidence(finalText);

            if (confidence.shouldInterrupt) {
              setInterruption({
                shouldInterrupt: true,
                interruptionMessage: confidence.interruptReason,
                severity: confidence.confidence < 45 ? "high" : "medium",
              });

              trackWorkZoEvent({
                event: "voice_interruption",
                setupId: activeSetup.setupId,
                role,
                market,
                recruiter: recruiterProfile.name,
                mode: "voice",
                score: confidence.confidence,
                trust: recruiterTrust,
                pressure,
                metadata: confidence,
              });
            }
          }

          setTranscript((items): TranscriptItem[] =>
            [
              ...items,
              {
                role: roleFromVoice,
                text: finalText,
                time: timeLabel(),
              },
            ].slice(-30)
          );
        }
      });

      vapi.on("error", (error: unknown) => {
        const message = error instanceof Error ? error.message : "Voice interview error";
        setVoiceError(message);
        setVoiceStatus("Voice issue");
        setVoiceActive(false);
      });

      await vapi.start(assistantId, {
        variableValues: {
          recruiterName: recruiterProfile.name,
          recruiterRole: recruiterProfile.role,
          targetRole: role || "Unknown role",
          targetMarket: market || "Global",
          candidateCv: JSON.stringify(activeSetup.recruiterMemoryProfile || {}).slice(0, 4000),
          jobDescription: JSON.stringify(activeSetup.jobMemoryProfile || {}).slice(0, 3000),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start voice interview.";

      setVoiceError(message);
      setVoiceStatus("Voice unavailable");
      setVoiceActive(false);
    }
  }, [activeSetup, market, pressure, recruiterProfile.name, recruiterProfile.role, recruiterTrust, role]);

  const stopVoiceInterview = useCallback(async () => {
    const current = vapiRef.current as { stop?: () => void } | null;

    try {
      current?.stop?.();
    } catch {
      // Vapi/Krisp cleanup can fail if WASM worker is not ready.
    }

    vapiRef.current = null;
    setVoiceActive(false);
    setVoiceStatus("Voice interview stopped");
  }, []);

  const startFresh = useCallback(() => {
    resetSession();
    setHasStarted(false);
    setAnswer("");
    setQuestion(DEFAULT_QUESTION);
    setFeedback("");
    setScores(defaultScores);
    setMemory(defaultMemory);
    setContradictions([]);
    setInterruption(null);
    setPressure(35);
    setRecruiterTrust(46);
    setTranscript([]);
    setTrustTimeline([]);
    setWowMoment(null);
    setInterviewArc(null);
    setLiveUiState(null);
    setPostInterviewPsychologyReport(null);
  }, [resetSession]);

  const clearStoredContext = useCallback(() => {
    trackWorkZoEvent({
      event: "setup_cleared",
      setupId: activeSetup.setupId,
      role,
      market,
      recruiter: recruiterProfile.name,
    });

    clearAllInterviewSetup();
    const empty = normalizeSetup(null);
    setActiveSetup(empty);
    updateSetup(empty);
    setDebugRows(getInterviewSetupDebugInfo());
    setContextOpen(true);
  }, [activeSetup.setupId, market, recruiterProfile.name, role, updateSetup]);

  const goToResults = useCallback(() => {
    persistResults(
      buildResultsPayload({
        setup: activeSetup,
        scores,
        memory,
        contradictions,
        transcript,
        recruiter: recruiterProfile,
        pressure,
        recruiterTrust,
        feedback,
        wowMoment,
        arc: interviewArc,
        trustTimeline,
        liveUiState,
        postInterviewPsychologyReport,
      })
    );

    trackWorkZoEvent({
      event: "results_viewed",
      setupId: activeSetup.setupId,
      role,
      market,
      recruiter: recruiterProfile.name,
      score: getOverallScore(scores),
      trust: recruiterTrust,
      pressure,
    });

    window.location.href = "/results";
  }, [
    activeSetup,
    contradictions,
    feedback,
    interviewArc,
    liveUiState,
    memory,
    persistResults,
    postInterviewPsychologyReport,
    pressure,
    recruiterProfile,
    recruiterTrust,
    scores,
    transcript,
    trustTimeline,
    wowMoment,
  ]);


  if (!isHydrated) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#020712] px-3 py-3 text-white sm:px-5">
        <div className="mx-auto max-w-[1540px]">
          <div className="mb-3 h-[72px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.045]" />
          <div className="grid gap-3 lg:grid-cols-[1fr_420px]">
            <div className="min-h-[620px] animate-pulse rounded-[32px] border border-white/10 bg-white/[0.045]" />
            <div className="space-y-3">
              <div className="h-40 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.045]" />
              <div className="h-56 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.045]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020712] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-260px] top-[-220px] h-[520px] w-[520px] rounded-full bg-blue-600/13 blur-[120px]" />
        <div className="absolute right-[-220px] top-[-160px] h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1540px] flex-col px-3 py-3 sm:px-5">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.045] px-3 py-3 shadow-[0_20px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/workzo_icon.png"
              alt="WorkZo AI"
              width={38}
              height={38}
              className="rounded-2xl shadow-[0_0_28px_rgba(14,165,233,0.32)]"
            />
            <div>
              <p className="text-base font-black leading-tight sm:text-lg">WorkZo AI</p>
              <p className="hidden text-xs text-slate-400 sm:block">
                Real Interview AI · recruiter memory active
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-300">
              {role}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-300">
              {market}
            </span>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              {hasStarted ? "Live" : "Ready"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-black text-slate-200 transition hover:bg-white/10 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button
              onClick={startFresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-sm font-black text-red-100 transition hover:bg-red-500/15 sm:px-4"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Start Fresh</span>
            </button>
            <button
              onClick={goToResults}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-black text-white transition hover:bg-white/10 sm:px-4"
            >
              Results
            </button>
          </div>
        </header>

        {!hasStarted ? (
          <section className="grid flex-1 gap-3 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">
            <div>
              <RecruiterRoom
                recruiterName={recruiterProfile.name}
                recruiterRole={recruiterProfile.role}
                question={question}
                hasStarted={false}
                recruiterThinking={false}
                voiceActive={voiceActive}
                recruiterTrust={recruiterTrust}
                pressure={pressure}
                liveStatus={activeSetup.recruiterMemoryProfile ? "Memory loaded" : "Memory missing"}
              />

              <div className="mt-3 flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_20px_90px_rgba(0,0,0,0.26)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-cyan-100">
                    Recruiter memory profile
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {activeSetup.recruiterMemoryProfile
                      ? `Loaded for ${activeSetup.recruiterMemoryProfile.candidateName || "candidate"}`
                      : "Missing — go back to onboarding and rebuild setup"}
                    {" · "}
                    {activeSetup.jobMemoryProfile
                      ? `JD loaded: ${activeSetup.jobMemoryProfile.roleTitle || activeSetup.targetRole}`
                      : "JD memory missing"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startInterview}
                  className="inline-flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-base font-black text-white shadow-[0_0_40px_rgba(34,211,238,0.32)] transition hover:scale-[1.02]"
                >
                  <Play className="h-5 w-5" />
                  Start Real Interview
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <aside className="grid content-start gap-3">
              <ContextCheck
                setup={activeSetup}
                open={contextOpen}
                onToggle={() => setContextOpen((value) => !value)}
                onRefresh={() => setDebugRows(getInterviewSetupDebugInfo())}
                onClear={clearStoredContext}
                debugRows={debugRows}
              />

              <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-200" />
                  <h2 className="text-lg font-black">What will happen</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                  <p>1. The recruiter starts with a realistic opening question.</p>
                  <p>2. Your answer is judged for clarity, proof, ownership, and JD fit.</p>
                  <p>3. Follow-ups use the recruiter memory profile instead of messy CV text.</p>
                </div>
              </div>
            </aside>
          </section>
        ) : (
          <section className="grid flex-1 gap-3 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">
            <div className="space-y-3">
              <RecruiterRoom
                recruiterName={recruiterProfile.name}
                recruiterRole={recruiterProfile.role}
                question={interruption?.shouldInterrupt ? interruption.interruptionMessage : question}
                hasStarted
                recruiterThinking={recruiterThinking}
                voiceActive={voiceActive}
                recruiterTrust={recruiterTrust}
                pressure={pressure}
                liveStatus={liveStatus}
              />

              <section className="grid gap-3 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px]">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black">Your answer</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Answer directly with result, action, and impact.
                      </p>
                    </div>
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                      Text mode
                    </span>
                  </div>

                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Example: I handled customer escalations by..."
                    className="mt-4 min-h-[190px] w-full resize-none rounded-3xl border border-white/10 bg-[#050b16] p-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 transition focus:border-cyan-300/50"
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      {localSignal.label}: {localSignal.message}
                    </p>
                    <button
                      type="button"
                      onClick={submitAnswer}
                      disabled={!answer.trim() || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isSubmitting ? "Thinking..." : "Submit answer"}
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-black">Voice mode</h2>
                      <p className="mt-1 text-sm text-slate-400">{voiceStatus}</p>
                    </div>
                    <span className={cn("rounded-full px-3 py-1 text-xs font-black", voiceActive ? "bg-emerald-400/12 text-emerald-200" : "bg-white/8 text-slate-300")}>
                      {voiceActive ? "Live" : "Ready"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                          Recruiter voice
                        </p>
                        <p className="mt-1 font-black">
                          {recruiterProfile.name} · {recruiterProfile.voiceGender}
                        </p>
                      </div>
                      <Volume2 className="h-5 w-5 text-cyan-200" />
                    </div>

                    {voiceError && (
                      <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
                        {voiceError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={voiceActive ? stopVoiceInterview : startVoiceInterview}
                      className={cn(
                        "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(14,165,233,.24)] transition hover:scale-[1.01]",
                        voiceActive
                          ? "bg-gradient-to-r from-red-500 to-rose-500"
                          : "bg-gradient-to-r from-blue-500 to-cyan-400"
                      )}
                    >
                      {voiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {voiceActive ? "Stop Voice" : "Start Voice"}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <aside className="grid content-start gap-3 lg:sticky lg:top-3">
              <ContextCheck
                setup={activeSetup}
                open={contextOpen}
                onToggle={() => setContextOpen((value) => !value)}
                onRefresh={() => setDebugRows(getInterviewSetupDebugInfo())}
                onClear={clearStoredContext}
                debugRows={debugRows}
              />

              <section className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black">Recruiter signal</h2>
                  <Brain className="h-5 w-5 text-cyan-200" />
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Trust
                    </p>
                    <p className="mt-1 text-2xl font-black">{recruiterTrust}/100</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Overall
                    </p>
                    <p className="mt-1 text-2xl font-black">{overallScore}/100</p>
                  </div>
                  {feedback && (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm leading-6 text-amber-100">
                      {feedback}
                    </div>
                  )}
                  {wowMoment?.shouldTrigger && (
                    <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm leading-6 text-rose-100">
                      <div className="mb-1 flex items-center gap-2 font-black">
                        <Zap className="h-4 w-4" />
                        Recruiter challenge
                      </div>
                      {wowMoment.line}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={() => setTranscriptOpen((value) => !value)}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-200" />
                    <h2 className="text-xl font-black">Transcript</h2>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition", transcriptOpen && "rotate-180")} />
                </button>

                {transcriptOpen && (
                  <div className="mt-4 max-h-[260px] space-y-3 overflow-y-auto">
                    {transcript.map((item, index) => (
                      <div key={`${item.time}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          {item.role} · {item.time}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-200">{item.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
