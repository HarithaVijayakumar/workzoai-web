"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Mic,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";

const trustItems = [
  "CV + job based practice",
  "Dynamic recruiter follow-ups",
  "Trust timeline + weakest answer",
];

const quickFeatures = [
  {
    title: "Real Recruiter AI",
    text: "Follow-up questions based on your answers.",
    icon: Mic,
  },
  {
    title: "CV + Job Aware",
    text: "Practice for the exact role you want.",
    icon: FileText,
  },
  {
    title: "Live Copilot",
    text: "Know what to say next during practice.",
    icon: Zap,
  },
  {
    title: "Recruiter Feedback",
    text: "See score, trust, verdict, and weak answers.",
    icon: BarChart3,
  },
];

const steps = [
  ["01", "Add CV", "Paste or upload your resume."],
  ["02", "Add Job", "Add the target role or job description."],
  ["03", "Practice", "Start a realistic AI recruiter interview."],
  ["04", "Improve", "Review verdict, trust, and weakest answer."],
];

function InterviewRoomMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[650px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-blue-950/40 backdrop-blur">
      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07101f] text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">Live interview</p>
            <h3 className="mt-1 text-lg font-black">Daniel · Hiring Manager</h3>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
            Interested
          </span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[160px_1fr]">
          <div className="grid min-h-56 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-500/15">
                <UserRound className="h-8 w-8 text-blue-200" />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-300">AI Recruiter</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Current question</p>
              <p className="mt-2 text-sm leading-6 text-slate-100">
                Tell me about a customer situation where you influenced the outcome.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-slate-400">Trust</p>
                <p className="mt-1 text-3xl font-black text-blue-200">74</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs text-slate-400">Progress</p>
                <p className="mt-1 text-3xl font-black text-emerald-200">7/12</p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">Recruiter note</p>
              <p className="mt-2 text-sm leading-6 text-slate-100">
                Needs stronger metrics and clearer ownership.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 left-6 right-6 hidden rounded-2xl border border-white/10 bg-[#0b1424]/95 p-4 shadow-xl shadow-blue-950/40 backdrop-blur lg:block">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-200">Live Copilot</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">Use one real example and state the result.</p>
          </div>
          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">ON</span>
        </div>
      </div>
    </div>
  );
}

function ResultsMockup() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-blue-950/30">
      <div className="rounded-2xl border border-white/10 bg-[#07101f] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white">Interview Results</h3>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
            Engaged
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[110px_1fr]">
          <div className="grid h-24 w-24 place-items-center rounded-full border-[10px] border-blue-500 bg-blue-500/10">
            <div className="text-center">
              <p className="text-3xl font-black text-white">74</p>
              <p className="text-xs text-slate-400">/100</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              ["Confidence", "80/100"],
              ["Clarity", "70/100"],
              ["Relevance", "78/100"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl bg-white/[0.06] px-3 py-2 text-sm">
                <span className="text-slate-300">{label}</span>
                <span className="font-black text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/10 p-4">
          <p className="text-sm font-black text-amber-100">Weakest answer</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Too broad. Add one verified metric and explain your personal action.
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-200">Trust timeline</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[74%] rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">{children}</p>;
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050b14] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.22),transparent_35%),linear-gradient(180deg,#050b14_0%,#081221_55%,#050b14_100%)]" />
        <div className="absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/workzo_icon.png" alt="WorkZo AI" width={42} height={42} priority className="rounded-xl" />
            <span className="text-xl font-black tracking-tight sm:text-2xl">
              WorkZo <span className="text-blue-400">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#how" className="transition hover:text-white">How it works</a>
            <Link href="/pricing" className="transition hover:text-white">Pricing</Link>
            <Link href="/resources" className="transition hover:text-white">Resources</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08] sm:inline-flex">
              Login
            </Link>
            <Link href="/onboarding" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-blue-950/20 transition hover:bg-blue-50">
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1fr_650px] lg:px-8 lg:pb-24 lg:pt-14">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              Real Interview AI
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-[66px]">
              Practice real interviews before the real one.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              WorkZo AI helps you rehearse recruiter-style interviews based on your CV and target job, then shows exactly where recruiter trust dropped.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-4 text-base font-black text-white shadow-xl shadow-blue-950/30 transition hover:scale-[1.02]">
                Start Free Interview
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-base font-black text-white transition hover:bg-white/[0.08]">
                <PlayCircle className="h-5 w-5 text-blue-300" />
                Try Demo
              </Link>
            </div>

            <div className="mt-8 space-y-3">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="pb-8 lg:pb-0">
            <InterviewRoomMockup />
          </section>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#07101f] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
          {[
            ["Built for global job seekers", "Role, country, and job context can shape the interview."],
            ["Not a question bank", "The recruiter reacts to what you actually say."],
            ["Designed for confidence", "Practice pressure before it matters."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-black text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-[#050b14] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Why WorkZo</SectionLabel>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">More than interview questions.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            WorkZo focuses on recruiter realism: follow-ups, proof, ownership, metrics, and confidence under pressure.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-4">
          {quickFeatures.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-sm shadow-blue-950/10 transition hover:-translate-y-1 hover:bg-white/[0.06]">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-400/10 text-blue-200">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-black">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{card.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#07101f] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>Product experience</SectionLabel>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              A focused interview room, not a cluttered dashboard.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              See the recruiter, live guidance, score changes, and transcript in one calm space.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="rounded-2xl border border-white/10 bg-[#050b14] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-blue-200">Live Copilot</h3>
                <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-black">On</span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.08] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Say next</p>
                  <p className="mt-2 text-sm text-slate-100">Use one real example and state the result.</p>
                </div>

                <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.08] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Recruiter concern</p>
                  <p className="mt-2 text-sm text-slate-100">Answer needs stronger evidence and ownership.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-400">Trust</p>
                    <p className="mt-1 text-3xl font-black text-blue-200">70</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-400">Interest</p>
                    <p className="mt-1 text-3xl font-black text-emerald-200">67</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#050b14] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_520px]">
          <div>
            <SectionLabel>Interview results</SectionLabel>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              Know what to fix before your next interview.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Review recruiter verdict, trust timeline, weakest answer, and retry guidance after every practice session.
            </p>
          </div>

          <ResultsMockup />
        </div>
      </section>

      <section id="how" className="bg-[#07101f] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            From CV to interview feedback in minutes.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Start with your own material, or try the demo without uploading anything.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-4">
          {steps.map(([number, title, text]) => (
            <div key={number} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm font-black text-blue-300">{number}</p>
              <h3 className="mt-4 text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#050b14] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-300">Free beta</p>
            <h3 className="mt-3 text-3xl font-black">Start with interview practice</h3>
            <p className="mt-3 text-slate-300">Try WorkZo AI during beta and experience the real interview flow.</p>
            <Link href="/onboarding" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
              Start Free Interview
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-blue-300/20 bg-blue-400/[0.08] p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">Premium</p>
            <h3 className="mt-3 text-3xl font-black">Coming soon</h3>
            <p className="mt-3 text-slate-300">Advanced recruiter memory, deeper results, and more premium interview modes.</p>
            <Link href="/pricing" className="mt-7 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white">
              View Pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#07101f] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-gradient-to-r from-blue-600/20 to-violet-600/20 p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">Ready?</p>
          <h2 className="mt-3 text-3xl font-black sm:text-5xl">Practice your next interview today.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Start free, or try the demo first without uploading anything.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-slate-950">
              Start Free Interview
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-4 text-base font-black">
              Try Demo
              <PlayCircle className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#050b14] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© WorkZo AI · Beta</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/resources" className="hover:text-white">Resources</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
