"use client";

import Link from "next/link";
import { ArrowLeft, Copy, FileText, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { readLatestInterviewSetup } from "@/lib/workzoInterviewSetup";

export default function CoverLetterWorkspacePage() {
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const setup = readLatestInterviewSetup();
    setCvText(String(setup?.cvText || setup?.uploadedCvText || setup?.resumeText || setup?.candidateCv || ""));
    setJobDescription(String(setup?.jobDescription || setup?.jdText || ""));
    setTargetRole(String(setup?.targetRole || setup?.role || setup?.jobTitle || ""));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    try {
      const mod = await import("@/lib/workzoWorkspaceGenerators");
      setGenerated(mod.generateCoverLetter({ cvText, jobDescription, targetRole }));
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
          <div className="flex items-center gap-2 text-sm font-black text-slate-300"><FileText className="h-4 w-4" /> Cover Letter</div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <h1 className="text-3xl font-black tracking-tight">Generate a cover letter</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              The generator is lazy-loaded only when you click Generate, keeping the page light.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-400">Target role</span>
                <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-blue-400" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-400">CV context</span>
                <textarea value={cvText} onChange={(e) => setCvText(e.target.value)} rows={8} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-blue-400" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[.18em] text-slate-400">Job description</span>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-blue-400" />
              </label>
              <button onClick={handleGenerate} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400 disabled:opacity-60">
                <Wand2 className="h-4 w-4" /> {loading ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Draft</h2>
              <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/[0.09]">
                <Copy className="h-4 w-4" /> Copy
              </button>
            </div>
            <pre className="mt-5 min-h-[520px] whitespace-pre-wrap rounded-2xl bg-black/20 p-5 text-sm leading-7 text-slate-200">
              {generated || "Your cover letter draft will appear here after generation."}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
