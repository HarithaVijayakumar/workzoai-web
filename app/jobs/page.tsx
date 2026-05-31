"use client";

import Link from "next/link";
import { ArrowLeft, Briefcase, Copy, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  normalizeSetupCvText,
  normalizeSetupJobDescription,
  normalizeSetupTargetMarket,
  normalizeSetupTargetRole,
  readLatestInterviewSetup,
} from "@/lib/workzoInterviewSetup";

function formatJobPlan(output: unknown) {
  if (!output) return "";
  if (typeof output === "string") return output;
  const plan = output as { role?: string; market?: string; keywords?: string[]; platforms?: string[]; plan?: string[]; suggestedTitles?: string[] };
  return [
    `Target role: ${plan.role || "Target Role"}`,
    `Target market: ${plan.market || "Global"}`,
    "",
    "Suggested search titles:",
    ...(plan.suggestedTitles || []).map((item) => `- ${item}`),
    "",
    "Keywords:",
    ...(plan.keywords || []).map((item) => `- ${item}`),
    "",
    "Platforms:",
    ...(plan.platforms || []).map((item) => `- ${item}`),
    "",
    "Application plan:",
    ...(plan.plan || []).map((item) => `- ${item}`),
  ].filter(Boolean).join("\n");
}

export default function JobsWorkspacePage() {
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("Target Role");
  const [targetMarket, setTargetMarket] = useState("Global");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const setup = readLatestInterviewSetup();
    setCvText(normalizeSetupCvText(setup));
    setJobDescription(normalizeSetupJobDescription(setup));
    setTargetRole(normalizeSetupTargetRole(setup) || "Target Role");
    setTargetMarket(normalizeSetupTargetMarket(setup) || "Global");
  }, []);

  async function handleGenerate() {
    setLoading(true);
    try {
      const mod = await import("@/lib/workzoWorkspaceGenerators");
      const output = mod.generateJobSearchPlan({ cvText, jobDescription, targetRole, targetMarket });
      setGenerated(formatJobPlan(output));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
  }

  return (
    <main className="min-h-screen bg-[#020817] px-5 py-5 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm font-black text-slate-300"><Briefcase className="h-4 w-4" /> Find Jobs</div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <h1 className="text-3xl font-black tracking-tight">Job search plan</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The job-search generator is lazy-loaded only when requested.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-400">Target role</span>
                <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-blue-400" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-400">Market</span>
                <input value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-blue-400" />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-400">CV context</span>
              <textarea value={cvText} onChange={(e) => setCvText(e.target.value)} rows={7} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-blue-400" />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-400">Job description</span>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={7} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-blue-400" />
            </label>
            <button onClick={handleGenerate} disabled={loading} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400 disabled:opacity-60">
              <Search className="h-4 w-4" /> {loading ? "Preparing…" : "Generate plan"}
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Plan</h2>
              <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/[0.09]">
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>
            <pre className="mt-5 min-h-[520px] whitespace-pre-wrap rounded-2xl bg-black/20 p-5 text-sm leading-7 text-slate-200">
              {generated || "Your job-search plan will appear here after generation."}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
