"use client";

export type WorkZoEventName =
  | "page_view"
  | "cv_uploaded"
  | "cv_memory_ready"
  | "interview_room_viewed"
  | "interview_started"
  | "answer_submitted"
  | "voice_started"
  | "voice_stopped"
  | "voice_interruption"
  | "results_viewed"
  | "setup_cleared"
  | "product_hunt_asset_viewed";

export type WorkZoAnalyticsPayload = {
  event: WorkZoEventName;
  sessionId?: string;
  setupId?: string;
  role?: string;
  market?: string;
  recruiter?: string;
  mode?: "text" | "voice";
  score?: number;
  trust?: number;
  pressure?: number;
  metadata?: Record<string, unknown>;
};

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

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "";

  const key = "workzo-analytics-session";
  const existing = window.localStorage.getItem(key);

  if (existing) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  window.localStorage.setItem(key, id);
  return id;
}

export function trackWorkZoEvent(payload: WorkZoAnalyticsPayload) {
  if (typeof window === "undefined") return;

  // Do not send local development/testing events to founder analytics.
  if (isLocalHost()) return;

  const body = {
    ...payload,
    sessionId: payload.sessionId || getOrCreateSessionId(),
    path: window.location.pathname,
    host: window.location.host,
    origin: window.location.origin,
    isLocal: false,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };

  try {
    const serialized = JSON.stringify(body);

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

export function getWorkZoAnalyticsSessionId() {
  return getOrCreateSessionId();
}
