"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Video } from "lucide-react";
import {
  addTavusUsageMinutes,
  getTavusLimitMinutes,
  getTavusRemainingMinutes,
  getTavusUsageMinutes,
} from "@/lib/interviewMode";

type TavusRecruiterPanelProps = {
  recruiterName?: string;
  recruiterTrust?: number;
  pressure?: number;
  onLimitReached?: () => void;
};

export default function TavusRecruiterPanel({
  recruiterName = "Recruiter",
  recruiterTrust = 50,
  pressure = 50,
  onLimitReached,
}: TavusRecruiterPanelProps) {
  const [conversationUrl, setConversationUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedMinutes, setUsedMinutes] = useState(0);
  const usageTickRef = useRef<number | null>(null);

  useEffect(() => {
    setUsedMinutes(getTavusUsageMinutes());
  }, []);

  useEffect(() => {
    if (!conversationUrl) return;

    usageTickRef.current = window.setInterval(() => {
      const next = addTavusUsageMinutes(0.5);
      setUsedMinutes(next);

      if (getTavusRemainingMinutes() <= 0) {
        setError("Live video recruiter limit reached. Switch to Standard mode to continue.");
        onLimitReached?.();
      }
    }, 30000);

    return () => {
      if (usageTickRef.current) {
        window.clearInterval(usageTickRef.current);
        usageTickRef.current = null;
      }
    };
  }, [conversationUrl, onLimitReached]);

  async function startTavusConversation() {
    const remaining = getTavusRemainingMinutes();

    if (remaining <= 0) {
      setError("Live video recruiter limit reached. Use Standard mode or upgrade later.");
      onLimitReached?.();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tavus/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recruiterName,
          recruiterTrust,
          pressure,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Could not start Tavus conversation."
        );
      }

      const url =
        data?.conversationUrl ||
        data?.conversation_url ||
        data?.daily_room_url ||
        data?.dailyRoomUrl ||
        data?.raw?.conversation_url ||
        data?.raw?.daily_room_url ||
        data?.raw?.conversation?.url ||
        data?.raw?.url ||
        "";

      if (!url) {
        console.log("Tavus response:", data);
        throw new Error("Tavus did not return a usable conversation URL.");
      }

      setConversationUrl(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Tavus conversation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const limit = getTavusLimitMinutes();
  const remaining = Math.max(0, Math.round((limit - usedMinutes) * 10) / 10);

  if (conversationUrl) {
    return (
      <iframe
        src={conversationUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
        className="absolute inset-0 z-[20] h-full w-full border-0 bg-black"
        title={`${recruiterName} Tavus recruiter`}
      />
    );
  }

  return (
    <div className="absolute inset-0 z-[20] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="pointer-events-auto relative z-[90] mx-4 max-w-sm rounded-[28px] border border-white/10 bg-white/[0.06] p-5 text-center shadow-[0_24px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-100">
          <Video className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-xl font-black text-white">
          Live Video Recruiter
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Tavus-powered recruiter avatar for premium demo sessions.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-black text-slate-200">
          <div className="rounded-2xl bg-black/24 p-3">Trust {recruiterTrust}</div>
          <div className="rounded-2xl bg-black/24 p-3">Pressure {pressure}</div>
          <div className="rounded-2xl bg-black/24 p-3">{remaining}m left</div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={startTavusConversation}
          disabled={loading || remaining <= 0}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing Tavus...
            </>
          ) : remaining <= 0 ? (
            "Limit Reached"
          ) : (
            "Start Tavus Recruiter"
          )}
        </button>
      </div>
    </div>
  );
}
