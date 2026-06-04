"use client";

import { ArrowLeft, Settings } from "lucide-react";
import RecruiterVideoPanel from "./RecruiterVideoPanel";
import InterviewScorePanel from "./InterviewScorePanel";
import LiveCopilotPanel from "./LiveCopilotPanel";
import LiveTranscriptPanel from "./LiveTranscriptPanel";
import InterviewProgressSection from "./InterviewProgressSection";
import type { InterviewLayoutProps } from "./types";

export default function InterviewMobileLayout({ setup, signal, transcript, ui, actions }: InterviewLayoutProps) {
  return (
    <main className="min-h-screen bg-[#050a12] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07101c]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={actions.onBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5" aria-label="Back to dashboard">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black">{setup.targetRole}</p>
            <p className="truncate text-xs text-slate-400">{setup.recruiterName} · {setup.language}</p>
          </div>
          <button type="button" onClick={actions.onToggleSettings} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <RecruiterVideoPanel
          setup={setup}
          statusLabel={ui.status === "listening" ? "Listening" : ui.status === "recruiter-speaking" ? "Speaking" : "Interested"}
          statusTone={ui.status === "listening" ? "LISTENING" : "LIVE"}
          onToggleMute={actions.onToggleMute}
          onOpenSettings={actions.onToggleSettings}
          onEnd={actions.onEnd}
        />
        <InterviewScorePanel signal={signal} scoreReady={ui.scoreReady} />
        <LiveTranscriptPanel
          transcript={transcript}
          collapsed={ui.transcriptCollapsed}
          onToggle={actions.onToggleTranscript}
          onClear={actions.onClearTranscript}
          showToggle
        />
        <LiveCopilotPanel signal={signal} enabled={ui.copilotEnabled} onToggle={actions.onToggleCopilot} />
        <InterviewProgressSection questionIndex={ui.questionIndex} progress={ui.progress} />
      </div>
    </main>
  );
}
