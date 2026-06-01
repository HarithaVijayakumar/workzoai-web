"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  FileText,
  Mic,
  Sparkles,
} from "lucide-react";

const resources = [
  {
    title: "Interview Tips",
    description:
      "Learn how to answer behavioral questions with clear examples, metrics, and ownership.",
    icon: Mic,
    items: ["Use STAR structure", "Prepare measurable impact", "Practice follow-up questions"],
  },
  {
    title: "CV Tips",
    description:
      "Make your CV easier for recruiters to understand and align it with the target role.",
    icon: FileText,
    items: ["Match your CV to the job", "Use action verbs", "Add numbers where possible"],
  },
  {
    title: "Job Search Tips",
    description:
      "Understand the role before applying and prepare for what recruiters are likely to ask.",
    icon: Briefcase,
    items: ["Read the JD carefully", "Identify skill gaps", "Prepare role-specific stories"],
  },
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#050b14] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_34%),linear-gradient(180deg,#050b14_0%,#08111f_55%,#050b14_100%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Link href="/demo" className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-black">
          Try Demo
        </Link>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
            <BookOpen className="h-3.5 w-3.5" />
            Resources
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            Practical interview prep resources.
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-300">
            Simple guides to help you prepare stronger answers before using Real Interview AI.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <section key={resource.title} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-400/10 text-blue-200">
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-2xl font-black">{resource.title}</h2>
                <p className="mt-3 leading-7 text-slate-300">{resource.description}</p>

                <div className="mt-5 space-y-3">
                  {resource.items.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                      <span className="text-sm text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-10 rounded-[2rem] border border-violet-300/20 bg-violet-400/[0.07] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-violet-200">
                <Sparkles className="h-4 w-4" />
                Best next step
              </div>
              <h2 className="mt-3 text-3xl font-black">Practice with a realistic AI recruiter.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Reading tips helps, but practicing follow-up questions makes the biggest difference.
              </p>
            </div>

            <Link
              href="/onboarding"
              className="inline-flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-4 text-base font-black"
            >
              Start Free Interview
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
