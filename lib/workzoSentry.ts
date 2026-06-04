import * as Sentry from "@sentry/nextjs";

type WorkZoSeverity = "info" | "warning" | "error" | "fatal";

type WorkZoEventPayload = {
  area?: string;
  role?: string | null;
  recruiter?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
};

function browserSessionId() {
  if (typeof window === "undefined") return null;

  try {
    const existing = window.localStorage.getItem("workzo_analytics_session_id");
    if (existing) return existing;

    const next = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem("workzo_analytics_session_id", next);
    return next;
  } catch {
    return null;
  }
}

export function captureWorkZoEvent(
  eventName: string,
  payload: WorkZoEventPayload = {},
  severity: WorkZoSeverity = "info",
) {
  const sessionId = payload.sessionId || browserSessionId();

  Sentry.addBreadcrumb({
    category: "workzo",
    message: eventName,
    level: severity,
    data: {
      area: payload.area,
      role: payload.role,
      recruiter: payload.recruiter,
      sessionId,
      ...payload.metadata,
    },
  });

  Sentry.captureMessage(`workzo.${eventName}`, {
    level: severity,
    tags: {
      product: "workzo_ai",
      area: payload.area || "general",
      role: payload.role || "unknown",
      recruiter: payload.recruiter || "unknown",
    },
    extra: {
      sessionId,
      metadata: payload.metadata || {},
    },
  });
}

export function captureWorkZoException(
  error: unknown,
  payload: WorkZoEventPayload = {},
) {
  const sessionId = payload.sessionId || browserSessionId();

  Sentry.captureException(error, {
    tags: {
      product: "workzo_ai",
      area: payload.area || "general",
      role: payload.role || "unknown",
      recruiter: payload.recruiter || "unknown",
    },
    extra: {
      sessionId,
      metadata: payload.metadata || {},
    },
  });
}
