"use client";

export type WorkZoTelemetryEventName =
  | "interview_started"
  | "interview_completed"
  | "interview_abandoned"
  | "vapi_connected"
  | "vapi_failed"
  | "fallback_activated"
  | "reconnect_attempted"
  | "runtime_issue";

export type WorkZoTelemetryEvent = {
  id: string;
  event: WorkZoTelemetryEventName;
  createdAt: string;
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  userAgent?: string;
  data?: Record<string, unknown>;
};

export type WorkZoFounderTelemetrySummary = {
  version: 1;
  updatedAt: string;
  counters: {
    interviewsStarted: number;
    interviewsCompleted: number;
    interviewsAbandoned: number;
    vapiFailures: number;
    fallbackActivated: number;
    reconnectAttempts: number;
    runtimeIssues: number;
  };
  events: WorkZoTelemetryEvent[];
};

const STORAGE_KEY = "workzo-founder-telemetry-v1";
const MAX_EVENTS = 160;

function getDeviceType(): WorkZoTelemetryEvent["deviceType"] {
  if (typeof navigator === "undefined") return "unknown";

  const ua = navigator.userAgent || "";
  const isTablet =
    /ipad|tablet/i.test(ua) ||
    (/android/i.test(ua) && !/mobile/i.test(ua)) ||
    (typeof window !== "undefined" && window.innerWidth >= 700 && window.innerWidth <= 1180 && /touch/i.test(ua));

  if (isTablet) return "tablet";
  if (/iphone|ipod|android|mobile/i.test(ua)) return "mobile";
  return "desktop";
}

function createEmptyTelemetry(): WorkZoFounderTelemetrySummary {
  return {
    version: 1,
    updatedAt: "",
    counters: {
      interviewsStarted: 0,
      interviewsCompleted: 0,
      interviewsAbandoned: 0,
      vapiFailures: 0,
      fallbackActivated: 0,
      reconnectAttempts: 0,
      runtimeIssues: 0,
    },
    events: [],
  };
}

export function readFounderTelemetry(): WorkZoFounderTelemetrySummary {
  if (typeof window === "undefined") return createEmptyTelemetry();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyTelemetry();

    const parsed = JSON.parse(raw) as WorkZoFounderTelemetrySummary;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.events)) {
      return createEmptyTelemetry();
    }

    return {
      version: 1,
      updatedAt: parsed.updatedAt || "",
      counters: {
        ...createEmptyTelemetry().counters,
        ...(parsed.counters || {}),
      },
      events: parsed.events || [],
    };
  } catch {
    return createEmptyTelemetry();
  }
}

export function saveFounderTelemetry(next: WorkZoFounderTelemetrySummary) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...next,
        updatedAt: new Date().toISOString(),
        events: next.events.slice(0, MAX_EVENTS),
      }),
    );
  } catch {
    // Do not let analytics ever affect the interview runtime.
  }
}

export function recordFounderTelemetryEvent(
  event: WorkZoTelemetryEventName,
  data: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;

  const current = readFounderTelemetry();
  const createdAt = new Date().toISOString();

  const nextEvent: WorkZoTelemetryEvent = {
    id: `${event}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    event,
    createdAt,
    deviceType: getDeviceType(),
    userAgent: navigator.userAgent || "",
    data,
  };

  saveFounderTelemetry({
    ...current,
    updatedAt: createdAt,
    events: [nextEvent, ...current.events].slice(0, MAX_EVENTS),
  });
}

export function incrementFounderTelemetryCounter(
  counterName: keyof WorkZoFounderTelemetrySummary["counters"],
  amount = 1,
) {
  if (typeof window === "undefined") return;

  const current = readFounderTelemetry();

  saveFounderTelemetry({
    ...current,
    counters: {
      ...current.counters,
      [counterName]: Math.max(0, (current.counters[counterName] || 0) + amount),
    },
    updatedAt: new Date().toISOString(),
  });
}

export function recordFounderTelemetryRuntimeIssue(
  event: Extract<WorkZoTelemetryEventName, "vapi_failed" | "reconnect_attempted" | "runtime_issue">,
  error: unknown,
  data: Record<string, unknown> = {},
) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return String(error || "unknown_error");
            }
          })();

  if (event === "vapi_failed") {
    incrementFounderTelemetryCounter("vapiFailures");
  } else if (event === "reconnect_attempted") {
    incrementFounderTelemetryCounter("reconnectAttempts");
  } else {
    incrementFounderTelemetryCounter("runtimeIssues");
  }

  recordFounderTelemetryEvent(event, {
    ...data,
    errorMessage: String(message || "unknown_error").slice(0, 700),
  });
}

export function clearFounderTelemetry() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
