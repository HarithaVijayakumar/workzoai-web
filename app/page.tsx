"use client";

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.25),transparent_45%)]"></div>

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-6 py-6">
        {/* HEADER */}
        <header className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Image
              src="/workzo_icon.png"
              alt="WorkZo AI"
              width={48}
              height={48}
              className="rounded-2xl"
            />

            <div>
              <h1 className="text-xl font-semibold">WorkZo AI</h1>
              <p className="text-sm text-slate-400">
                AI Recruiter Simulation Platform
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Realtime Voice
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              AI Recruiter
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Global Interview Modes
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/10 px-5 py-2 text-sm text-blue-200">
              Cinematic AI Interview Experience
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Practice interviews that feel like
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {" "}
                real recruiter calls
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-9 text-slate-300 md:text-xl">
              WorkZo AI simulates realistic recruiters with voice, memory,
              interruptions, emotional reactions, and company-specific interview
              styles based on your CV and target role.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/onboarding"
                className="rounded-3xl bg-blue-500 px-8 py-5 text-lg font-semibold transition hover:bg-blue-400"
              >
                Start Interview Simulation
              </Link>

              <button className="rounded-3xl border border-white/10 bg-white/5 px-8 py-5 text-lg font-medium transition hover:bg-white/10">
                Watch Demo
              </button>
            </div>

            {/* FEATURE GRID */}
            <div className="mt-20 grid gap-5 md:grid-cols-3">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                  🎤
                </div>

                <h3 className="text-xl font-semibold">
                  Realtime AI Recruiters
                </h3>

                <p className="mt-4 leading-8 text-slate-400">
                  Voice-based recruiters that interrupt, react emotionally, and
                  adapt dynamically to your answers.
                </p>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl">
                  🧠
                </div>

                <h3 className="text-xl font-semibold">
                  Recruiter Memory Engine
                </h3>

                <p className="mt-4 leading-8 text-slate-400">
                  Recruiters remember your earlier answers, challenge
                  contradictions, and ask realistic follow-up questions.
                </p>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl">
                  🌍
                </div>

                <h3 className="text-xl font-semibold">
                  Global Interview Modes
                </h3>

                <p className="mt-4 leading-8 text-slate-400">
                  Practice interviews for startups, big tech, consulting,
                  corporate, and country-specific hiring expectations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}