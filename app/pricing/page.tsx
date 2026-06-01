"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react";

const freeFeatures = [
  "Try Real Interview AI during beta",
  "Use demo interview",
  "Practice with CV and job context",
  "Get transcript and basic results",
];

const premiumFeatures = [
  "Advanced recruiter memory",
  "Deeper trust timeline",
  "Retry weakest answer",
  "More interview modes",
  "More role-specific preparation",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050b14] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34%),linear-gradient(180deg,#050b14_0%,#08111f_55%,#050b14_100%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Link href="/onboarding" className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-black">
          Start Free Interview
        </Link>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            Beta Pricing
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            Start free while WorkZo AI is in beta.
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-300">
            WorkZo is currently focused on Real Interview AI. Premium plans will be introduced after more beta feedback.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-blue-300/20 bg-blue-400/[0.07] p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">Free Beta</p>
            <div className="mt-4 flex items-end gap-2">
              <p className="text-5xl font-black">€0</p>
              <p className="pb-2 text-slate-300">during beta</p>
            </div>

            <p className="mt-4 leading-7 text-slate-300">
              Best for trying WorkZo and practicing interview conversations before your real interview.
            </p>

            <div className="mt-6 space-y-3">
              {freeFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <span className="text-slate-200">{feature}</span>
                </div>
              ))}
            </div>

            <Link
              href="/onboarding"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-4 text-base font-black"
            >
              Start Free Interview
              <ArrowRight className="h-5 w-5" />
            </Link>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">Premium</p>
            <div className="mt-4 flex items-end gap-2">
              <p className="text-5xl font-black">Soon</p>
              <p className="pb-2 text-slate-300">after beta</p>
            </div>

            <p className="mt-4 leading-7 text-slate-300">
              For candidates who want deeper feedback, advanced preparation, and stronger interview coaching.
            </p>

            <div className="mt-6 space-y-3">
              {premiumFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-violet-300" />
                  <span className="text-slate-200">{feature}</span>
                </div>
              ))}
            </div>

            <Link
              href="/demo"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-base font-black hover:bg-white/[0.08]"
            >
              Try Demo First
              <ArrowRight className="h-5 w-5" />
            </Link>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-black">Beta note</h2>
          <p className="mt-3 leading-7 text-slate-300">
            WorkZo AI is actively improving. Interview feedback should be used as preparation guidance, not as a final hiring decision.
          </p>
        </section>
      </section>
    </main>
  );
}
