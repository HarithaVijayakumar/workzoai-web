"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  FileText,
  Mic,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";

import { useInterviewStore } from "@/store/interviewStore";

function hasContext(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

function safeCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

const featureCards = [
  {
    icon: Mic,
    title: "Real-life Interviews",
    text: "AI recruiter with human-like pressure and follow-ups",
  },
  {
    icon: FileText,
    title: "CV-Aware",
    text: "Questions tailored to your real experience",
  },
  {
    icon: Zap,
    title: "Interrupts & Probes",
    text: "Stops vague answers and asks for proof",
  },
  {
    icon: MessageCircle,
    title: "Smart Feedback",
    text: "Actionable feedback after every answer",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    text: "Measure trust, confidence, and readiness",
  },
];

const steps = [
  ["1", "Upload CV", "WorkZo reads your experience."],
  ["2", "Choose role", "Questions adapt to your target role."],
  ["3", "Face recruiter", "Practice with pressure and follow-ups."],
  ["4", "Get report", "See trust drops and next actions."],
];

const faces = ["👩🏽", "👨🏻", "👩🏼", "👨🏾", "👩🏻"];

const waveformHeights = [
  10, 18, 26, 12, 22, 16, 28, 20, 14, 24, 31, 13, 21, 17, 29, 23, 15, 27, 19,
  33, 14, 22, 16, 28, 20, 12, 25, 18, 30, 16, 24, 14, 29, 20, 26, 15, 31, 18,
];

export default function HomePage() {
  const { setup, persistentPatterns, answerHistory } = useInterviewStore();

  const hasCv = hasContext(setup.cvText);
  const hasRole = hasContext(setup.targetRole);
  const hasJob = hasContext(setup.jobDescription);

  const readinessScore = [hasCv, hasRole, hasJob].filter(Boolean).length;
  const ctaHref = hasCv && hasRole ? "/dashboard" : "/onboarding";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030812] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 top-0 h-[360px] w-[360px] rounded-full bg-blue-600/18 blur-[90px]" />
        <div className="absolute right-[-120px] top-[-80px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[95px]" />
        <div className="absolute bottom-[-220px] left-1/3 h-[420px] w-[420px] rounded-full bg-indigo-600/10 blur-[110px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1480px] flex-col px-4 py-4 lg:px-6">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-[0_0_24px_rgba(14,165,233,0.35)]">
              <Image
                src="/workzo_icon.png"
                alt="WorkZo AI"
                width={40}
                height={40}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div>
              <span className="block text-xl font-black tracking-tight">
                WorkZo AI
              </span>
              <span className="block text-[11px] font-medium text-slate-500">
                Real Interview AI
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 lg:flex">
            <button className="transition hover:text-white">Product⌄</button>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it Works
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#resources" className="transition hover:text-white">
              Resources
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:block"
            >
              Sign in
            </Link>
            <Link
              href={ctaHref}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-black text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:scale-[1.02]"
            >
              Get Started
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-6 py-5 lg:grid-cols-[0.88fr_1.12fr] lg:py-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-[640px]"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/12 px-3 py-2 text-xs font-bold text-indigo-200">
              <Sparkles className="h-4 w-4" />
              AI Interviewer That Feels Real
            </div>

            <h1 className="text-[42px] font-black leading-[0.96] tracking-[-0.055em] sm:text-[54px] xl:text-[64px]">
              Face a real interview{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                before the real one.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-300 md:text-base">
              Practice with an AI recruiter that reads your CV, asks follow-up
              questions, interrupts vague answers, applies pressure, detects
              contradictions, and gives honest feedback.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={ctaHref}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-black text-white shadow-[0_16px_36px_rgba(37,99,235,0.32)] transition hover:scale-[1.02]"
              >
                Start Real Interview
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Upload CV
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                {faces.map((face, index) => (
                  <div
                    key={index}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#030812] bg-slate-800 text-base"
                  >
                    {face}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-300">Loved by 10,000+ job seekers</p>
                <p className="text-xs font-black text-yellow-300">★★★★★ 4.9/5</p>
              </div>
            </div>

            <div className="mt-5 grid max-w-[560px] gap-3 sm:grid-cols-3">
              {[
                ["SETUP", `${readinessScore}/3 ready`],
                ["MEMORY", `${safeCount(persistentPatterns)} patterns`],
                ["SESSIONS", `${safeCount(answerHistory)} answers`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 backdrop-blur"
                >
                  <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1.5 text-base font-black text-slate-100">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-500/18 via-cyan-400/8 to-indigo-500/16 blur-2xl" />
            <div className="relative overflow-hidden rounded-[26px] border border-white/12 bg-slate-950/80 p-3 shadow-2xl backdrop-blur">
              <div className="relative h-[420px] overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(59,130,246,0.26),rgba(2,6,23,0.42)_44%,rgba(2,6,23,0.98)_100%)] xl:h-[455px]">
                <div className="absolute left-5 top-5 z-10 rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 shadow-xl backdrop-blur">
                  <p className="text-xs text-slate-400">AI Recruiter</p>
                  <p className="text-sm font-black">Senior Hiring Manager</p>
                </div>

                <div className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg">
                  ⛶
                </div>

                <div className="absolute inset-x-6 top-12 mx-auto flex h-[300px] max-w-[430px] items-end justify-center overflow-hidden rounded-b-[2rem] bg-gradient-to-b from-transparent via-slate-900/20 to-slate-950/70 xl:h-[330px]">
                  <div className="relative h-[300px] w-[260px] rounded-t-[9rem] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 shadow-[0_0_80px_rgba(14,165,233,0.2)] xl:h-[320px]">
                    <div className="absolute left-1/2 top-10 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-100 via-orange-200 to-orange-600 shadow-2xl" />
                    <div className="absolute left-1/2 top-[3.95rem] h-12 w-24 -translate-x-1/2 rounded-b-full bg-slate-900/35" />
                    <div className="absolute left-1/2 top-[12rem] h-40 w-60 -translate-x-1/2 rounded-t-[4rem] bg-gradient-to-br from-slate-100 via-stone-200 to-slate-500" />
                    <div className="absolute left-1/2 top-[13rem] h-36 w-36 -translate-x-1/2 rounded-t-[3rem] bg-gradient-to-b from-white to-slate-300" />
                  </div>
                </div>

                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-slate-950/88 p-4 shadow-2xl backdrop-blur">
                  <p className="text-sm font-semibold leading-6 text-white md:text-base md:leading-7">
                    Let’s start. Tell me about a time you solved a complex problem
                    with limited information.
                  </p>
                  <div className="mt-3 flex items-end gap-1">
                    {waveformHeights.map((height, index) => (
                      <span
                        key={index}
                        className="w-1 rounded-full bg-gradient-to-t from-blue-500 to-cyan-300"
                        style={{ height }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="pb-5">
          <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-2xl backdrop-blur md:grid-cols-5">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className={`p-4 ${
                    index !== featureCards.length - 1
                      ? "border-b border-white/10 md:border-b-0 md:border-r"
                      : ""
                  }`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/25 text-blue-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black text-white">{feature.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="pb-4">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                  How it works
                </p>
                <h2 className="mt-1 text-xl font-black">
                  Practice like a real recruiter call
                </h2>
              </div>
              <Brain className="hidden h-6 w-6 text-cyan-300 sm:block" />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {steps.map(([number, title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-black">
                    {number}
                  </div>
                  <h3 className="mt-4 text-sm font-black">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-5 left-5 z-20 hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/75 shadow-2xl md:flex">
        <Image
          src="/workzo_icon.png"
          alt="WorkZo AI"
          width={30}
          height={30}
          className="rounded-full"
        />
      </div>
    </main>
  );
}
