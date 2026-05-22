"use client";

import Image from "next/image";
import { cn } from "./uiHelpers";
import type { WorkZoRecruiterVisualState } from "@/lib/workzoPremiumExperienceEngine";

type RecruiterPresenceProps = {
  name: string;
  role?: string;
  imageSrc: string;
  state: WorkZoRecruiterVisualState;
  speaking?: boolean;
  trust?: number;
};

const stateLabel: Record<WorkZoRecruiterVisualState, string> = {
  listening: "Listening",
  thinking: "Thinking",
  skeptical: "Skeptical",
  interested: "Interested",
  interrupting: "Interrupting",
  typing_notes: "Typing notes",
  waiting: "Waiting",
  recovering_connection: "Recovering connection",
};

export default function RecruiterPresence({
  name,
  role = "AI Recruiter",
  imageSrc,
  state,
  speaking = false,
  trust = 72,
}: RecruiterPresenceProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(59,130,246,0.26),transparent_36%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.18),transparent_32%)]" />
      <div className="relative mx-auto flex max-w-sm flex-col items-center text-center">
        <div
          className={cn(
            "relative h-52 w-52 overflow-hidden rounded-full border border-white/15 bg-slate-950 shadow-[0_0_80px_rgba(37,99,235,0.28)] transition duration-500",
            speaking && "scale-[1.02] shadow-[0_0_95px_rgba(59,130,246,0.42)]",
            state === "skeptical" && "rotate-[-1deg]",
            state === "interested" && "scale-[1.03]",
            state === "interrupting" && "scale-[1.04] border-amber-300/40",
          )}
        >
          <Image src={imageSrc} alt={name} fill sizes="208px" className="object-cover" priority={false} />
          <div className="absolute inset-x-10 top-16 h-1 animate-pulse rounded-full bg-black/30" />
          <div className="absolute inset-x-12 bottom-10 h-2 animate-[pulse_2.8s_ease-in-out_infinite] rounded-full bg-white/10" />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-blue-100">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
          {stateLabel[state]}
        </div>

        <h2 className="mt-3 text-xl font-black text-white">{name}</h2>
        <p className="text-sm text-slate-300">{role}</p>

        <div className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 p-3 text-left">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Recruiter trust</span>
            <span>{Math.max(0, Math.min(100, trust))}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white/70 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, trust))}%` }} />
          </div>
        </div>

        {speaking && (
          <div className="mt-4 flex h-8 items-end gap-1">
            {[14, 28, 18, 34, 20, 30, 42, 24].map((height, index) => (
              <span
                key={index}
                className="w-1.5 animate-pulse rounded-full bg-white/70"
                style={{ height, animationDelay: `${index * 90}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
