"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Mic,
  PlayCircle,
  Sparkles,
  User,
} from "lucide-react";

const demoCv = `Sarah Johnson
Customer Success Manager

Experience
Customer Success Specialist at CloudBridge SaaS
- Managed onboarding for B2B SaaS customers
- Reduced customer churn by improving onboarding handoff
- Worked with support, sales, and product teams
- Handled customer escalations and retention conversations

Skills
Customer onboarding, SaaS support, relationship management, CRM, renewals, communication`;

const demoJobDescription = `Customer Success Manager

We are looking for a Customer Success Manager to own onboarding, improve retention, manage customer relationships, identify expansion opportunities, and work cross-functionally with sales, support, and product teams.

Requirements
- SaaS or B2B customer-facing experience
- Strong communication and stakeholder management
- Comfortable with CRM tools
- Ability to handle objections and difficult customer conversations
- Experience improving retention, adoption, or customer satisfaction`;

function startDemoInterview() {
  if (typeof window === "undefined") return;

  const demoSetup = {
    candidateName: "Sarah Johnson",
    targetRole: "Customer Success Manager",
    targetCompany: "CloudBridge SaaS",
    recruiterId: "analytical_hiring_manager",
    recruiterName: "Daniel",
    recruiterTitle: "Analytical Hiring Manager",
    recruiterImage: "/recruiters/daniel.png",
    language: "en-US",
    cvText: demoCv,
    jobDescription: demoJobDescription,
  };

  window.localStorage.setItem("workzo_interview_setup", JSON.stringify(demoSetup));
  window.localStorage.setItem("workzo_demo_mode", "true");
  window.location.href = "/interview?demo=true";
}

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#050b14] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.20),transparent_34%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34%),linear-gradient(180deg,#050b14_0%,#08111f_55%,#050b14_100%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Link href="/onboarding" className="hidden rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-slate-200 hover:bg-white/[0.06] sm:inline-flex">
          Use my own CV
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_520px] lg:px-8 lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
            <PlayCircle className="h-3.5 w-3.5" />
            WorkZo Demo
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            Try a realistic interview without uploading anything.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            This demo uses a sample CV and job description so you can experience WorkZo AI immediately.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startDemoInterview}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-4 text-base font-black shadow-xl shadow-blue-500/20 transition hover:scale-[1.02]"
            >
              Start Demo Interview
              <ArrowRight className="h-5 w-5" />
            </button>

            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-base font-black text-slate-100 transition hover:bg-white/[0.08]"
            >
              Use my own CV
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["No upload", "Preloaded demo CV"],
              ["No setup", "Role already selected"],
              ["Fast test", "Enter interview room"],
            ].map(([title, subtitle]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-black">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#091323]/90 p-5 shadow-2xl">
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-400/10">
              <User className="h-7 w-7 text-blue-200" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Demo candidate</p>
              <h2 className="text-xl font-black">Sarah Johnson</h2>
              <p className="text-sm text-slate-300">Customer Success Manager</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-300" />
                <p className="font-black">Sample CV</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                SaaS onboarding, customer retention, escalations, CRM, cross-functional collaboration.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-violet-300" />
                <p className="font-black">Sample Job</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Customer Success Manager role focused on onboarding, retention, renewals, and customer relationships.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.07] p-4">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-emerald-300" />
                <p className="font-black">Demo recruiter</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Daniel will ask realistic follow-ups and challenge vague answers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
