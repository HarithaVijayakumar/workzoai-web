"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function getWorkZoAnalyticsSessionId() {
  if (typeof window === "undefined") return "server-session";

  try {
    const existing = window.localStorage.getItem("workzo_analytics_session_id");
    if (existing) return existing;

    const next = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem("workzo_analytics_session_id", next);
    return next;
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function trackWorkZoAnalyticsEvent(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getWorkZoAnalyticsSessionId(),
      event,
      path: window.location.pathname,
      origin: window.location.origin,
      host: window.location.hostname,
      isLocal: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
      environment: process.env.NODE_ENV,
      ...payload,
    }),
  }).catch(() => {});
}

function HistoryAnalyticsPingContent({ isSignedIn, savedCount }: { isSignedIn: boolean; savedCount: number }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    trackWorkZoAnalyticsEvent("history_viewed", {
      metadata: {
        isSignedIn,
        savedCount,
      },
    });

    if (searchParams.get("login") === "success") {
      trackWorkZoAnalyticsEvent("login_success", {
        metadata: {
          redirect: "/history",
        },
      });
    }
  }, [isSignedIn, savedCount, searchParams]);

  return null;
}

export default function HistoryAnalyticsPing(props: { isSignedIn: boolean; savedCount: number }) {
  return (
    <Suspense fallback={null}>
      <HistoryAnalyticsPingContent {...props} />
    </Suspense>
  );
}
