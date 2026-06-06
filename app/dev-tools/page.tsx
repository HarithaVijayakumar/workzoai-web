"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  disableWorkZoFounderTestMode,
  enableWorkZoFounderTestMode,
  getWorkZoCurrentPlan,
  getWorkZoUsageSummary,
  resetWorkZoTestingUsage,
  setWorkZoCurrentPlan,
} from "@/lib/workzoUsageTracker";

type DevSummary = ReturnType<typeof getWorkZoUsageSummary>;

export default function DevToolsPage() {
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState<DevSummary | null>(null);
  const [plan, setPlan] = useState("free");

  function refresh() {
    if (typeof window === "undefined") return;
    setSummary(getWorkZoUsageSummary());
    setPlan(getWorkZoCurrentPlan());
  }

  function clearPremiumCheckoutState() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("workzo_pending_checkout");
    window.localStorage.removeItem("workzo_selected_plan_intent");
    window.localStorage.removeItem("workzo_pending_upgrade_route");
  }

  function testAsFreeCustomer() {
    disableWorkZoFounderTestMode();
    setWorkZoCurrentPlan("free");
    resetWorkZoTestingUsage();
    clearPremiumCheckoutState();
    refresh();
  }

  function testAsPremiumCustomer() {
    disableWorkZoFounderTestMode();
    setWorkZoCurrentPlan("premium");
    resetWorkZoTestingUsage();
    clearPremiumCheckoutState();
    refresh();
  }

  function testAsFounderUnlimited() {
    enableWorkZoFounderTestMode();
    setWorkZoCurrentPlan("premium");
    resetWorkZoTestingUsage();
    refresh();
  }

  useEffect(() => {
    setMounted(true);
    refresh();
  }, []);

  const displayPlan = mounted ? plan : "free";
  const displayTestMode = mounted && summary?.testMode ? "enabled" : "disabled";
  const interviewsUsed = mounted ? summary?.usage.interviewsStarted ?? 0 : 0;
  const interviewsRemaining = mounted ? summary?.interviewsRemaining ?? 0 : 0;
  const videoRemaining = mounted ? summary?.tavusInterviewsRemaining ?? 0 : 0;

  return (
    <main className="min-h-screen bg-[#050a12] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-black text-slate-300 hover:text-white">
          ← Back home
        </Link>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
            Founder testing
          </p>
          <h1 className="mt-3 text-4xl font-black">WorkZo Dev Tools</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Test Free customer mode, Premium customer mode, and Founder unlimited mode without Stripe.
          </p>

          <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200 sm:grid-cols-2 lg:grid-cols-5">
            <p>Current plan: <strong>{displayPlan}</strong></p>
            <p>Founder mode: <strong>{displayTestMode}</strong></p>
            <p>Used: <strong>{interviewsUsed}</strong></p>
            <p>Interviews left: <strong>{interviewsRemaining}</strong></p>
            <p>Video left: <strong>{videoRemaining}</strong></p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <button type="button" onClick={testAsFreeCustomer} className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-5 text-left hover:bg-emerald-400/15">
              <p className="text-lg font-black text-emerald-100">Test as Free Customer</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50/80">Free plan, founder mode off, usage reset.</p>
            </button>

            <button type="button" onClick={testAsPremiumCustomer} className="rounded-2xl border border-blue-300/20 bg-blue-400/10 p-5 text-left hover:bg-blue-400/15">
              <p className="text-lg font-black text-blue-100">Test as Premium Customer</p>
              <p className="mt-2 text-sm leading-6 text-blue-50/80">Premium plan, founder mode off, realistic paid-customer dashboard.</p>
            </button>

            <button type="button" onClick={testAsFounderUnlimited} className="rounded-2xl border border-violet-300/20 bg-violet-400/10 p-5 text-left hover:bg-violet-400/15">
              <p className="text-lg font-black text-violet-100">Founder Unlimited Test</p>
              <p className="mt-2 text-sm leading-6 text-violet-50/80">Premium with test mode enabled for repeated testing.</p>
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button type="button" onClick={() => { resetWorkZoTestingUsage(); refresh(); }} className="rounded-2xl border border-white/10 px-5 py-4 text-sm font-black text-slate-200 hover:bg-white/10">
              Reset usage only
            </button>

            <Link href="/dashboard" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-slate-950 hover:bg-slate-200">Open Dashboard</Link>
            <Link href="/results" className="rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-black text-slate-200 hover:bg-white/10">Open Results</Link>
            <Link href="/interview?test=1" className="rounded-2xl border border-white/10 px-5 py-4 text-center text-sm font-black text-slate-200 hover:bg-white/10">Open Interview</Link>
            <Link href="/pricing?intent=interview&test=1" className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-4 text-center text-sm font-black text-cyan-100 hover:bg-cyan-400/15 lg:col-span-2">Test Pricing Flow</Link>
            <Link href="/onboarding" className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-4 text-center text-sm font-black text-cyan-100 hover:bg-cyan-400/15 lg:col-span-2">Open Onboarding</Link>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-50/90">
            <p className="font-black text-amber-100">Before launch</p>
            <p className="mt-1">Use this on local or Vercel preview only, or protect this route before public launch.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
