"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/interviewStore";

const recruiterOptions = [
  {
    id: "friendly_hr",
    title: "Friendly HR",
    description: "Warm, supportive, communication-focused.",
  },
  {
    id: "analytical_hiring_manager",
    title: "Analytical Hiring Manager",
    description: "Evidence-driven, practical, asks for proof.",
  },
  {
    id: "startup_recruiter",
    title: "Startup Recruiter",
    description: "Fast-paced, direct, impact-focused.",
  },
  {
    id: "corporate_recruiter",
    title: "Corporate Recruiter",
    description: "Structured, formal, process-oriented.",
  },
  {
    id: "pressure_interviewer",
    title: "Pressure Interviewer",
    description: "Challenging, skeptical, realistic pressure.",
  },
];

const marketOptions = ["Global", "Germany", "US", "UK", "India", "Netherlands"];

const companyStyles = [
  "Realistic",
  "Startup",
  "Corporate",
  "Technical",
  "Consulting",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setup, updateSetup } = useInterviewStore();

  const [role, setRole] = useState(setup.targetRole || "");
  const [market, setMarket] = useState(setup.targetMarket || "Global");
  const [companyStyle, setCompanyStyle] = useState(
    setup.companyStyle || "Realistic"
  );
  const [recruiterPersonality, setRecruiterPersonality] = useState(
    setup.recruiterPersonality || "analytical_hiring_manager"
  );
  const [jobDescription, setJobDescription] = useState(
    setup.jobDescription || ""
  );
  const [cvText, setCvText] = useState(setup.cvText || "");
  const [cvFileName, setCvFileName] = useState("");
  const [isReadingCv, setIsReadingCv] = useState(false);
  const [cvError, setCvError] = useState("");

  async function handleCvUpload(file: File | null) {
    if (!file) return;

    setCvError("");
    setIsReadingCv(true);
    setCvFileName(file.name);

    try {
      if (
        file.type === "text/plain" ||
        file.name.toLowerCase().endsWith(".txt")
      ) {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "CV extraction failed. Paste the CV text manually."
        );
      }

      const data = await response.json();

      const extractedText =
        data.text || data.cvText || data.content || data.extractedText || "";

      if (!extractedText) {
        throw new Error("No readable text found in CV.");
      }

      setCvText(extractedText);
    } catch (error) {
      console.error(error);
      setCvError(
        "Could not read this CV. Try uploading a text-based PDF or paste the CV text below."
      );
    } finally {
      setIsReadingCv(false);
    }
  }

  function handleStart() {
    updateSetup({
      targetRole: role.trim() || "General Role",
      targetMarket: market,
      companyStyle,
      recruiterPersonality,
      cvText,
      jobDescription,
    });

    router.push("/interview");
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-6 md:py-10">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10">
          <div className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
            Interview setup
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">
            Build your real AI recruiter simulation
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
            Add your target role, CV, market, company style, and recruiter
            personality. WorkZo will use this context during the interview.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm font-medium text-blue-200">1. Target role</p>

              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Example: Junior Data Analyst"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
              />
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm font-medium text-blue-200">
                2. Upload your CV
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Upload your CV so the recruiter can ask questions based on your
                real background.
              </p>

              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-blue-400/30 bg-blue-500/10 px-5 py-8 text-center transition hover:bg-blue-500/15">
                <span className="text-lg font-semibold text-blue-100">
                  {isReadingCv ? "Reading CV..." : "Upload CV"}
                </span>

                <span className="mt-2 text-sm text-slate-400">
                  PDF or TXT works best
                </span>

                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(event) =>
                    handleCvUpload(event.target.files?.[0] || null)
                  }
                />
              </label>

              {cvFileName && (
                <p className="mt-3 rounded-2xl bg-green-500/10 px-4 py-3 text-sm text-green-200">
                  Uploaded: {cvFileName}
                </p>
              )}

              {cvError && (
                <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {cvError}
                </p>
              )}

              <textarea
                value={cvText}
                onChange={(event) => setCvText(event.target.value)}
                placeholder="Or paste CV text here..."
                rows={7}
                className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
              />
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm font-medium text-blue-200">
                3. Job description
              </p>

              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the job description here. This helps the recruiter ask role-specific questions."
                rows={7}
                className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm font-medium text-blue-200">
                4. Target market
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {marketOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setMarket(option)}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
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

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm font-medium text-blue-200">
                5. Company style
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {companyStyles.map((option) => (
                  <button
                    key={option}
                    onClick={() => setCompanyStyle(option)}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      companyStyle === option
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-slate-300 hover:bg-white/15"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-sm font-medium text-blue-200">
                6. Recruiter personality
              </p>

              <div className="mt-4 space-y-3">
                {recruiterOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setRecruiterPersonality(option.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      recruiterPersonality === option.id
                        ? "border-blue-400/50 bg-blue-500/15"
                        : "border-white/10 bg-black/20 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-semibold text-white">{option.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full rounded-3xl bg-blue-500 px-6 py-5 text-lg font-semibold text-white transition hover:bg-blue-400"
            >
              Start real interview
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}