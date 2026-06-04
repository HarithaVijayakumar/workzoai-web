import Link from "next/link";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

export const metadata = {
  title: "Changelog | WorkZo AI",
};

const changes = [
  {
    version: "v0.9",
    title: "Launch-readiness foundation",
    date: "June 2026",
    items: [
      "Interview recovery and resume support",
      "Recruiter memory and candidate pattern tracking",
      "Trust score and recruiter interest tracking",
      "Weak answer detection and evidence requests",
      "Results intelligence with weakest answer and verdict",
      "Founder analytics for completion, recovery, and failure signals",
      "Mobile interview room polish",
      "Premium experience layer preparation",
      "Sentry error monitoring setup",
      "Privacy, terms, disclaimer, contact, and changelog pages",
    ],
  },
  {
    version: "v0.8",
    title: "Interview intelligence",
    date: "May 2026",
    items: [
      "Dynamic recruiter follow-ups",
      "Evidence-aware recruiter prompts",
      "Trust timeline",
      "Live Copilot",
      "Voice interview reliability improvements",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[#050b14] px-5 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to WorkZo AI
        </Link>

        <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-white/[0.03] p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
            <Sparkles className="h-3.5 w-3.5" />
            Product updates
          </div>
          <h1 className="mt-4 text-3xl font-black sm:text-5xl">WorkZo AI Changelog</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            A simple record of meaningful improvements as WorkZo AI moves toward launch.
          </p>
        </section>

        <section className="mt-6 space-y-5">
          {changes.map((change) => (
            <article key={change.version} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-blue-200">{change.version}</p>
                  <h2 className="mt-1 text-2xl font-black">{change.title}</h2>
                </div>
                <p className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-slate-300">
                  {change.date}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {change.items.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
