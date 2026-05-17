"use client";

export function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeWriteJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/private mode errors
  }
}

export function safeRemove(keys: string[]) {
  if (typeof window === "undefined") return;

  try {
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export function compactStoredEvents(key: string, max = 250) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    if (parsed.length > max) {
      window.localStorage.setItem(key, JSON.stringify(parsed.slice(-max)));
    }
  } catch {
    // ignore
  }
}

export function cleanupWorkZoRuntimeState() {
  safeRemove([
    "workzo-live-transcript",
    "workzo-live-state",
    "workzo-active-route",
    "workzo-current-step",
  ]);

  compactStoredEvents("workzo-beta-analytics-events", 300);
}
