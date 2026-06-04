import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarDays, LockKeyhole, RotateCcw, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import HistoryAnalyticsPing from "./HistoryAnalyticsPing";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  target_role: string | null;
  target_company: string | null;
  recruiter_name: string | null;
  recruiter_title: string | null;
  company_style: string | null;
  atmosphere: string | null;
  country: string | null;
  duration_seconds: number | null;
  overall_score: number | null;
  trust_score: number | null;
  verdict: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
  weakest_moment: Record<string, unknown> | null;
  created_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Recent";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Recent";
  }
}

function formatDuration(seconds?: number | null) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m ${secs}s`;
}

function scoreTone(score?: number | null) {
  if (score == null) return "text-slate-300";
  if (score >= 78) return "text-emerald-300";
  if (score >= 65) return "text-blue-300";
  if (score >= 50) return "text-amber-300";
  return "text-red-300";
}

function getVerdictText(session: SessionRow) {
  const verdictDecision = session.verdict?.decision;
  const summaryVerdict = session.summary?.verdict;
  if (typeof verdictDecision === "string" && verdictDecision.trim()) return verdictDecision;
  if (typeof summaryVerdict === "string" && summaryVerdict.trim()) return summaryVerdict;
  return "Saved interview report";
}

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-[#050b14] px-5 py-8 text-white">
        <HistoryAnalyticsPing isSignedIn={false} savedCount={0} />
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <LockKeyhole className="h-8 w-8 text-blue-200" />
            <h1 className="mt-4 text-3xl font-black">Sign in to view history</h1>
            <p className="mt-3 text-slate-300">Your saved interview reports will appear here after login.</p>
            <Link href="/login?redirect=/history" className="mt-6 inline-flex rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black">
              Sign in
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const { data: sessions, error } = await supabase
    .from("interview_sessions")
    .select("id, target_role, target_company, recruiter_name, recruiter_title, company_style, atmosphere, country, duration_seconds, overall_score, trust_score, verdict, summary, weakest_moment, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (sessions || []) as SessionRow[];
  const displayRows = rows.slice(0, 5);
  const hiddenPremiumCount = Math.max(0, rows.length - displayRows.length);

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-6 text-white sm:px-6">
      <HistoryAnalyticsPing isSignedIn={true} savedCount={rows.length} />
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <Link href="/interview" className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-black">
            <RotateCcw className="h-4 w-4" />
            Practice again
          </Link>
        </div>

        <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-white/[0.03] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Saved Practice</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Interview History</h1>
              <p className="mt-2 max-w-2xl text-slate-300">
                Review your past interview reports, scores, recruiter signals, and weakest moments.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Saved</p>
                <p className="mt-1 text-2xl font-black">{rows.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-slate-400">Account</p>
                <p className="mt-1 truncate text-sm font-black text-emerald-300">Active</p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="mt-5 rounded-3xl border border-red-300/20 bg-red-400/[0.07] p-5 text-red-100">
            <h2 className="font-black">Could not load interview history</h2>
            <p className="mt-2 text-sm leading-6">{error.message}</p>
          </section>
        ) : null}

        {rows.length === 0 && !error ? (
          <section className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-blue-200" />
            <h2 className="mt-4 text-2xl font-black">No saved interviews yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Complete an interview while signed in. Your report will be saved here automatically after the Results page opens.
            </p>
            <Link href="/interview" className="mt-6 inline-flex rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black">
              Start interview
            </Link>
          </section>
        ) : null}

        {hiddenPremiumCount > 0 ? (
          <section className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-400/[0.07] p-5 text-amber-50">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Premium History</p>
            <h2 className="mt-2 text-2xl font-black">Unlimited interview history</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-50/80">
              Free history shows your latest 5 interviews. Premium unlocks full session history, cross-session patterns, and long-term progress tracking.
            </p>
            <Link href="/pricing" className="mt-4 inline-flex rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950">
              View Premium
            </Link>
          </section>
        ) : null}

        <section className="mt-5 grid gap-4">
          {displayRows.map((session) => (
            <article key={session.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(session.created_at)}
                    </span>
                    {session.country ? <span>· {session.country}</span> : null}
                    {session.company_style ? <span>· {session.company_style}</span> : null}
                  </div>

                  <h2 className="mt-2 text-2xl font-black">{session.target_role || "Interview Practice"}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {session.recruiter_name || "AI Recruiter"}
                    {session.recruiter_title ? ` · ${session.recruiter_title}` : ""}
                    {session.target_company ? ` · ${session.target_company}` : ""}
                  </p>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{getVerdictText(session)}</p>
                </div>

                <div className="grid w-full grid-cols-3 gap-3 sm:min-w-[360px] lg:w-auto">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-500">Overall</p>
                    <p className={`mt-1 text-2xl font-black ${scoreTone(session.overall_score)}`}>{session.overall_score ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-500">Trust</p>
                    <p className={`mt-1 text-2xl font-black ${scoreTone(session.trust_score)}`}>{session.trust_score ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="mt-1 text-lg font-black">{formatDuration(session.duration_seconds)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-200" />
                  Saved report
                </div>
                {session.atmosphere ? (
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300">
                    {session.atmosphere}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
