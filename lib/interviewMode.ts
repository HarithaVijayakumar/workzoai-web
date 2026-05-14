"use client";

export type WorkZoInterviewMode = "standard" | "tavus";

const MODE_KEY = "workzo-interview-mode";
const TAVUS_USAGE_KEY = "workzo-tavus-usage-minutes";
const DEFAULT_TAVUS_LIMIT_MINUTES = 10;

export function readInterviewMode(): WorkZoInterviewMode {
  if (typeof window === "undefined") return "standard";
  const stored = window.localStorage.getItem(MODE_KEY);
  return stored === "tavus" ? "tavus" : "standard";
}

export function saveInterviewMode(mode: WorkZoInterviewMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODE_KEY, mode);
}

export function getTavusUsageMinutes() {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(TAVUS_USAGE_KEY) || 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function addTavusUsageMinutes(minutes: number) {
  if (typeof window === "undefined") return 0;
  const next = getTavusUsageMinutes() + Math.max(0, minutes);
  window.localStorage.setItem(TAVUS_USAGE_KEY, String(Math.round(next * 100) / 100));
  return next;
}

export function resetTavusUsageMinutes() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TAVUS_USAGE_KEY);
}

export function getTavusLimitMinutes() {
  const raw = process.env.NEXT_PUBLIC_TAVUS_DEMO_MINUTES;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_TAVUS_LIMIT_MINUTES;
}

export function getTavusRemainingMinutes() {
  return Math.max(0, getTavusLimitMinutes() - getTavusUsageMinutes());
}

export function isTavusAvailable() {
  return getTavusRemainingMinutes() > 0;
}
