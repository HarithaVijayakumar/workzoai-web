"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/history";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("redirect", redirect);
    return url.toString();
  }, [redirect]);

  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) throw error;
      setStatus("sent");
      setMessage("Check your email for the secure login link.");
      trackWorkZoAnalyticsEvent("login_magic_link_sent", {
        metadata: { redirect },
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send login link.");
    }
    
  }

  async function signInWithGoogle() {
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) throw error;
      trackWorkZoAnalyticsEvent("login_google_started", {
        metadata: { redirect },
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not start Google login.");
    }
  }

  return (
    <main className="min-h-screen bg-[#050b14] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34%),linear-gradient(180deg,#050b14_0%,#08111f_55%,#050b14_100%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Link href="/demo" className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/[0.06]">
          Try Demo
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8 lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
            <LockKeyhole className="h-3.5 w-3.5" />
            Secure account
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            Save your interview progress.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Sign in to keep your interview reports, recruiter feedback, and practice history. You can still practice without signing in.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-4 text-base font-black"
            >
              Start Free Interview
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/history"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-base font-black hover:bg-white/[0.08]"
            >
              View History
            </Link>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-[#091323]/90 p-6 shadow-2xl">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-400/10">
            <ShieldCheck className="h-7 w-7 text-blue-200" />
          </div>

          <h2 className="mt-5 text-2xl font-black">Sign in</h2>
          <p className="mt-3 leading-7 text-slate-300">
            Use a magic link or Google. No password needed for the first safe launch version.
          </p>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={status === "loading"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-black hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Globe className="h-4 w-4" />
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={signInWithEmail} className="space-y-3">
            <label className="block text-sm font-bold text-slate-300" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-300/50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send magic link
            </button>
          </form>

          {message ? (
            <div className={`mt-5 rounded-2xl border p-4 text-sm leading-6 ${status === "error" ? "border-red-300/20 bg-red-400/[0.07] text-red-100" : "border-emerald-300/20 bg-emerald-400/[0.07] text-emerald-100"}`}>
              {message}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-400/[0.07] p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-200" />
              <p className="font-black">Launch-safe auth</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Login is only required for saved history. The interview room remains open and unchanged.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}