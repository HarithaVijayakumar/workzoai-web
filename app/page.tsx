"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  FileText,
  Menu,
  Mic,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";

const wave = [12, 22, 15, 28, 18, 34, 13, 24, 19, 30, 16, 26, 20, 36, 15, 23, 18, 32];

const featureCards = [
  {
    icon: Mic,
    title: "Real-life interviews",
    text: "AI recruiter with real human behavior.",
  },
  {
    icon: FileText,
    title: "CV-aware",
    text: "Questions tailored to your experience.",
  },
  {
    icon: Zap,
    title: "Interrupts & probes",
    text: "Challenges vague answers instantly.",
  },
  {
    icon: Brain,
    title: "Smart feedback",
    text: "Shows trust, proof, and weak points.",
  },
  {
    icon: BarChart3,
    title: "Track progress",
    text: "Measure and improve over time.",
  },
];

function Waveform() {
  return (
    <div className="flex h-8 items-end gap-1 overflow-hidden">
      {wave.map((height, index) => (
        <span
          key={index}
          className="w-2 shrink-0 rounded-full bg-gradient-to-t from-blue-500 via-cyan-300 to-emerald-300"
          style={{
            height,
            animation: `wzWave 1.4s ease-in-out ${index * 0.05}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function InterviewPreview() {
  const [trust, setTrust] = useState(68);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTrust((value) => (value >= 74 ? 66 : value + 1));
    }, 1600);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-[28px] border border-cyan-200/15 bg-gradient-to-br from-cyan-300/12 via-blue-500/8 to-violet-500/10 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.38)] lg:max-w-none">
      <div className="relative min-h-[420px] overflow-hidden rounded-[22px] border border-white/10 bg-[#030712] lg:min-h-[470px]">
        <img
          src="/recruiters/sarah.png"
          alt="AI recruiter"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,7,18,.72)_0%,rgba(2,7,18,.25)_48%,rgba(2,7,18,.72)_100%),linear-gradient(180deg,rgba(2,7,18,.12)_0%,rgba(2,7,18,.12)_42%,rgba(2,7,18,.90)_100%)]" />

        <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-4 lg:min-h-[470px] lg:p-5">
          <div className="flex items-start justify-between">
            <div className="rounded-3xl border border-white/10 bg-slate-950/72 p-4 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-cyan-400/10">
                  <img
                    src="/recruiters/sarah.png"
                    alt="Recruiter"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
                </div>
                <div>
                  <p className="text-base font-black">AI Recruiter</p>
                  <p className="text-sm text-slate-300">Senior Hiring Manager</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-2xl">
              <ArrowRight className="h-5 w-5 -rotate-45" />
            </div>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative h-3 w-3 rounded-full bg-emerald-400">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
                </span>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                  Live interview
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-100">
                Trust {trust}/100
              </span>
            </div>

            <p className="text-xl font-black leading-snug text-white lg:text-2xl">
              “Tell me about a time you solved a complex problem with limited information.”
            </p>

            <div className="mt-5">
              <Waveform />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020712] text-white">
      <style jsx global>{`
        @keyframes wzWave {
          0% {
            transform: scaleY(0.5);
            opacity: 0.65;
          }
          100% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-220px] top-[-220px] h-[500px] w-[500px] rounded-full bg-blue-600/14 blur-[130px]" />
        <div className="absolute right-[-240px] top-[-160px] h-[500px] w-[500px] rounded-full bg-cyan-400/12 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
        <header className="rounded-[28px] border border-white/10 bg-slate-950/70 shadow-[0_20px_80px_rgba(0,0,0,0.30)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/workzo_icon.png"
                alt="WorkZo AI"
                width={44}
                height={44}
                priority
                className="rounded-2xl shadow-[0_0_26px_rgba(34,211,238,0.28)]"
              />
              <span className="text-2xl font-black tracking-tight sm:text-3xl">
                WorkZo <span className="text-blue-300">AI</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-8 lg:flex">
              {["Product", "Features", "How it works", "Pricing", "Resources"].map((item) => (
                <a
                  key={item}
                  href={item === "Features" ? "#features" : "#"}
                  className="inline-flex items-center gap-1 text-sm font-black text-slate-300 transition hover:text-white"
                >
                  {item}
                  {(item === "Product" || item === "Resources") && (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/sign-in"
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/onboarding"
                className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_32px_rgba(59,130,246,0.34)] transition hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {menuOpen && (
            <div className="border-t border-white/10 px-4 pb-4 lg:hidden">
              <div className="grid gap-2 pt-3">
                {["Product", "Features", "How it works", "Pricing", "Resources"].map((item) => (
                  <a
                    key={item}
                    href={item === "Features" ? "#features" : "#"}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-200"
                  >
                    {item}
                  </a>
                ))}
                <Link
                  href="/onboarding"
                  className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-center text-sm font-black text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </header>

        <section className="grid min-h-[calc(100vh-112px)] items-center gap-8 py-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-300/25 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-100">
              <Sparkles className="h-4 w-4" />
              AI interviewer that feels real
            </div>

            <h1 className="mt-6 text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Face a real interview{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                before the real one.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Practice with an AI recruiter that reads your CV, asks follow-up
              questions, interrupts vague answers, applies pressure, detects
              contradictions, and gives honest feedback.
            </p>

            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-cyan-100/90">
              WorkZo remembers your CV, tracks weak answers, and adapts the
              interview like a real recruiter.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-4 text-base font-black text-white shadow-[0_0_40px_rgba(59,130,246,0.34)] transition hover:scale-[1.02]"
              >
                Start Real Interview
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-4 text-base font-black text-white transition hover:bg-white/10"
              >
                <Upload className="h-5 w-5" />
                Upload CV
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div className="flex -space-x-3">
                {["👩🏽", "👨🏻", "👩🏼", "👨🏾", "👩🏻"].map((emoji, index) => (
                  <div
                    key={index}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#020712] bg-slate-800 text-base shadow-lg"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  Early beta users practicing real recruiter simulations
                </p>
                <p className="mt-1 text-sm font-black text-yellow-300">
                  ★★★★★ <span className="ml-2 text-white">Built for serious interview prep</span>
                </p>
              </div>
            </div>
          </div>

          <InterviewPreview />
        </section>

        <section
          id="features"
          className="mb-8 grid overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] shadow-[0_22px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:grid-cols-2 lg:grid-cols-5"
        >
          {featureCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="border-b border-white/10 p-5 sm:border-r lg:border-b-0"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/12 text-blue-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </div>
            );
          })}
        </section>

        <section className="mb-8 rounded-[30px] border border-white/10 bg-gradient-to-br from-blue-600/12 via-white/[0.045] to-cyan-400/10 p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
                <ShieldCheck className="h-4 w-4" />
                How WorkZo is different
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Not a question generator. A recruiter simulation.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                WorkZo focuses on how recruiters judge your answers: relevance,
                proof, confidence, ownership, and job fit.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Reads your CV", "Builds recruiter memory first."],
                ["Remembers answers", "Weak patterns affect follow-ups."],
                ["Challenges vague replies", "Pushes for proof and ownership."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-white/[0.05] p-4">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
