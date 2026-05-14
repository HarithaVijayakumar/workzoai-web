"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  clearAllInterviewSetup,
  readLatestInterviewSetup,
  type WorkZoInterviewSetup,
} from "@/lib/workzoInterviewSetup";

type LastResults = {
  overallScore?: number;
  recruiterTrust?: number;
  pressure?: number;
  transcript?: Array<{ role: string; text: string; time: string }>;
  memory?: {
    strengths?: string[];
    weaknesses?: string[];
    improvements?: string[];
  };
  scores?: {
    confidence?: number;
    clarity?: number;
    relevance?: number;
    evidence?: number;
    structure?: number;
  };
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function safeReadResults(): LastResults | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("workzo-last-results");
    return raw ? (JSON.parse(raw) as LastResults) : null;
  } catch {
    return null;
  }
}

function formatRecruiter(value?: string) {
  if (!value) return "Realistic recruiter";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clearResultsOnly() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem("workzo-last-results");
  } catch {
    // ignore
  }

  window.location.reload();
}

function exitToHome() {
  if (typeof window === "undefined") return;
  window.location.href = "/";
}

function StatCard({
  label,
  value,
  sub,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  sub: string;
  tone?: "blue" | "green" | "rose" | "cyan";
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-3 text-3xl font-black",
          tone === "green" && "text-emerald-300",
          tone === "rose" && "text-rose-300",
          tone === "cyan" && "text-cyan-300",
          tone === "blue" && "text-blue-300"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-400">{sub}</p>
    </div>
  );
}

function SidebarLink({
  icon,
  label,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition",
        active
          ? "bg-blue-500/22 text-white shadow-[0_12px_36px_rgba(37,99,235,0.20)]"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function SidebarButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition",
        danger
          ? "text-rose-300 hover:bg-rose-500/10"
          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SetupItem({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-black/22 p-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-sm font-black text-white">{value}</p>
      </div>
      <CheckCircle2
        className={cn("h-5 w-5", ready ? "text-emerald-300" : "text-slate-600")}
      />
    </div>
  );
}

function ActionCard({
  href,
  title,
  text,
  icon,
  primary,
}: {
  href: string;
  title: string;
  text: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border p-6 transition hover:-translate-y-1",
        primary
          ? "border-cyan-300/25 bg-gradient-to-br from-blue-600/24 via-cyan-500/12 to-slate-900"
          : "border-white/10 bg-white/[0.045] hover:bg-white/[0.07]"
      )}
    >
      {primary && (
        <div className="pointer-events-none absolute right-[-70px] top-[-70px] h-56 w-56 rounded-full bg-cyan-300/16 blur-[70px]" />
      )}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            primary ? "bg-cyan-300/18 text-cyan-100" : "bg-blue-500/12 text-blue-100"
          )}
        >
          {icon}
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
      </div>
      <h3 className="relative z-10 mt-5 text-xl font-black text-white">{title}</h3>
      <p className="relative z-10 mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </Link>
  );
}

function SettingsPanel() {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.24)]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Settings</h2>
        <Settings className="h-5 w-5 text-cyan-200" />
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        Manage setup, reset session data, or exit to the public landing page.
      </p>

      <div className="mt-5 grid gap-3">
        <Link
          href="/onboarding"
          className="flex items-center justify-between rounded-2xl bg-white/[0.06] p-4 text-sm font-black text-white transition hover:bg-white/[0.1]"
        >
          <span className="flex items-center gap-3">
            <Upload className="h-4 w-4 text-cyan-200" />
            Update CV/JD setup
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={clearResultsOnly}
          className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-4 text-left text-sm font-black text-slate-200 transition hover:bg-white/[0.08]"
        >
          <span className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4 text-blue-200" />
            Clear last result only
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            clearAllInterviewSetup();
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("workzo-last-results");
              window.location.href = "/onboarding";
            }
          }}
          className="flex items-center justify-between rounded-2xl bg-amber-400/8 p-4 text-left text-sm font-black text-amber-100 transition hover:bg-amber-400/12"
        >
          <span className="flex items-center gap-3">
            <RefreshCw className="h-4 w-4" />
            Start fresh setup
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={exitToHome}
          className="flex items-center justify-between rounded-2xl bg-rose-500/8 p-4 text-left text-sm font-black text-rose-100 transition hover:bg-rose-500/12"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4" />
            Exit to landing page
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [setup, setSetup] = useState<WorkZoInterviewSetup | null>(null);
  const [results, setResults] = useState<LastResults | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSetup(readLatestInterviewSetup());
    setResults(safeReadResults());
  }, []);

  const role = setup?.jobMemoryProfile?.roleTitle || setup?.targetRole || "No role selected";
  const market = setup?.targetMarket || "Global";
  const recruiter = formatRecruiter(setup?.recruiterPersonality);
  const hasCv = Boolean(setup?.cvText || setup?.recruiterMemoryProfile);
  const hasJd = Boolean(setup?.jobDescription || setup?.jobMemoryProfile);
  const hasRole = role !== "No role selected";

  const readiness = Math.round(
    (hasCv ? 35 : 0) +
      (hasJd ? 30 : 0) +
      (hasRole ? 20 : 0) +
      (setup?.recruiterPersonality ? 15 : 0)
  );

  const weakAreas = useMemo(() => {
    const fromResults = results?.memory?.weaknesses || [];
    if (fromResults.length) return fromResults.slice(0, 3);

    return ["Add measurable impact", "Use clearer STAR structure", "Connect examples to the JD"];
  }, [results]);

  const strengths = useMemo(() => {
    const fromResults = results?.memory?.strengths || [];
    if (fromResults.length) return fromResults.slice(0, 3);

    return hasCv && hasJd
      ? ["CV memory loaded", "JD context loaded", "Recruiter simulation ready"]
      : ["Complete setup to unlock recruiter memory"];
  }, [hasCv, hasJd, results]);

  const readyForInterview = hasCv && hasJd && hasRole;

  const nav = (
    <>
      <SidebarLink icon={<Home className="h-4 w-4" />} label="Dashboard" href="/dashboard" active />
      <SidebarLink icon={<Play className="h-4 w-4" />} label="Start Interview" href="/interview" />
      <SidebarLink icon={<Upload className="h-4 w-4" />} label="Update Setup" href="/onboarding" />
      <SidebarLink icon={<ClipboardList className="h-4 w-4" />} label="Results" href="/results" />
      <SidebarLink icon={<Settings className="h-4 w-4" />} label="Settings" href="#settings" />
      <SidebarButton icon={<LogOut className="h-4 w-4" />} label="Exit" onClick={exitToHome} danger />
    </>
  );

  return (
    <main className="min-h-screen bg-[#020712] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-260px] top-[-240px] h-[520px] w-[520px] rounded-full bg-blue-600/12 blur-[130px]" />
        <div className="absolute right-[-240px] top-[-180px] h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-[130px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[254px] shrink-0 border-r border-white/10 bg-slate-950/64 p-4 backdrop-blur-2xl lg:block">
          <Link href="/dashboard" className="mb-8 flex items-center gap-3">
            <Image
              src="/workzo_icon.png"
              alt="WorkZo AI"
              width={40}
              height={40}
              className="rounded-2xl"
            />
            <span className="text-xl font-black">WorkZo AI</span>
          </Link>

          <nav className="space-y-2">{nav}</nav>

          <div className="absolute bottom-4 left-4 right-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-black text-white">Beta mode</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Validate interview realism before adding premium avatar layers.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020712]/82 px-4 py-3 backdrop-blur-2xl lg:hidden">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3">
                <Image
                  src="/workzo_icon.png"
                  alt="WorkZo AI"
                  width={36}
                  height={36}
                  className="rounded-2xl"
                />
                <span className="text-lg font-black">WorkZo AI</span>
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {menuOpen && <nav className="mt-3 grid gap-2">{nav}</nav>}
          </header>

          <div className="mx-auto w-full max-w-[1420px] px-4 py-5 sm:px-6 lg:py-7">
            <section className="rounded-[34px] border border-white/10 bg-gradient-to-br from-blue-600/18 via-white/[0.045] to-cyan-400/10 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:p-8">
              <div className="grid gap-7 xl:grid-cols-[1fr_380px] xl:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                    <Sparkles className="h-4 w-4" />
                    Interview workspace
                  </div>
                  <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                    Practice the interview that actually matters.
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                    Your CV, job description, recruiter style, and interview result
                    all come together here.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={readyForInterview ? "/interview" : "/onboarding"}
                      className="inline-flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-4 text-sm font-black text-white shadow-[0_0_40px_rgba(34,211,238,0.30)] transition hover:scale-[1.02]"
                    >
                      <Play className="h-4 w-4" />
                      {readyForInterview ? "Start Interview" : "Complete Setup"}
                    </Link>
                    <Link
                      href="/results"
                      className="inline-flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/[0.06] px-7 py-4 text-sm font-black text-white transition hover:bg-white/10"
                    >
                      <ClipboardList className="h-4 w-4" />
                      View Results
                    </Link>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-slate-950/54 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                        Setup readiness
                      </p>
                      <p className="mt-2 text-4xl font-black text-emerald-300">
                        {readiness}%
                      </p>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-cyan-200" />
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-emerald-300"
                      style={{ width: `${readiness}%` }}
                    />
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {readyForInterview
                      ? "Everything needed for a CV-aware interview is loaded."
                      : "Complete CV, JD, and role setup to unlock realistic recruiter memory."}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Target role"
                value={role.length > 24 ? `${role.slice(0, 24)}…` : role}
                sub={market}
                tone="blue"
              />
              <StatCard
                label="Last score"
                value={results?.overallScore ? `${results.overallScore}/100` : "—"}
                sub={results?.overallScore ? "Latest result" : "No interview result yet"}
                tone="green"
              />
              <StatCard
                label="Recruiter trust"
                value={results?.recruiterTrust ? `${results.recruiterTrust}/100` : "—"}
                sub={results?.recruiterTrust ? "Last session" : "Appears after practice"}
                tone="cyan"
              />
              <StatCard
                label="Pressure"
                value={results?.pressure ? `${results.pressure}%` : "35%"}
                sub="Default realistic pressure"
                tone="rose"
              />
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
              <div className="grid gap-4 md:grid-cols-2">
                <ActionCard
                  primary
                  href="/onboarding"
                  icon={<Upload className="h-5 w-5" />}
                  title="Update CV and job description"
                  text="Replace the current setup with a new CV, target role, market, recruiter, or job description."
                />
                <ActionCard
                  href="/results"
                  icon={<ClipboardList className="h-5 w-5" />}
                  title="Review interview result"
                  text="See scores, recruiter perception, trust changes, weak answers, and next improvements."
                />
              </div>

              <aside className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.24)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-white">Current setup</h2>
                  <Settings className="h-5 w-5 text-cyan-200" />
                </div>

                <div className="mt-5 space-y-3">
                  <SetupItem label="CV memory" value={hasCv ? "Loaded" : "Missing"} ready={hasCv} />
                  <SetupItem label="Job description" value={hasJd ? "Loaded" : "Missing"} ready={hasJd} />
                  <SetupItem label="Role" value={role} ready={hasRole} />
                  <SetupItem label="Market" value={market} ready={Boolean(market)} />
                  <SetupItem label="Recruiter" value={recruiter} ready={Boolean(setup?.recruiterPersonality)} />
                </div>

                <Link
                  href="/onboarding"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  Edit setup
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </aside>
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
                <h2 className="text-xl font-black text-emerald-200">What looks strong</h2>
                <div className="mt-4 space-y-3">
                  {strengths.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl bg-emerald-400/8 p-3 text-sm text-slate-200"
                    >
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5">
                <h2 className="text-xl font-black text-rose-200">Focus areas</h2>
                <div className="mt-4 space-y-3">
                  {weakAreas.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-2xl bg-rose-400/8 p-3 text-sm text-slate-200"
                    >
                      <span className="mt-1 h-2 w-2 rounded-full bg-rose-300" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div id="settings">
                <SettingsPanel />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
