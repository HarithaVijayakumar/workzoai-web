"use client";

import RecruiterCard from "@/components/interview/RecruiterCard";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Vapi from "@vapi-ai/web";
import { useInterviewStore } from "@/store/interviewStore";

type VoiceState = "idle" | "starting" | "listening" | "speaking" | "muted";
type Speaker = "user" | "assistant" | null;

type InterviewApiResponse = {
  question?: string;
  recruiterReaction?: string;
  score?: {
    clarity?: number;
    relevance?: number;
    confidence?: number;
    structure?: number;
    evidence?: number;
    overall?: number;
  };

  interruption?: {
    shouldInterrupt: boolean;
    interruptionMessage: string;
    severity: "low" | "medium" | "high";
  };

  recruiterProfile?: {
    id: string;
    name: string;
    title: string;
    avatar: string;
    tone: string;
    questionStyle: string;
    pressureBias: number;
    interruptionBias: number;
    feedbackStyle: string;
  };

  memoryUpdates?: {
    label: string;
    value: string;
    importance: "low" | "medium" | "high";
  }[];
  pressureLevel?: number;
  emotionState?: string;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  risks?: string[];
};

function isNormalVapiEnd(error: unknown) {
  const message = String((error as any)?.message || error || "");

  return (
    message.includes("Meeting ended due to ejection") ||
    message.includes("Meeting has ended") ||
    message.includes("Customer/Silence") ||
    message.includes("Silence") ||
    message.includes("meeting has ended")
  );
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];
}

function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export default function InterviewPage() {
  const {
    setup,
    mode,
    vapiStatus,
    vapiError,
    currentQuestion,
    transcript,
    recruiterMemory,
    liveScore,
    pressureLevel,
    emotionState,
    setMode,
    setVapiStatus,
    setVapiError,
    startSession,
    endSession,
    setCurrentQuestion,
    setLastUserAnswer,
    addTranscript,
    addRecruiterMemory,
    recordAnswerHistory,
    recordInterruption,
    updateLiveScore,
    setPressureLevel,
    setEmotionState,
  } = useInterviewStore();

  const [answer, setAnswer] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [recruiterProfile, setRecruiterProfile] = useState<any>(null);

  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [liveSpeaker, setLiveSpeaker] = useState<Speaker>(null);

  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);

  const vapiRef = useRef<Vapi | null>(null);
  const vapiStartedRef = useRef(false);
  const mountedRef = useRef(false);
  const lastVoiceAnswerRef = useRef("");
  const [interruption, setInterruption] = useState<any>(null);
  const voiceAnalysisTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  const targetRole = setup.targetRole || "Target role";
  const targetMarket = setup.targetMarket || "Global";
  const companyStyle = setup.companyStyle || "Realistic";
  const recruiterPersonality = setup.recruiterPersonality || "Professional";
  const cvText = setup.cvText || "";
  const jobDescription = setup.jobDescription || "";

  useEffect(() => {
    mountedRef.current = true;
    startSession();

    if (!currentQuestion) {
      const firstQuestion = `Good to meet you. Let’s begin with the ${targetRole} role. Tell me about yourself and keep it relevant to this position.`;
      setCurrentQuestion(firstQuestion);
      addTranscript({ speaker: "recruiter", text: firstQuestion });
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isNormalVapiEnd(event.reason)) {
        event.preventDefault();
        setVapiStatus("ended");
        setVapiError(null);
        setVoiceMode(false);
        setVoiceState("idle");
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);

      if (voiceAnalysisTimerRef.current) {
        clearTimeout(voiceAnalysisTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyzeAnswer(userAnswer: string, source: "text" | "voice") {
    const cleanAnswer = userAnswer.trim();

    if (!cleanAnswer) return;

    if (source === "voice") {
      setIsAnalyzingVoice(true);
    } else {
      setIsThinking(true);
    }

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          targetMarket,
          companyStyle,
          recruiterPersonality,
          cvText,
          jobDescription,
          transcript,
          lastUserAnswer: cleanAnswer,
          mode: source,
        }),
      });

      const data = (await response.json()) as InterviewApiResponse;

      const recruiterReaction =
        data.recruiterReaction ||
        "Interesting. I want to understand the evidence behind that answer.";

      const nextQuestion =
        data.question ||
        "Can you give me one specific example with situation, action, and result?";

      if (source === "text") {
        setAiReply(`${recruiterReaction}\n\n${nextQuestion}`);

        addTranscript({ speaker: "recruiter", text: recruiterReaction });
        addTranscript({ speaker: "recruiter", text: nextQuestion });

        setCurrentQuestion(nextQuestion);
      } else {
        setCurrentQuestion(nextQuestion);
      }

      setStrengths(safeArray(data.strengths));
      setWeaknesses(safeArray(data.weaknesses));
      setImprovements(safeArray(data.improvements));
      setRisks(safeArray(data.risks));
      recordAnswerHistory(cleanAnswer, source);

      if (data.recruiterProfile) {
        setRecruiterProfile(data.recruiterProfile);
      }

      if (data.interruption) {
        setInterruption(data.interruption);

        if (data.interruption.shouldInterrupt) {
          recordInterruption(
            data.interruption.interruptionMessage,
            data.interruption.severity
          );
        }

        setTimeout(() => {
          setInterruption(null);
        }, 5000);
      }

      if (data.score) {
        updateLiveScore({
          clarity: safeNumber(data.score.clarity, liveScore.clarity),
          relevance: safeNumber(data.score.relevance, liveScore.relevance),
          confidence: safeNumber(data.score.confidence, liveScore.confidence),
          structure: safeNumber(data.score.structure, liveScore.structure),
          evidence: safeNumber(data.score.evidence, liveScore.evidence),
          overall: safeNumber(data.score.overall, liveScore.overall),
        });
      }

      if (typeof data.pressureLevel === "number") {
        setPressureLevel(data.pressureLevel);
      }

      if (data.emotionState) {
        setEmotionState(data.emotionState);
      }

      if (Array.isArray(data.memoryUpdates)) {
        data.memoryUpdates.forEach((item) => {
          addRecruiterMemory({
            label: item.label,
            value: item.value,
            importance: item.importance,
          });
        });
      }
    } catch (error) {
      console.error(error);

      if (source === "text") {
        setAiReply("The recruiter connection failed. Please try again.");
      }
    } finally {
      if (source === "voice") {
        setIsAnalyzingVoice(false);
      } else {
        setIsThinking(false);
      }
    }
  }

  const handleTextSubmit = async () => {
    if (!answer.trim() || isThinking) return;

    const userAnswer = answer.trim();

    addTranscript({ speaker: "user", text: userAnswer });
    setLastUserAnswer(userAnswer);
    setAnswer("");

    await analyzeAnswer(userAnswer, "text");
  };

  function handleVoiceUserTranscript(text: string) {
    const cleanText = text.trim();

    if (cleanText.length < 12) return;

    const normalized = normalizeText(cleanText);
    const previous = normalizeText(lastVoiceAnswerRef.current);

    if (normalized === previous) return;

    if (previous && normalized.includes(previous)) {
      lastVoiceAnswerRef.current = cleanText;
    } else {
      lastVoiceAnswerRef.current = cleanText;

      addTranscript({
        speaker: "user",
        text: cleanText,
      });
    }

    setLastUserAnswer(cleanText);

    if (voiceAnalysisTimerRef.current) {
      clearTimeout(voiceAnalysisTimerRef.current);
    }

    voiceAnalysisTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      void analyzeAnswer(cleanText, "voice");
    }, 900);
  }

  const startVoiceMode = async () => {
    if (!publicKey || !assistantId) {
      setVapiStatus("error");
      setVapiError("Missing Vapi keys in .env.local");
      setLiveTranscript("Missing Vapi keys in .env.local");
      setLiveSpeaker("assistant");
      return;
    }

    if (
      vapiStartedRef.current ||
      vapiStatus === "starting" ||
      vapiStatus === "active"
    ) {
      return;
    }

    try {
      setMode("voice");
      setVapiError(null);
      setVapiStatus("starting");
      setVoiceMode(true);
      setVoiceState("starting");
      setLiveTranscript("Requesting microphone access...");
      setLiveSpeaker("assistant");

      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!vapiRef.current) {
        vapiRef.current = new Vapi(publicKey);
      }

      const vapi = vapiRef.current;
      vapiStartedRef.current = true;

      vapi.removeAllListeners?.();

      vapi.on("call-start", () => {
        if (!mountedRef.current) return;

        setVoiceMode(true);
        setVoiceState("listening");
        setVapiStatus("active");
        setVapiError(null);
        setLiveTranscript("Voice interview started. Speak after the recruiter finishes.");
        setLiveSpeaker("assistant");
      });

      vapi.on("speech-start", () => {
        if (!mountedRef.current) return;
        setVoiceState("speaking");
      });

      vapi.on("speech-end", () => {
        if (!mountedRef.current) return;
        setVoiceState("listening");
      });

      vapi.on("call-end", () => {
        if (!mountedRef.current) return;

        vapiStartedRef.current = false;
        setVoiceMode(false);
        setVoiceState("idle");
        setVapiStatus("ended");
        setVapiError(null);
        setLiveTranscript("Voice interview session ended.");
        setLiveSpeaker("assistant");
        endSession();
      });

      vapi.on("message", (message: any) => {
        if (!mountedRef.current) return;

        if (message?.type === "transcript") {
          const text = String(message?.transcript || "").trim();
          if (!text) return;

          const speaker = message.role === "user" ? "user" : "assistant";
          const isFinal =
            message.transcriptType === "final" ||
            message.isFinal === true ||
            message.final === true ||
            message.type === "transcript";

          setLiveSpeaker(speaker);
          setLiveTranscript(text);

          if (speaker === "assistant") {
            const previousLast =
              transcript.length > 0 ? transcript[transcript.length - 1]?.text : "";

            if (normalizeText(previousLast || "") !== normalizeText(text)) {
              addTranscript({
                speaker: "recruiter",
                text,
              });
            }
          }

          if (speaker === "user" && isFinal) {
            handleVoiceUserTranscript(text);
          }
        }

        if (message?.type === "end-of-call-report") {
          const reason = message?.endedReason || "unknown";
          setLiveTranscript(`Voice interview ended. Reason: ${reason}`);
          setLiveSpeaker("assistant");
        }
      });

      vapi.on("error", (error: any) => {
        if (!mountedRef.current) return;

        if (isNormalVapiEnd(error)) {
          setVapiStatus("ended");
          setVapiError(null);
        } else {
          const message = String(error?.message || error || "");
          setVapiStatus("error");
          setVapiError(message || "Voice interview ended unexpectedly.");
        }

        vapiStartedRef.current = false;
        setVoiceMode(false);
        setVoiceState("idle");
        setLiveTranscript("Voice session ended. Start again when you are ready.");
        setLiveSpeaker("assistant");
      });

      void vapi
        .start(assistantId, {
          variableValues: {
            targetRole,
            targetMarket,
            companyStyle,
            recruiterPersonality,
            recruiterMemory:
              recruiterMemory.length > 0
                ? recruiterMemory
                    .map((item) => `${item.label}: ${item.value}`)
                    .join("\n")
                : "No recruiter memory yet.",
            cvSummary: cvText
              ? cvText.slice(0, 2500)
              : "No CV uploaded. Ask role-relevant interview questions.",
            jobDescription: jobDescription
              ? jobDescription.slice(0, 2500)
              : "No job description provided.",
          },
        })
        .catch((error: unknown) => {
          if (!mountedRef.current) return;

          if (isNormalVapiEnd(error)) {
            setVapiStatus("ended");
            setVapiError(null);
            setLiveTranscript("Voice interview ended.");
          } else {
            const message = String((error as any)?.message || error || "");
            setVapiStatus("error");
            setVapiError(message || "Voice session could not start.");
            setLiveTranscript("Voice session could not start. Please try again.");
          }

          vapiStartedRef.current = false;
          setVoiceMode(false);
          setVoiceState("idle");
          setLiveSpeaker("assistant");
        });
    } catch (error) {
      if (isNormalVapiEnd(error)) {
        setVapiStatus("ended");
        setVapiError(null);
      } else {
        const message = String((error as any)?.message || error || "");
        setVapiStatus("error");
        setVapiError(message || "Microphone permission failed.");
        setLiveTranscript("Microphone permission failed. Please allow microphone access.");
      }

      vapiStartedRef.current = false;
      setVoiceMode(false);
      setVoiceState("idle");
      setLiveSpeaker("assistant");
    }
  };

  const stopVoiceMode = () => {
    try {
      vapiStartedRef.current = false;
      setVapiStatus("ending");
      vapiRef.current?.stop();
    } catch (error) {
      if (isNormalVapiEnd(error)) {
        setVapiStatus("ended");
        setVapiError(null);
      } else {
        const message = String((error as any)?.message || error || "");
        setVapiStatus("error");
        setVapiError(message || "Voice interview could not stop cleanly.");
      }
    } finally {
      setVoiceMode(false);
      setVoiceState("idle");
      setLiveTranscript("Voice interview stopped.");
      setLiveSpeaker("assistant");
      endSession();
    }
  };

  const toggleMute = () => {
    if (!vapiRef.current) return;

    if (voiceState === "muted") {
      vapiRef.current.setMuted(false);
      setVoiceState("listening");
    } else {
      vapiRef.current.setMuted(true);
      setVoiceState("muted");
    }
  };

  const memorySummary =
    recruiterMemory.length > 0
      ? recruiterMemory.map((item) => `${item.label}: ${item.value}`).join(" ")
      : "Memory is building during the interview.";

  const topicsMentioned = transcript
    .filter((item) => item.speaker === "user")
    .flatMap((item) =>
      item.text
        .split(/[,.]/)
        .map((part) => part.trim())
        .filter((part) => part.length > 8)
    )
    .slice(-5);

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-5 md:px-6">
        <header className="mb-5 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Image
              src="/workzo_icon.png"
              alt="WorkZo AI"
              width={48}
              height={48}
              className="rounded-2xl"
              priority
            />

            <div>
              <h1 className="text-xl font-semibold">WorkZo AI</h1>
              <p className="text-sm text-slate-400">
                AI Recruiter Simulation
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
              {targetRole}
            </div>

            <div className="rounded-full bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
              Mood: {emotionState || "neutral"}
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_420px]">
          <div className="flex flex-col rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="border-b border-white/10 p-8">
              <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
                Live AI Recruiter Session
              </div>

              <h1 className="mt-6 text-5xl font-bold leading-tight">
                Practice a real interview based on{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  your CV
                </span>
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-9 text-slate-300">
                WorkZo simulates recruiter interruptions, pressure, memory,
                emotional reactions, and company-specific interview behavior.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {!voiceMode ? (
                  <button
                    onClick={startVoiceMode}
                    className="rounded-3xl bg-blue-500 px-8 py-4 text-lg font-semibold transition hover:bg-blue-400"
                  >
                    🎤 Start Voice Interview
                  </button>
                ) : (
                  <>
                    <button
                      onClick={toggleMute}
                      className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 font-medium transition hover:bg-white/10"
                    >
                      {voiceState === "muted" ? "Unmute" : "Mute"}
                    </button>

                    <button
                      onClick={stopVoiceMode}
                      className="rounded-3xl border border-red-400/20 bg-red-500/10 px-6 py-4 font-medium text-red-200 transition hover:bg-red-500/20"
                    >
                      Stop Interview
                    </button>
                  </>
                )}

                <button
                  onClick={() => setMode("text")}
                  className={`rounded-3xl border px-8 py-4 text-lg font-medium transition ${
                    mode === "text"
                      ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  Type Answer
                </button>

                <Link
                  href="/results"
                  className="rounded-3xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-medium transition hover:bg-white/10"
                >
                  View Results
                </Link>
              </div>

              {vapiError && (
                <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {vapiError}
                </p>
              )}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {voiceMode && (
                <div className="rounded-[32px] border border-cyan-400/20 bg-cyan-500/10 p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-cyan-200">
                        Realtime Recruiter Voice
                      </p>

                      <h3 className="mt-3 text-3xl font-semibold">
                        {voiceState === "starting" && "Starting microphone"}
                        {voiceState === "listening" && "Listening to candidate"}
                        {voiceState === "speaking" && "Recruiter speaking"}
                        {voiceState === "muted" && "Microphone muted"}
                        {voiceState === "idle" && "Voice session idle"}
                      </h3>

                      {isAnalyzingVoice && (
                        <p className="mt-2 text-sm text-cyan-200">
                          Updating score and recruiter memory...
                        </p>
                      )}
                    </div>

                    <div className="flex h-24 items-end gap-2">
                      {[30, 50, 36, 70, 44, 62, 38, 56].map(
                        (height, index) => (
                          <span
                            key={index}
                            className={`w-2 rounded-full ${
                              voiceState === "speaking"
                                ? "animate-pulse bg-cyan-300"
                                : voiceState === "listening"
                                  ? "animate-bounce bg-green-300"
                                  : "bg-white/20"
                            }`}
                            style={{
                              height: `${height}px`,
                              animationDelay: `${index * 80}ms`,
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>

                  {liveTranscript && (
                    <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
                      <p className="text-sm text-slate-400">
                        {liveSpeaker === "user"
                          ? "You are saying"
                          : "Recruiter is saying"}
                      </p>

                      <p className="mt-3 text-lg leading-8 text-white">
                        {liveTranscript}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <RecruiterCard
                recruiterProfile={recruiterProfile}
                recruiterPersonality={
                  recruiterProfile?.title || recruiterPersonality
                }
                companyStyle={companyStyle}
                emotionState={emotionState || "neutral"}
                pressureLevel={pressureLevel}
                currentQuestion={
                  currentQuestion ||
                  `Tell me about yourself and keep it relevant to the ${targetRole} role.`
                }
                interruption={interruption}
                voiceState={voiceState}
              />

              <div className="rounded-[32px] border border-white/10 bg-black/20 p-5">
                <textarea
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Or type your answer here..."
                  className="w-full resize-none bg-transparent text-lg leading-8 outline-none placeholder:text-slate-500"
                />

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleTextSubmit}
                    disabled={isThinking || !answer.trim()}
                    className="rounded-2xl bg-blue-500 px-6 py-3 font-semibold transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isThinking
                      ? "Recruiter thinking..."
                      : "Submit Text Answer"}
                  </button>
                </div>
              </div>

              {aiReply && (
                <div className="rounded-[32px] border border-blue-400/20 bg-blue-500/10 p-6">
                  <p className="text-sm text-blue-200">Recruiter reply</p>
                  <p className="mt-3 whitespace-pre-line text-lg leading-8 text-white">
                    {aiReply}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-2xl font-semibold">Live Scoring</h3>

              {[
                ["Overall", liveScore.overall],
                ["Confidence", liveScore.confidence],
                ["Clarity", liveScore.clarity],
                ["Relevance", liveScore.relevance],
                ["Structure", liveScore.structure],
                ["Evidence", liveScore.evidence],
                ["Pressure", pressureLevel],
              ].map(([label, value]) => (
                <div key={String(label)} className="mt-5">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{label}</span>
                    <span>{safeNumber(value)}%</span>
                  </div>

                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${safeNumber(value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-2xl font-semibold">Recruiter Memory</h3>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                {memorySummary}
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-green-500/10 p-4">
                  <p className="text-sm text-green-200">Strengths</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {strengths.length > 0 ? strengths.join(", ") : "None yet."}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-500/10 p-4">
                  <p className="text-sm text-red-200">Weaknesses</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {weaknesses.length > 0
                      ? weaknesses.join(", ")
                      : "None yet."}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-200">Improvements</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {improvements.length > 0
                      ? improvements.join(", ")
                      : "None yet."}
                  </p>
                </div>

                <div className="rounded-2xl bg-purple-500/10 p-4">
                  <p className="text-sm text-purple-200">Topics</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {topicsMentioned.length > 0
                      ? topicsMentioned.join(", ")
                      : "None yet."}
                  </p>
                </div>

                {risks.length > 0 && (
                  <div className="rounded-2xl bg-orange-500/10 p-4">
                    <p className="text-sm text-orange-200">Recruiter Risks</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {risks.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-2xl font-semibold">Transcript</h3>

              <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-2">
                {transcript.length > 0 ? (
                  transcript.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 text-sm leading-6 ${
                        item.speaker === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-slate-200"
                      }`}
                    >
                      <p className="mb-1 text-xs font-semibold uppercase opacity-70">
                        {item.speaker === "user" ? "You" : "Recruiter"}
                      </p>
                      {item.text}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Transcript appears during the interview.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}