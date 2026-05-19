"use client";

export type WorkZoEventName =
  | "landing_viewed"
  | "onboarding_viewed"
  | "cv_uploaded"
  | "jd_added"
  | "interview_started"
  | "interview_completed"
  | "voice_started"
  | "voice_failed"
  | "voice_paused"
  | "voice_recovered"
  | "video_failed"
  | "video_fallback_used"
  | "copilot_opened"
  | "copilot_action_used"
  | "results_viewed"
  | "weak_answer_retried"
  | "feedback_submitted"
  | "waitlist_joined";

export type WorkZoAnalyticsPayload = {
  event: WorkZoEventName;
  setupId?: string;
  role?: string;
  market?: string;
  recruiter?: string;
  mode?: "voice" | "video" | "standard" | "copilot";
  score?: number;
  trust?: number;
  pressure?: number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

const STORAGE_KEY = "workzo-beta-analytics-events";

function safeNow() {
  return new Date().toISOString();
}

function isLocalHost() {
  if (typeof window === "undefined") return true;
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.") ||
    window.location.hostname.endsWith(".local")
  );
}

function trafficSource() {
  if (typeof window === "undefined") return "Direct / unknown";
  const params = new URLSearchParams(window.location.search);
  const explicit = params.get("utm_source") || params.get("ref") || params.get("source");
  if (explicit) return explicit;
  const referrer = document.referrer.toLowerCase();
  if (referrer.includes("producthunt")) return "Product Hunt";
  if (referrer.includes("linkedin")) return "LinkedIn";
  if (referrer.includes("instagram")) return "Instagram";
  if (referrer.includes("reddit")) return "Reddit";
  if (referrer.includes("twitter") || referrer.includes("x.com")) return "X/Twitter";
  return "Direct / unknown";
}

function getSessionId() {
  if (typeof window === "undefined") return "server";

  const key = "workzo-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, sessionId);
  return sessionId;
}

function sendToFounderApi(item: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(item);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([serialized], { type: "application/json" }));
      return;
    }

    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: serialized,
      keepalive: true,
    });
  } catch {
    // Analytics must never break the user flow.
  }
}

export function trackWorkZoLaunchEvent(payload: WorkZoAnalyticsPayload) {
  if (typeof window === "undefined") return;

  const item = {
    ...payload,
    sessionId: getSessionId(),
    timestamp: safeNow(),
    path: window.location.pathname,
    referrer: document.referrer,
    source: trafficSource(),
    userAgent: navigator.userAgent,
  };

  try {
    const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as unknown[];
    existing.push(item);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-500)));
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([item]));
  }

  sendToFounderApi(item);

  if (process.env.NODE_ENV !== "production") {
    console.info("[WorkZo launch analytics]", item);
  }
}

export function readWorkZoLaunchEvents() {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as unknown[];
  } catch {
    return [];
  }
}
