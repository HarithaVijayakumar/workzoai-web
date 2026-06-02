"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  CreditCard,
  Database,
  History,
  LockKeyhole,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountState = {
  email: string;
  signedIn: boolean;
};

const preferenceCards = [
  {
    title: "Account",
    description: "Your login and saved interview history status.",
    icon: UserRound,
    status: "Active",
  },
  {
    title: "Plan",
    description: "Free launch account. Premium limits will be added before Stripe.",
    icon: CreditCard,
    status: "Free",
  },
  {
    title: "Data & privacy",
    description: "Your saved interview reports are linked to your account. CV data is not publicly visible.",
    icon: ShieldCheck,
    status: "Protected",
  },
  {
    title: "Notifications",
    description: "Email reminders and practice nudges will be added later.",
    icon: Bell,
    status: "Coming soon",
  },
];

export default function DashboardSettingsPage() {
  const [account, setAccount] = useState<AccountState>({ email: "", signedIn: false });
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        setAccount({ email: user?.email || "", signedIn: Boolean(user) });
      } catch {
        if (!active) return;
        setAccount({ email: "", signedIn: false });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#071225]/90 p-4 shadow-2xl shadow-black/20">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/workzo_icon.png" alt="WorkZo AI" width={42} height={42} className="rounded-2xl" />
            <div>
              <p className="text-lg font-black">WorkZo <span className="text-blue-400">AI</span></p>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Workspace</p>
            </div>
          </Link>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-white/[0.03] p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
            <Settings className="h-4 w-4" />
            Workspace settings
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Account & workspace</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                Manage your account status, saved history, plan, and privacy basics. Interview setup settings remain available separately from the interview room.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Account status</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400/15">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-emerald-200">{loading ? "Checking…" : account.signedIn ? "Signed in" : "Not signed in"}</p>
                  <p className="truncate text-sm text-slate-400">{account.email || "Sign in to save history"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {preferenceCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-400/10">
                    <Icon className="h-5 w-5 text-blue-200" />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black text-slate-300">
                    {item.status}
                  </span>
                </div>
                <h2 className="mt-5 text-xl font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-2xl font-black">Quick actions</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/history" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/[0.06]">
                <History className="h-5 w-5 text-blue-200" />
                <p className="mt-3 font-black">View interview history</p>
                <p className="mt-1 text-sm text-slate-400">Open saved reports and previous recruiter feedback.</p>
              </Link>

              <Link href="/settings" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/[0.06]">
                <Sparkles className="h-5 w-5 text-cyan-200" />
                <p className="mt-3 font-black">Edit interview setup</p>
                <p className="mt-1 text-sm text-slate-400">Change role, market, recruiter style, and language.</p>
              </Link>

              <Link href="/login" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/[0.06]">
                <LockKeyhole className="h-5 w-5 text-violet-200" />
                <p className="mt-3 font-black">Login page</p>
                <p className="mt-1 text-sm text-slate-400">Switch account or test auth flow safely.</p>
              </Link>

              <Link href="/founder-dashboard" className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/[0.06]">
                <Database className="h-5 w-5 text-emerald-200" />
                <p className="mt-3 font-black">Founder dashboard</p>
                <p className="mt-1 text-sm text-slate-400">View production-safe usage signals.</p>
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-2xl font-black">Session</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sign out only affects your local session. Saved interview reports remain in your account history.
            </p>

            {account.signedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-400/[0.08] px-5 py-3 text-sm font-black text-red-100 hover:bg-red-400/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            ) : (
              <Link href="/login?redirect=/dashboard/settings" className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400">
                Sign in
              </Link>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
