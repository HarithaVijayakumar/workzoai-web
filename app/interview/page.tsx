"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  RotateCcw,
} from "lucide-react";

import StandardRecruiterPanel from "@/components/interview/StandardRecruiterPanel";
import TavusRecruiterPanel from "@/components/interview/TavusRecruiterPanel";
import {
  readInterviewMode,
  saveInterviewMode,
  type WorkZoInterviewMode,
} from "@/lib/interviewMode";
import { trackWorkZoEvent } from "@/lib/workzoAnalytics";
import {
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

const DEFAULT_QUESTION =
  "Good to meet you. I’ve reviewed your profile and the role details. Please introduce yourself briefly and connect your background to this position.";

function timeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSetup(input?: Partial<WorkZoInterviewSetup> | null): WorkZoInterviewSetup {
  const source = input || readLatestInterviewSetup();

  return {
    cvText: source.cvText || "",
    jobDescription: source.jobDescription || "",
    targetRole: source.targetRole || "General Role",
    targetMarket: source.targetMarket || "Global",
    companyStyle: source.companyStyle || "Realistic",
    recruiterPersonality: source.recruiterPersonality || "corporate_recruiter",
    language: source.language || "English",
    recruiterMemoryProfile: source.recruiterMemoryProfile || null,
    jobMemoryProfile: source.jobMemoryProfile || null,
    source: source.source || "latest-upload",
    setupVersion: 4,
    setupId: source.setupId || "",
    updatedAt: source.updatedAt || "",
  };
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function InterviewPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeSetup, setActiveSetup] = useState<WorkZoInterviewSetup>(() =>
    normalizeSetup(readLatestInterviewSetup())
  );
  const [interviewMode, setInterviewMode] = useState<WorkZoInterviewMode>("standard");
  const [hasStarted, setHasStarted] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Voice ready");
  const [voiceError, setVoiceError] = useState("");
  const [pressure, setPressure] = useState(35);
  const [recruiterTrust, setRecruiterTrust] = useState(46);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [roomResetKey, setRoomResetKey] = useState(0);

  const vapiRef = useRef<unknown>(null);

  const recruiterProfile = useMemo(
    () => getRecruiterVoiceProfile(activeSetup.recruiterPersonality),
    [activeSetup.recruiterPersonality]
  );

  const role = activeSetup.jobMemoryProfile?.roleTitle || activeSetup.targetRole || "General Role";
  const market = activeSetup.targetMarket || "Global";
  const memoryReady = Boolean(activeSetup.recruiterMemoryProfile);
  const jdReady = Boolean(activeSetup.jobMemoryProfile || activeSetup.jobDescription);
  const isTavusMode = interviewMode === "tavus";

  useEffect(() => {
    const latest = normalizeSetup(readLatestInterviewSetup());
    const mode = readInterviewMode();

    setActiveSetup(latest);
    setInterviewMode(mode);
    setIsHydrated(true);

    trackWorkZoEvent({
      event: "interview_room_viewed",
      setupId: latest.setupId,
      role: latest.jobMemoryProfile?.roleTitle || latest.targetRole,
      market: latest.targetMarket,
      recruiter: getRecruiterVoiceProfile(latest.recruiterPersonality).name,
      metadata: { interviewMode: mode },
    });
  }, []);

  useEffect(() => {
    return () => {
      const current = vapiRef.current as { stop?: () => void } | null;

      try {
        current?.stop?.();
      } catch {
        // Ignore stale voice cleanup.
      }

      vapiRef.current = null;
    };
  }, []);

  const changeInterviewMode = useCallback((mode: WorkZoInterviewMode) => {
    setInterviewMode(mode);
    saveInterviewMode(mode);
    setRoomResetKey((value) => value + 1);
    setVoiceError("");

    trackWorkZoEvent({
      event: "interview_mode_changed" as never,
      setupId: activeSetup.setupId,
      role,
      market,
      recruiter: recruiterProfile.name,
      metadata: { interviewMode: mode },
    });
  }, [activeSetup.setupId, market, recruiterProfile.name, role]);

  const startInterview = useCallback(() => {
    const setup = normalizeSetup(readLatestInterviewSetup());
    const saved = saveLatestInterviewSetup(setup);

    setActiveSetup(saved);
    setHasStarted(true);
    setTranscript([
      {
        role: "recruiter",
        text: DEFAULT_QUESTION,
        time: timeLabel(),
      },
    ]);

    trackWorkZoEvent({
      event: "interview_started",
      setupId: saved.setupId,
      role: saved.jobMemoryProfile?.roleTitle || saved.targetRole,
      market: saved.targetMarket,
      recruiter: recruiterProfile.name,
      mode: isTavusMode ? "voice" : "text",
      metadata: { interviewMode },
    });
  }, [interviewMode, isTavusMode, recruiterProfile.name]);

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
        // Ignore stale cleanup.
      }

      const VapiModule = await import("@vapi-ai/web");
      const Vapi = VapiModule.default;
      const vapi = new Vapi(publicKey);

      vapiRef.current = vapi;
      setVoiceStatus(`${recruiterProfile.name} voice connecting...`);

      vapi.on("call-start", () => {
        setVoiceActive(true);
        setVoiceStatus(`${recruiterProfile.name} is listening`);

        trackWorkZoEvent({
          event: "voice_started",
          setupId: activeSetup.setupId,
          role,
          market,
          recruiter: recruiterProfile.name,
          mode: "voice",
          metadata: { interviewMode },
        });
      });

      vapi.on("call-end", () => {
        setVoiceActive(false);
        setVoiceStatus("Voice stopped");

        trackWorkZoEvent({
          event: "voice_stopped",
          setupId: activeSetup.setupId,
          role,
          market,
          recruiter: recruiterProfile.name,
          mode: "voice",
          metadata: { interviewMode },
        });
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

          setTranscript((items): TranscriptItem[] =>
            [
              ...items,
              {
                role: roleFromVoice,
                text: payload.transcript || "",
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
  }, [activeSetup, interviewMode, market, recruiterProfile.name, recruiterProfile.role, role]);

  const stopVoiceInterview = useCallback(() => {
    const current = vapiRef.current as { stop?: () => void } | null;

    try {
      current?.stop?.();
    } catch {
      // Ignore stale cleanup.
    }

    vapiRef.current = null;
    setVoiceActive(false);
    setVoiceStatus("Voice stopped");
  }, []);

  const endInterview = useCallback(() => {
    stopVoiceInterview();
    setHasStarted(false);

    trackWorkZoEvent({
      event: "interview_ended" as never,
      setupId: activeSetup.setupId,
      role,
      market,
      recruiter: recruiterProfile.name,
      trust: recruiterTrust,
      pressure,
      metadata: { interviewMode },
    });
  }, [
    activeSetup.setupId,
    interviewMode,
    market,
    pressure,
    recruiterProfile.name,
    recruiterTrust,
    role,
    stopVoiceInterview,
  ]);

  const resetRoom = useCallback(() => {
    stopVoiceInterview();
    setHasStarted(false);
    setTranscript([]);
    setPressure(35);
    setRecruiterTrust(46);
    setRoomResetKey((value) => value + 1);
    setVoiceStatus("Voice ready");
    setVoiceError("");
  }, [stopVoiceInterview]);

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-[#020712] p-4 text-white">
        <div className="h-[calc(100vh-2rem)] animate-pulse rounded-[32px] border border-white/10 bg-white/[0.04]" />
      </main>
    );
  }

  return (
    <main className="wz-mobile-no-animation wz-mobile-bottom-safe min-h-screen overflow-hidden bg-[#020712] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-260px] top-[-220px] h-[520px] w-[520px] rounded-full bg-blue-600/13 blur-[120px]" />
        <div className="absolute right-[-220px] top-[-160px] h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />
      </div>

      <div className="relative z-10 flex h-screen flex-col p-3 sm:p-4">
        <header className="mb-3 flex shrink-0 items-center justify-between gap-3 rounded-[26px] border border-white/10 bg-white/[0.045] px-3 py-3 shadow-[0_18px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <Image
              src="/workzo_icon.png"
              alt="WorkZo AI"
              width={38}
              height={38}
              className="rounded-2xl shadow-[0_0_28px_rgba(14,165,233,0.32)]"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-black leading-tight sm:text-lg">WorkZo AI</p>
              <p className="hidden text-xs text-slate-400 sm:block">
                {isTavusMode ? "Live Video Recruiter" : "Standard AI Interview"}
              </p>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 justify-center gap-2 lg:flex">
            <span className="max-w-[260px] truncate rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-300">
              {role}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold text-slate-300">
              {market}
            </span>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
              {hasStarted ? "Live" : "Ready"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-black text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              href="/results"
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-black text-white transition hover:bg-white/10"
            >
              Results
            </Link>
          </div>
        </header>

        <section className="relative min-h-0 flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 shadow-[0_34px_120px_rgba(0,0,0,0.48)]">
          {isTavusMode ? (
            <TavusRecruiterPanel
              key={roomResetKey}
              recruiterName={recruiterProfile.name}
              recruiterTrust={recruiterTrust}
              pressure={pressure}
              onLimitReached={() => changeInterviewMode("standard")}
            />
          ) : (
            <StandardRecruiterPanel
              key={roomResetKey}
              recruiterName={recruiterProfile.name}
            />
          )}

          <div className="pointer-events-none absolute inset-0 z-[30] bg-[linear-gradient(180deg,rgba(2,7,18,.45)_0%,rgba(2,7,18,.05)_35%,rgba(2,7,18,.72)_100%)]" />

          <div className="absolute left-4 top-4 z-[50] rounded-3xl border border-white/10 bg-slate-950/64 p-4 shadow-2xl backdrop-blur-2xl sm:left-6 sm:top-6">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
              AI Recruiter
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-xl">
                {recruiterProfile.name.toLowerCase().includes("sarah")
                  ? "👩🏻‍💼"
                  : recruiterProfile.name.toLowerCase().includes("priya")
                    ? "👩🏽‍💼"
                    : "👨🏻‍💼"}
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-black text-white">{recruiterProfile.name}</p>
                <p className="text-sm text-slate-300">{recruiterProfile.role}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-black text-emerald-200">
                {memoryReady ? "CV memory" : "No CV memory"}
              </span>
              <span className="rounded-full bg-blue-400/12 px-3 py-1 text-xs font-black text-blue-100">
                {jdReady ? "JD ready" : "No JD"}
              </span>
            </div>
          </div>

          <div className="absolute right-4 top-4 z-[50] flex rounded-3xl border border-white/10 bg-slate-950/64 p-1 backdrop-blur-2xl sm:right-6 sm:top-6">
            <button
              type="button"
              onClick={() => changeInterviewMode("standard")}
              className={cn(
                "rounded-2xl px-4 py-2 text-xs font-black transition",
                !isTavusMode
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-white/10"
              )}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => changeInterviewMode("tavus")}
              className={cn(
                "rounded-2xl px-4 py-2 text-xs font-black transition",
                isTavusMode
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-300 hover:bg-white/10"
              )}
            >
              Live Video
            </button>
          </div>


          <div className="absolute inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-slate-950/78 p-3 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 sm:gap-3">
              {!hasStarted ? (
                <button
                  type="button"
                  onClick={startInterview}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:scale-[1.02]"
                >
                  <Play className="h-4 w-4" />
                  Start Interview
                </button>
              ) : (
                <button
                  type="button"
                  onClick={endInterview}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(244,63,94,0.22)] transition hover:scale-[1.02]"
                >
                  <PhoneOff className="h-4 w-4" />
                  End Interview
                </button>
              )}

              <button
                type="button"
                onClick={voiceActive ? stopVoiceInterview : startVoiceInterview}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.18)] transition hover:scale-[1.02]",
                  voiceActive
                    ? "bg-gradient-to-r from-red-500 to-rose-500"
                    : "bg-gradient-to-r from-blue-500 to-cyan-400"
                )}
              >
                {voiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {voiceActive ? "Stop Voice" : "Start Voice"}
              </button>

              <button
                type="button"
                onClick={resetRoom}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Room
              </button>
            </div>

            <p className="mt-2 text-center text-xs text-slate-500">
              {voiceStatus} · {transcript.length ? `${transcript.length} transcript events` : "Transcript starts when voice begins"}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
