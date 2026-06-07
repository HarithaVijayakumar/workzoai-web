"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Mic, Play, Sparkles, Volume2 } from "lucide-react";

type RecruiterId = "sarah" | "daniel" | "priya" | "markus";
type RoleId = "customer-success" | "data-analyst" | "software-engineer" | "it-support";

const demoRoles: Array<{ id: RoleId; label: string }> = [
  { id: "customer-success", label: "Customer Success Manager" },
  { id: "data-analyst", label: "Data Analyst" },
  { id: "software-engineer", label: "Software Engineer" },
  { id: "it-support", label: "IT Support Specialist" },
];

const recruiters: Array<{ id: RecruiterId; name: string; style: string; voiceHint: "female" | "male" }> = [
  { id: "sarah", name: "Sarah", style: "Friendly HR Recruiter", voiceHint: "female" },
  { id: "daniel", name: "Daniel", style: "Analytical Hiring Manager", voiceHint: "male" },
  { id: "priya", name: "Priya", style: "Startup Recruiter", voiceHint: "female" },
  { id: "markus", name: "Markus", style: "Structured Hiring Lead", voiceHint: "male" },
];

const questionBank: Record<RoleId, Record<RecruiterId, string[]>> = {
  "customer-success": {
    sarah: [
      "A customer is unhappy because they expected faster results from your product. How would you handle the conversation without sounding defensive?",
      "Tell me about a time you had to rebuild trust with a customer. What exactly did you say and what changed after that?",
      "If your customer health score drops but the customer says everything is fine, what signals would you investigate first?",
    ],
    daniel: [
      "Walk me through how you would identify whether churn risk is caused by product gaps, poor onboarding, or wrong customer expectations.",
      "Give me a specific example of how you used data, usage patterns, or support history to improve customer retention.",
      "A high-value customer asks for a feature your product cannot deliver. How do you protect the relationship and the business?",
    ],
    priya: [
      "In a startup with messy processes, how would you create a repeatable customer success motion from scratch?",
      "How would you balance urgent customer requests with limited product and engineering bandwidth?",
      "Describe a time you turned customer feedback into a product or process improvement.",
    ],
    markus: [
      "Explain your customer escalation process step by step, from first signal to final resolution.",
      "What metrics would you track weekly to prove customer success is improving?",
      "How do you document customer risks so another team member can take over without losing context?",
    ],
  },
  "data-analyst": {
    sarah: [
      "Tell me about an analysis you worked on where the first answer was misleading. How did you validate the result?",
      "How would you explain a complex dashboard insight to a non-technical stakeholder?",
      "Describe a time your analysis changed a business decision.",
    ],
    daniel: [
      "You see a sudden drop in conversion rate. Walk me through your investigation from raw data to recommendation.",
      "How do you check whether a metric is genuinely changing or just affected by data quality or seasonality?",
      "Give me an example where SQL logic or joins could have produced the wrong conclusion. How would you catch it?",
    ],
    priya: [
      "A founder asks for a dashboard by tomorrow, but the data is messy. What do you deliver first and what do you postpone?",
      "How would you prioritize analytics work when multiple teams ask for different reports?",
      "Tell me about a scrappy analysis you could build fast that still gives useful direction.",
    ],
    markus: [
      "Define the steps you follow before trusting a dataset for reporting.",
      "What would your ideal weekly business dashboard include and why?",
      "How do you document assumptions so future analysts can understand your work?",
    ],
  },
  "software-engineer": {
    sarah: [
      "Tell me about a bug that was difficult to reproduce. How did you approach it calmly and systematically?",
      "Describe a time you received code review feedback. How did you respond and improve the solution?",
      "How do you explain a technical trade-off to a product or business stakeholder?",
    ],
    daniel: [
      "Walk me through how you would design a reliable upload-and-processing flow for large PDF files.",
      "What checks would you add before deploying a feature that affects authentication or payments?",
      "Tell me about a performance problem you solved. What did you measure before and after?",
    ],
    priya: [
      "In an early startup, how do you decide between shipping fast and building a scalable architecture?",
      "What would you do if a founder asks for five features but the product has a critical reliability issue?",
      "Describe how you would build a small MVP without creating too much future technical debt.",
    ],
    markus: [
      "Explain your debugging process from error report to verified fix.",
      "How do you structure code so another developer can maintain it later?",
      "What is your process for testing edge cases before production?",
    ],
  },
  "it-support": {
    sarah: [
      "A frustrated user says the same issue keeps coming back. How would you handle the conversation and the investigation?",
      "Tell me about a time you had to explain a technical issue to a non-technical user.",
      "How do you stay calm when multiple urgent tickets arrive at the same time?",
    ],
    daniel: [
      "A user cannot access a business-critical system. Walk me through your troubleshooting steps.",
      "How would you decide whether an issue is device-related, network-related, account-related, or application-related?",
      "Give me an example of how you reduced repeat tickets or improved support documentation.",
    ],
    priya: [
      "In a small team without perfect processes, how would you create a better support workflow?",
      "How would you prioritize support issues when customers, internal users, and managers all need help?",
      "Tell me how you would turn common support questions into product or process improvements.",
    ],
    markus: [
      "Explain your ticket documentation standards from first contact to resolution.",
      "What information must be collected before escalating a technical issue?",
      "How do you measure whether IT support quality is improving?",
    ],
  },
};

function pickVoice(voices: SpeechSynthesisVoice[], recruiterId: RecruiterId) {
  const femaleVoiceNames = ["zira", "jenny", "aria", "samantha", "susan", "victoria", "karen", "moira", "female"];
  const maleVoiceNames = ["david", "mark", "guy", "alex", "daniel", "george", "male"];
  const wantsFemale = recruiterId === "sarah" || recruiterId === "priya";
  const preferred = wantsFemale ? femaleVoiceNames : maleVoiceNames;

  return (
    voices.find((voice) => preferred.some((name) => voice.name.toLowerCase().includes(name))) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
    voices[0] ||
    null
  );
}

export default function DemoPage() {
  const [role, setRole] = useState<RoleId>("data-analyst");
  const [recruiter, setRecruiter] = useState<RecruiterId>("sarah");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const activeRecruiter = recruiters.find((item) => item.id === recruiter) || recruiters[0];
  const activeRole = demoRoles.find((item) => item.id === role) || demoRoles[0];

  const questions = useMemo(() => questionBank[role][recruiter], [role, recruiter]);
  const activeQuestion = questions[questionIndex % questions.length];

  function speakQuestion() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(activeQuestion);
    const voice = pickVoice(voices, recruiter);

    if (voice) utterance.voice = voice;
    utterance.rate = recruiter === "daniel" || recruiter === "markus" ? 0.88 : 0.94;
    utterance.pitch = recruiter === "daniel" || recruiter === "markus" ? 0.9 : 1.08;
    utterance.lang = "en-US";

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  function nextQuestion() {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
    setQuestionIndex((value) => value + 1);
  }

  return (
    <main className="min-h-screen bg-[#050a12] px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-black text-slate-300 hover:text-white">
          ← Back home
        </Link>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Interactive demo</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              Try a smarter recruiter preview.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Demo questions now change by role and recruiter style. The real interview goes deeper using your CV and target job.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Choose role</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {demoRoles.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setRole(item.id);
                        setQuestionIndex(0);
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                        role === item.id
                          ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
                          : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Choose recruiter</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {recruiters.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setRecruiter(item.id);
                        setQuestionIndex(0);
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        recruiter === item.id
                          ? "border-blue-300/40 bg-blue-400/15 text-blue-100"
                          : "border-white/10 bg-black/20 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="block font-black">{item.name}</span>
                      <span className="mt-1 block text-xs text-slate-400">{item.style}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/onboarding"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-200"
            >
              Start real interview with my CV
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#08111f] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">{activeRole.label}</p>
                <h2 className="mt-2 text-2xl font-black">{activeRecruiter.name}</h2>
                <p className="mt-1 text-sm text-slate-400">{activeRecruiter.style}</p>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-400/10 text-blue-200">
                <Mic className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/30 p-6">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Demo question {questionIndex + 1}
              </div>
              <p className="mt-5 text-2xl font-black leading-snug text-white">{activeQuestion}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={speakQuestion}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-4 text-sm font-black text-white hover:bg-blue-400"
                >
                  {speaking ? <Volume2 className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}
                  {speaking ? "Speaking…" : "Play voice"}
                </button>
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 text-sm font-black text-slate-200 hover:bg-white/10"
                >
                  Next question
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Role-specific",
                "Recruiter-style aware",
                "CV-aware in real interview",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-slate-200">
                  <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
