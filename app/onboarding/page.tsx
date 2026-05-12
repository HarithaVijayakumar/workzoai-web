"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Check,
  FileText,
  Globe2,
  Lock,
  Mic,
  Sparkles,
  Upload,
} from "lucide-react";

import { useInterviewStore } from "@/store/interviewStore";

const recruiterOptions = [
  {
    id: "friendly_hr",
    name: "Sarah",
    title: "Friendly HR",
    avatar: "👩🏻‍💼",
    quote: "I'd love to understand how you work with people.",
  },
  {
    id: "analytical_hiring_manager",
    name: "Daniel",
    title: "Hiring Manager",
    avatar: "👨🏻‍💼",
    quote: "Can you prove the business impact behind that answer?",
  },
  {
    id: "startup_recruiter",
    name: "Priya",
    title: "Startup Recruiter",
    avatar: "👩🏽‍💼",
    quote: "What did YOU specifically own in that project?",
  },
  {
    id: "corporate_recruiter",
    name: "Markus",
    title: "Corporate Recruiter",
    avatar: "👨🏼‍💼",
    quote: "Please keep the answer concise and relevant.",
  },
];

const marketOptions = ["Global", "Germany", "US", "UK", "India", "Netherlands"];
const companyStyles = ["Realistic", "Startup", "Corporate", "Technical", "Consulting"];
const waveformHeights = [16, 22, 12, 28, 18, 26, 14, 31, 20, 24, 16, 30, 13, 22, 18, 27, 15, 25, 20, 32, 17, 23, 14, 29, 19, 26, 15, 30];

function hasValue(value: string) {
  return value.trim().length > 0;
}

export default function OnboardingPage() {
  const router = useRouter();
  const store = useInterviewStore() as any;
  const setup = store?.setup || {};
  const updateSetup = store?.updateSetup;

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(setup.targetRole || "");
  const [market, setMarket] = useState(setup.targetMarket || "Global");
  const [companyStyle, setCompanyStyle] = useState(setup.companyStyle || "Realistic");
  const [recruiterPersonality, setRecruiterPersonality] = useState(
    setup.recruiterPersonality || "analytical_hiring_manager"
  );
  const [jobDescription, setJobDescription] = useState(setup.jobDescription || "");
  const [cvText, setCvText] = useState(setup.cvText || "");
  const [cvFileName, setCvFileName] = useState("");
  const [cvError, setCvError] = useState("");
  const [isReadingCv, setIsReadingCv] = useState(false);

  const selectedRecruiter =
    recruiterOptions.find((item) => item.id === recruiterPersonality) ||
    recruiterOptions[1];

  const readinessScore = useMemo(() => {
    let score = 20;
    if (hasValue(cvText)) score += 25;
    if (hasValue(role)) score += 20;
    if (market) score += 10;
    if (companyStyle) score += 10;
    if (recruiterPersonality) score += 10;
    if (hasValue(jobDescription)) score += 5;
    return Math.min(score, 100);
  }, [cvText, role, market, companyStyle, recruiterPersonality, jobDescription]);

  async function handleCvUpload(file: File | null) {
    if (!file) return;

    setCvError("");
    setCvFileName(file.name);
    setIsReadingCv(true);

    try {
      if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        const text = await file.text();
        setCvText(text);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "CV extraction failed");
      }

      const extractedText =
        data?.text || data?.cvText || data?.content || data?.extractedText || "";

      if (!extractedText) {
        throw new Error("No readable text found");
      }

      setCvText(extractedText);
      setCvError(data?.warning || "");
    } catch (error) {
      console.error(error);
      setCvError(
        "Could not fully read this CV. Please paste your CV text manually below."
      );
    } finally {
      setIsReadingCv(false);
    }
  }

  function saveSetupAndStart() {
    const nextSetup = {
      targetRole: role.trim() || "General Role",
      targetMarket: market,
      companyStyle,
      recruiterPersonality,
      cvText,
      jobDescription,
    };

    if (typeof updateSetup === "function") {
      updateSetup(nextSetup);
    }

    try {
      localStorage.setItem(
        "workzo:onboarding",
        JSON.stringify({
          ...nextSetup,
          recruiter: selectedRecruiter,
          createdAt: new Date().toISOString(),
        })
      );
    } catch {
      // localStorage can fail in private mode.
    }

    router.push("/interview");
  }

  const steps = [
    { number: 1, label: "Upload CV" },
    { number: 2, label: "Job Role" },
    { number: 3, label: "Preferences" },
    { number: 4, label: "Preview" },
    { number: 5, label: "Start" },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-160px] top-[-120px] h-[420px] w-[420px] rounded-full bg-blue-600/18 blur-[95px]" />
        <div className="absolute right-[-180px] top-[-80px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[95px]" />
        <div className="absolute bottom-[-220px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-600/12 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1450px] flex-col px-4 py-4 lg:px-6">
        <header className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Onboarding
          </button>

          <div className="hidden items-center gap-2 md:flex">
            {steps.map((item, index) => (
              <button
                key={item.number}
                onClick={() => setStep(item.number)}
                className="flex items-center gap-2"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black transition ${
                    step === item.number
                      ? "border-blue-400 bg-blue-600 text-white shadow-[0_0_22px_rgba(37,99,235,0.45)]"
                      : item.number < step
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                        : "border-white/15 bg-white/8 text-slate-300"
                  }`}
                >
                  {item.number < step ? <Check className="h-4 w-4" /> : item.number}
                </span>
                <span className="text-xs text-slate-300">{item.label}</span>
                {index < steps.length - 1 && <span className="h-px w-8 bg-white/15" />}
              </button>
            ))}
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex min-h-0 flex-col">
            <div className="flex flex-1 flex-col rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-2xl backdrop-blur-2xl">
              {step === 1 && (
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15">
                      <Upload className="h-5 w-5 text-blue-200" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black md:text-3xl">Upload your CV</h1>
                      <p className="mt-1 text-sm text-slate-400">
                        We’ll extract your experience and tailor the interview.
                      </p>
                    </div>
                  </div>

                  <label className="flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-white/25 bg-[#050b16] p-5 text-center transition hover:border-blue-400/60 hover:bg-blue-500/5">
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      className="hidden"
                      onChange={(event) => handleCvUpload(event.target.files?.[0] || null)}
                    />
                    <Upload className="h-9 w-9 text-slate-300" />
                    <p className="mt-4 text-lg font-black">
                      {isReadingCv ? "Reading your CV..." : "Drag & drop your CV here"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      PDF, DOCX or TXT · Max 10MB
                    </p>
                    <span className="mt-5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-2.5 text-sm font-black text-white">
                      Choose File
                    </span>
                  </label>

                  {cvFileName && (
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
                          <FileText className="h-4 w-4 text-red-200" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{cvFileName}</p>
                          <p className="text-xs text-slate-500">
                            {cvText.trim() ? "Ready for recruiter analysis" : "Upload received"}
                          </p>
                        </div>
                      </div>
                      <Check className="h-5 w-5 text-emerald-300" />
                    </div>
                  )}

                  {cvError && (
                    <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                      {cvError}
                    </p>
                  )}

                  <textarea
                    value={cvText}
                    onChange={(event) => setCvText(event.target.value)}
                    placeholder="Or paste your CV text here..."
                    className="mt-4 min-h-[105px] w-full resize-none rounded-2xl border border-white/10 bg-[#050b16] p-4 text-sm leading-6 outline-none placeholder:text-slate-600 focus:border-blue-400"
                  />
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15">
                      <Briefcase className="h-5 w-5 text-blue-200" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black md:text-3xl">
                        What role are you preparing for?
                      </h1>
                      <p className="mt-1 text-sm text-slate-400">
                        The recruiter will adapt questions to this role.
                      </p>
                    </div>
                  </div>

                  <input
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="Example: Junior Data Analyst"
                    className="w-full rounded-2xl border border-white/10 bg-[#050b16] px-5 py-4 text-base outline-none placeholder:text-slate-600 focus:border-blue-400"
                  />

                  <textarea
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Optional: paste the job description here for stronger CV/JD-based questions..."
                    className="mt-4 min-h-[240px] w-full resize-none rounded-2xl border border-white/10 bg-[#050b16] p-4 text-sm leading-7 outline-none placeholder:text-slate-600 focus:border-blue-400"
                  />
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15">
                      <Globe2 className="h-5 w-5 text-blue-200" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black md:text-3xl">
                        Choose interview style
                      </h1>
                      <p className="mt-1 text-sm text-slate-400">
                        Adapt expectations by market, company style, and recruiter personality.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Target market
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {marketOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => setMarket(option)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                            market === option
                              ? "bg-blue-500 text-white"
                              : "bg-white/10 text-slate-300 hover:bg-white/15"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Company style
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {companyStyles.map((option) => (
                        <button
                          key={option}
                          onClick={() => setCompanyStyle(option)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                            companyStyle === option
                              ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white"
                              : "bg-white/10 text-slate-300 hover:bg-white/15"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {recruiterOptions.map((recruiter) => (
                      <button
                        key={recruiter.id}
                        onClick={() => setRecruiterPersonality(recruiter.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          recruiterPersonality === recruiter.id
                            ? "border-blue-400 bg-blue-500/15"
                            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-black">
                              {recruiter.name} · {recruiter.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
                              “{recruiter.quote}”
                            </p>
                          </div>
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                            {recruiter.avatar}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15">
                      <Sparkles className="h-5 w-5 text-blue-200" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black md:text-3xl">
                        Preview your interview
                      </h1>
                      <p className="mt-1 text-sm text-slate-400">
                        WorkZo is ready to simulate a real recruiter call.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["CV", cvText.trim() ? "Ready" : "Missing"],
                      ["Target role", role.trim() || "General Role"],
                      ["Market", market],
                      ["Company style", companyStyle],
                      ["Recruiter", `${selectedRecruiter.name} · ${selectedRecruiter.title}`],
                      ["JD context", jobDescription.trim() ? "Included" : "Optional"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-[#050b16] p-4"
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                          {label}
                        </p>
                        <p className="mt-2 truncate text-sm font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">
                      Recruiter will ask
                    </p>
                    <p className="mt-3 text-xl font-black leading-8">
                      “Tell me about yourself and keep it relevant to the{" "}
                      {role.trim() || "target"} role.”
                    </p>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="flex min-h-[470px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_18px_50px_rgba(14,165,233,0.25)]">
                    <Mic className="h-8 w-8" />
                  </div>
                  <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight">
                    Enter your real interview room
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                    The recruiter has your CV, target role, market, and interview style.
                    You’ll get pressure, interruptions, follow-ups, and a final report.
                  </p>

                  <button
                    onClick={saveSetupAndStart}
                    className="mt-7 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-3.5 text-base font-black shadow-[0_18px_55px_rgba(14,165,233,0.25)] transition hover:scale-[1.02]"
                  >
                    🎤 Start Interview
                  </button>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={step === 1}
                >
                  Back
                </button>

                {step < 5 ? (
                  <button
                    onClick={() => setStep((prev) => Math.min(5, prev + 1))}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2.5 text-sm font-black shadow-[0_14px_32px_rgba(37,99,235,0.25)] transition hover:scale-[1.02]"
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    onClick={saveSetupAndStart}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-2.5 text-sm font-black shadow-[0_14px_32px_rgba(14,165,233,0.25)] transition hover:scale-[1.02]"
                  >
                    Enter Interview Room
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="hidden min-h-0 rounded-[28px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl backdrop-blur-2xl lg:block">
            <div className="relative h-full overflow-hidden rounded-[24px] border border-white/10 bg-[#050b16]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(59,130,246,0.25),rgba(2,6,23,0.4)_45%,rgba(2,6,23,0.98)_100%)]" />
              <div className="relative z-10 flex h-full flex-col p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-black text-cyan-200">
                      AI Recruiter
                    </p>
                    <h2 className="mt-1 text-2xl font-black">
                      {selectedRecruiter.name}
                    </h2>
                    <p className="text-sm text-slate-400">{selectedRecruiter.title}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl">
                    {selectedRecruiter.avatar}
                  </div>
                </div>

                <div className="my-5 flex flex-1 items-center justify-center">
                  <div className="relative flex h-[300px] w-full max-w-[360px] items-end justify-center overflow-hidden rounded-b-[36px]">
                    <div className="absolute inset-x-10 bottom-0 h-[250px] rounded-t-full bg-gradient-to-b from-slate-700/80 via-slate-900 to-black shadow-[0_0_70px_rgba(14,165,233,0.18)]" />
                    <div className="relative mb-8 flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 via-orange-200 to-orange-600 text-6xl shadow-2xl">
                      {selectedRecruiter.avatar}
                    </div>
                    <div className="absolute bottom-0 h-[120px] w-[320px] rounded-t-[5rem] bg-gradient-to-br from-slate-100 via-slate-300 to-slate-700" />
                    <div className="absolute bottom-0 h-24 w-56 rounded-t-[4rem] bg-gradient-to-b from-white to-slate-300" />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                    Recruiter says
                  </p>
                  <p className="mt-2 text-base font-bold leading-7">
                    “{selectedRecruiter.quote}”
                  </p>

                  <div className="mt-4 flex items-end gap-1">
                    {waveformHeights.map((height, index) => (
                      <span
                        key={index}
                        className="w-1 rounded-full bg-gradient-to-t from-blue-500 to-cyan-300"
                        style={{ height }}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Simulation readiness</span>
                    <span className="font-black">{readinessScore}%</span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300"
                      style={{ width: `${readinessScore}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Lock className="h-4 w-4" />
                  Your data stays in this session unless you choose to save it.
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <div className="fixed bottom-5 left-5 z-20 hidden h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/75 shadow-2xl md:flex">
        <Image
          src="/workzo_icon.png"
          alt="WorkZo AI"
          width={32}
          height={32}
          className="rounded-full"
        />
      </div>
    </main>
  );
}
