"use client";

import { useEffect } from "react";
import { setWorkZoCurrentPlan } from "@/lib/workzoUsageTracker";

function setPlanCookie(plan: string) {
  // Set a client-accessible cookie so API routes (copilot, interview) can read the plan
  // server-side without needing a DB call on every request.
  const maxAge = 60 * 60 * 24 * 90; // 90 days
  document.cookie = `workzo_plan=${plan}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export default function PremiumActivationClient({ active, plan = "premium" }: { active: boolean; plan?: string }) {
  useEffect(() => {
    if (!active) return;
    try {
      const normalizedPlan = plan === "premium_pro" || plan === "pro" ? "premium_pro" : "premium";
      setWorkZoCurrentPlan(normalizedPlan as "premium" | "premium_pro");
      setPlanCookie(normalizedPlan);
      window.localStorage.setItem(
        "workzo_subscription",
        JSON.stringify({
          plan: normalizedPlan,
          status: normalizedPlan,
          source: "stripe",
          updatedAt: new Date().toISOString(),
        }),
      );
      window.localStorage.removeItem("workzo_pending_checkout");
    } catch {}
  }, [active, plan]);

  return null;
}
