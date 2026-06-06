"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Gift, Lock, Sparkles, Tag, Video } from "lucide-react";
import {
  disableWorkZoFounderTestMode,
  recordWorkZoUpgradeClick,
  resetWorkZoTestingUsage,
  setWorkZoCurrentPlan,
} from "@/lib/workzoUsageTracker";

type PromoState = {
  code: string;
  valid: boolean;
  message: string;
  discountLabel: string;
};

const VALID_PROMOS: Record<string, { message: string; discountLabel: string }> = {
  EARLYACCESS: {
    message: "Early access code applied. Your discount will be carried into checkout when payments are enabled.",
    discountLabel: "Early access discount",
  },
  WORKZOEARLY: {
    message: "WorkZo early-user code applied. Your discount will be carried into checkout when payments are enabled.",
    discountLabel: "Early-user discount",
  },
  FOUNDERFRIEND: {
    message: "Founder friend code applied for testing. This stores your promo for checkout.",
    discountLabel: "Founder friend access",
  },
};

export default function PricingPage() {
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoState>({
    code: "",
    valid: false,
    message: "",
    discountLabel: "",
  });

  const normalizedPromo = useMemo(() => promoInput.trim().toUpperCase().replace(/\s+/g, ""), [promoInput]);

  function applyPromo() {
    if (!normalizedPromo) {
      setPromo({
        code: "",
        valid: false,
        message: "Enter a promo code.",
        discountLabel: "",
      });
      return;
    }

    const match = VALID_PROMOS[normalizedPromo];

    if (!match) {
      setPromo({
        code: normalizedPromo,
        valid: false,
        message: "This promo code is not valid.",
        discountLabel: "",
      });
      return;
    }

    setPromo({
      code: normalizedPromo,
      valid: true,
      message: match.message,
      discountLabel: match.discountLabel,
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "workzo_promo_code",
        JSON.stringify({
          code: normalizedPromo,
          discountLabel: match.discountLabel,
          createdAt: new Date().toISOString(),
        }),
      );
    }
  }

  function startFreeInterview() {
    disableWorkZoFounderTestMode();
    setWorkZoCurrentPlan("free");
    resetWorkZoTestingUsage();

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "workzo_selected_plan_intent",
        JSON.stringify({
          plan: "free",
          source: "pricing",
          next: "/onboarding",
          createdAt: new Date().toISOString(),
        }),
      );

      window.location.href = "/onboarding";
    }
  }

  function choosePremiumBeforeStripe() {
    recordWorkZoUpgradeClick();

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "workzo_pending_checkout",
        JSON.stringify({
          plan: "premium",
          source: "pricing",
          next: "/onboarding",
          promoCode: promo.valid ? promo.code : "",
          promoLabel: promo.valid ? promo.discountLabel : "",
          status: "stripe_not_connected_yet",
          createdAt: new Date().toISOString(),
        }),
      );

      window.location.href = "/login?next=/pricing&plan=premium";
    }
  }

  return (
    <main className="min-h-screen bg-[#050a12] px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>

        <section className="mt-10 text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
            Start with a real interview
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Practice first. Upgrade when you need deeper coaching.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Upload your CV, try realistic AI voice interviews, and see a useful results preview before choosing Premium.
          </p>
        </section>

        <section className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200">
              <Tag className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">Have a promo code?</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Enter your code here. It will be saved and used when Premium checkout is connected.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={promoInput}
                  onChange={(event) => setPromoInput(event.target.value)}
                  placeholder="Enter promo code"
                  className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300"
                >
                  Apply code
                </button>
              </div>
              {promo.message ? (
                <p className={`mt-3 text-sm font-bold ${promo.valid ? "text-emerald-300" : "text-rose-300"}`}>
                  {promo.message}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/[0.06] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">Free trial</p>
                <h2 className="mt-3 text-3xl font-black">2 AI Voice Interviews</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Try the core recruiter experience with your CV before paying.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-400/10 px-4 py-3 text-2xl font-black text-emerald-100">€0</div>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "Upload CV and job context",
                "2 realistic AI voice interviews",
                "CV + job-aware recruiter questions",
                "Adaptive follow-up questions",
                "Basic results preview",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={startFreeInterview}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-200"
            >
              Start Free Interview
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-blue-300/25 bg-blue-500/[0.08] p-7">
            <div className="absolute right-5 top-5 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">
              Premium
            </div>

            <div className="pr-24">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-200">Full toolkit</p>
              <h2 className="mt-3 text-3xl font-black">Go deeper with WorkZo AI</h2>
              <p className="mt-2 text-5xl font-black">
                €14.99<span className="text-xl text-white/50">/month</span>
              </p>
              {promo.valid ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                  <Gift className="h-3.5 w-3.5" />
                  {promo.discountLabel} applied
                </p>
              ) : null}
            </div>

            <ul className="mt-6 space-y-3">
              {[
                "25 interviews per month",
                "AI Video Recruiter access",
                "Full recruiter report and transcript",
                "Interview history and progress",
                "Improve CV, Cover Letter, and Job Assist",
                "Trust score, evidence requests, contradiction notes",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-200">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={choosePremiumBeforeStripe}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-400"
            >
              Upgrade to Premium
              <Lock className="h-4 w-4" />
            </button>

            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Video className="h-3.5 w-3.5" />
              Secure checkout will connect to this button.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
