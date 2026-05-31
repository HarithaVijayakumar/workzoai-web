"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Upload } from "lucide-react";
import { useEffect } from "react";
import { trackWorkZoLaunchEvent } from "@/lib/workzoLaunchAnalytics";

const featureItems = [
  "Realistic AI interviewer",
  "Follow-ups & interruptions",
  "Pressure simulation",
  "Honest feedback",
];

const proofItems = [
  "CV-aware questions",
  "JD-based follow-ups",
  "Contradiction checks",
  "Recruiter-style feedback",
];

export default function LandingPage() {
  useEffect(() => {
    trackWorkZoLaunchEvent({ event: "landing_viewed" });
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_12%_78%,rgba(34,211,238,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.92)_46%,rgba(15,23,42,0.78)_100%)]" />
      <div className="absolute inset-y-0 left-[28%] hidden w-px bg-white/[0.06] lg:block" />
      <div className="absolute inset-y-0 left-[56%] hidden w-px bg-white/[0.04] lg:block" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-10">
        <header className="flex min-h-[64px] items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-[#050b18]/76 px-4 shadow-[0_22px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:h-[78px] sm:rounded-[30px] sm:px-5 lg:px-7">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/workzo_icon.png"
              alt="WorkZo AI"
              width={52}
              height={52}
              className="h-11 w-11 rounded-2xl sm:h-[52px] sm:w-[52px]"
              priority
            />
            <span className="truncate text-[25px] font-black tracking-tight sm:text-[32px]">
              WorkZo <span className="text-blue-400">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-black text-slate-300 xl:flex">
            <Link href="/onboarding" className="hover:text-white">
              Product
            </Link>
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="#resources" className="hover:text-white">
              Resources
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden h-12 items-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 text-sm font-black text-white sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex h-11 items-center rounded-2xl bg-gradient-to-r from-sky-500 to-violet-600 px-4 text-sm font-black text-white shadow-[0_0_30px_rgba(59,130,246,0.28)] sm:h-12 sm:px-7"
            >
              Get Started
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:py-12">
          <div className="max-w-[720px] text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.06] px-4 py-2 text-sm font-black text-slate-100 backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              AI interviewer that feels real
            </div>

            <h1 className="mt-7 text-[clamp(48px,11vw,92px)] font-black leading-[0.9] tracking-[-0.06em] lg:text-[clamp(64px,6vw,112px)]">
              Face a real interview{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-500 to-violet-500 bg-clip-text text-transparent">
                before the real one.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-[650px] text-[17px] leading-8 text-slate-300 sm:text-[20px] sm:leading-9 lg:mx-0">
              Practice with an AI recruiter that reads your CV, asks follow-up
              questions, challenges vague answers, detects contradictions, and
              gives honest feedback.
            </p>

            <div
              id="features"
              className="mx-auto mt-8 grid max-w-[650px] grid-cols-2 gap-3 text-left text-sm font-bold text-slate-200 sm:grid-cols-4 lg:mx-0"
            >
              {featureItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-3 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/onboarding"
                className="inline-flex min-h-[60px] items-center justify-center gap-3 rounded-[24px] bg-gradient-to-r from-sky-500 to-violet-600 px-8 text-base font-black text-white shadow-[0_0_46px_rgba(59,130,246,0.35)] transition active:scale-[0.98]"
              >
                Start Real Interview
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/onboarding"
                className="inline-flex min-h-[60px] items-center justify-center gap-3 rounded-[24px] border border-white/[0.10] bg-white/[0.025] px-8 text-base font-black text-slate-100 backdrop-blur-xl transition hover:bg-white/[0.045] active:scale-[0.98]"
              >
                <Upload className="h-5 w-5" />
                Upload CV
              </Link>
            </div>

            <p className="mx-auto mt-4 max-w-[560px] text-center text-xs font-semibold leading-5 text-slate-500 lg:mx-0 lg:text-left">
              Beta product · validate AI feedback before real applications · your setup can be edited anytime.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[620px] lg:max-w-none">
            <div className="rounded-[34px] border border-white/[0.10] bg-white/[0.045] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-7">
              <div className="rounded-[28px] border border-white/[0.08] bg-[#030814]/82 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
                      Real Interview AI
                    </p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                      Recruiter simulation
                    </h2>
                  </div>
                  <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
                    Ready
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Trust Signal", "62/100", "Recoverable"],
                    ["Pressure", "High", "Follow-up incoming"],
                    ["Clarity", "65%", "Needs proof"],
                  ].map(([label, value, detail]) => (
                    <div
                      key={label}
                      className="rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-4"
                    >
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-3 text-3xl font-black text-white">
                        {value}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-black/20 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    Live transcript preview
                  </p>
                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                        AI Recruiter
                      </p>
                      <p className="mt-1.5 text-base leading-7 text-slate-100">
                        Tell me about a time you solved a complex problem with limited information.
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300">
                        You
                      </p>
                      <p className="mt-1.5 text-base leading-7 text-slate-200">
                        I took ownership, clarified the missing requirements, and delivered a working solution.
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">
                        AI Recruiter
                      </p>
                      <p className="mt-1.5 text-base leading-7 text-slate-100">
                        That is a start. Now give me proof. What changed because of your action?
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {proofItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm font-bold text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
