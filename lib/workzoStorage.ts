"use client";

export function clearExpiredInterviewState() {
  if (typeof window === "undefined") return;

  try {
    const last = window.localStorage.getItem("workzo-last-active-at");
    if (!last) return;

    const age = Date.now() - Number(last);
    const maxAge = 12 * 60 * 60 * 1000;

    if (age > maxAge) {
      window.localStorage.removeItem("workzo-current-step");
      window.localStorage.removeItem("workzo-active-route");
      window.localStorage.removeItem("workzo-onboarding-step");
      window.localStorage.removeItem("workzo-live-transcript");
      window.localStorage.removeItem("workzo-live-state");
    }
  } catch {
    // ignore storage errors
  }
}

export function touchWorkZoSession() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem("workzo-last-active-at", String(Date.now()));
  } catch {
    // ignore
  }
}
