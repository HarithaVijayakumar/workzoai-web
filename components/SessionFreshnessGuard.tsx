"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const LAST_ACTIVE_KEY = "workzo-last-active-at";
const MAX_INACTIVE_MS = 1000 * 60 * 60 * 8; // 8 hours

const PROTECTED_ROUTES = [
  "/onboarding",
  "/dashboard",
  "/interview",
  "/results",
];

function shouldProtect(pathname: string) {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function SessionFreshnessGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const now = Date.now();
    const lastRaw = window.localStorage.getItem(LAST_ACTIVE_KEY);
    const lastActive = lastRaw ? Number(lastRaw) : 0;

    const isExpired = Boolean(lastActive && now - lastActive > MAX_INACTIVE_MS);

    if (isExpired && shouldProtect(pathname)) {
      try {
        window.localStorage.removeItem("workzo-last-results");
        window.localStorage.removeItem("workzo-analytics-session");
        window.sessionStorage.clear();
      } catch {
        // Ignore storage issues.
      }

      window.localStorage.setItem(LAST_ACTIVE_KEY, String(now));
      router.replace("/");
      return;
    }

    window.localStorage.setItem(LAST_ACTIVE_KEY, String(now));

    const markActive = () => {
      window.localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    };

    window.addEventListener("click", markActive);
    window.addEventListener("keydown", markActive);
    window.addEventListener("touchstart", markActive);
    window.addEventListener("visibilitychange", markActive);

    return () => {
      window.removeEventListener("click", markActive);
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("touchstart", markActive);
      window.removeEventListener("visibilitychange", markActive);
    };
  }, [pathname, router]);

  return null;
}
