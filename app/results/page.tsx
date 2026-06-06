"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Crown,
  Eye,
  FileText,
  Flag,
  Gauge,
  Lightbulb,
  Lock,
  MessageSquareText,
  Mic2,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Wand2,
} from "lucide-react";

import UpgradeModal from "@/components/premium/UpgradeModal";
import PremiumUsageBadge from "@/components/premium/PremiumUsageBadge";
import { getWorkZoPlanLimits } from "@/lib/workzoPlanLimits";
import {
  getWorkZoCurrentPlan,
  recordWorkZoReportViewed,
} from "@/lib/workzoUsageTracker";

type TranscriptTurn = {
  role?: string;
  speaker?: string;
  text?: string;
  content?: string;
  question?: string;
  answer?: string;
  timestamp?: string;
};

type WeakAnswer = {
  question?: string;
  answer?: string;
  reason?: string;
  betterAnswer?: string;
};

type StoredResult = {
  plan?: string;
  isPremium?: boolean;
  overallScore?: number;
  communicationScore?: number;
  confidenceScore?: number;
  roleCompetencyScore?: number;
  trustScore?: number;
  evidenceQuality?: number;
  contradictionRisk?: number;
  durationSeconds?: number;
  duration?: number | string;
  recruiter?: string;
  recruiterName?: string;
  recruiterPersonality?: string;
  targetRole?: string;
  role?: string;
  companyName?: string;
  targetCompany?: string;
  companyStyle?: string;
  selectedCompany?: string;
  strengths?: string[];
  improvements?: string[];
  weakAnswers?: WeakAnswer[];
  contradictions?: string[];
  evidenceRequests?: string[];
  redFlags?: string[];
  trustTimeline?: Array<{ label?: string; score?: number; reason?: string }>;
  transcript?: TranscriptTurn[];
  messages?: TranscriptTurn[];
  answers?: TranscriptTurn[];
  report?: Record<string, unknown>;
  intelligence?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type AnswerInsight = {
  id: string;
  question: string;
  answer: string;
  wordCount: number;
  wpm: number;
  fillerCount: number;
  pauseRisk: "low" | "medium" | "high";
  metricPresent: boolean;
  ownershipPresent: boolean;
  resultPresent: boolean;
  structureScore: number;
  evidenceScore: number;
  trustImpact: number;
  weakness: string;
  whatRecruiterHeard: string;
  betterAnswer: string;
  redFlags: string[];
};

type CompanyDNA = {
  label: string;
  description: string;
  dimensions: Array<{ label: string; score: number; note: string }>;
};

type RichReport = {
  overallScore: number;
  grade: string;
  communicationScore: number;
  confidenceScore: number;
  roleCompetencyScore: number;
  trustScore: number;
  evidenceQuality: number;
  contradictionRisk: number;
  durationLabel: string;
  durationSeconds: number;
  answersCount: number;
  averageWpm: number;
  recruiterName: string;
  roleLabel: string;
  companyLabel: string;
  verdictTitle: string;
  verdictBody: string;
  sentiment: string;
  quickWin: string;
  strengths: string[];
  improvements: string[];
  answerInsights: AnswerInsight[];
  contradictions: Array<{ severity: number; title: string; detail: string; trustDrop: number }>;
  redFlags: string[];
  evidenceRequests: string[];
  companyDNA: CompanyDNA;
  benchmark: Array<{ label: string; user: number; top: number; note: string }>;
  vocalFillers: Array<{ label: string; count: number; risk: "low" | "medium" | "high" }>;
  improvementPlan: Array<{ title: string; action: string }>;
};

const STORAGE_KEYS = [
  "workzo_latest_result",
  "workzo-interview-result",
  "workzo_interview_result",
  "latestInterviewResult",
  "workzo_results",
  "workzoInterviewResult",
  "workzo_result_snapshot",
];

const SETUP_KEYS = [
  "workzoInterviewSetup",
  "workzo-interview-setup-v4",
  "latestInterviewSetup",
  "workzo-latest-interview-setup",
  "workzo-interview-setup-latest",
  "onboardingSetup",
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeList(value: unknown, fallback: string[], limit = 5) {
  if (Array.isArray(value)) {
    const items = value.map(cleanText).filter(Boolean);
    if (items.length) return Array.from(new Set(items)).slice(0, limit);
  }
  return fallback.slice(0, limit);
}

function readJsonFromStorage(keys: string[]) {
  if (typeof window === "undefined") return null;

  for (const key of keys) {
    try {
      const local = window.localStorage.getItem(key);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
      }

      const session = window.sessionStorage.getItem(key);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
      }
    } catch {
      // Keep trying the next key.
    }
  }

  return null;
}

function readResultFromStorage(): StoredResult {
  const result = readJsonFromStorage(STORAGE_KEYS);
  const setup = readJsonFromStorage(SETUP_KEYS);
  return {
    ...(setup || {}),
    ...(result || {}),
  } as StoredResult;
}

function gradeFromScore(score: number) {
  if (score >= 92) return "A";
  if (score >= 86) return "A-";
  if (score >= 80) return "B+";
  if (score >= 73) return "B";
  if (score >= 66) return "B-";
  if (score >= 58) return "C+";
  if (score >= 50) return "C";
  return "Needs work";
}

function durationToSeconds(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  const text = cleanText(value);
  if (!text) return 0;

  const minuteMatch = text.match(/(\d+)\s*m/i);
  const secondMatch = text.match(/(\d+)\s*s/i);
  if (minuteMatch || secondMatch) {
    return (Number(minuteMatch?.[1] || 0) * 60) + Number(secondMatch?.[1] || 0);
  }

  return 0;
}

function formatDuration(seconds: number) {
  if (!seconds) return "Not captured";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (!mins) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function getText(turn: TranscriptTurn) {
  return cleanText(turn.text || turn.content || turn.answer || turn.question || "");
}

function isRecruiterTurn(turn: TranscriptTurn) {
  const label = cleanText(turn.role || turn.speaker).toLowerCase();
  return /recruiter|assistant|interviewer|ai|sarah|daniel|priya|markus/.test(label);
}

function isCandidateTurn(turn: TranscriptTurn) {
  const label = cleanText(turn.role || turn.speaker).toLowerCase();
  return /user|candidate|you|me|applicant/.test(label);
}

function buildPairs(result: StoredResult) {
  const source = Array.isArray(result.transcript)
    ? result.transcript
    : Array.isArray(result.messages)
      ? result.messages
      : Array.isArray(result.answers)
        ? result.answers
        : [];

  if (!source.length && Array.isArray(result.weakAnswers)) {
    return result.weakAnswers.map((item, index) => ({
      question: cleanText(item.question) || `Interview question ${index + 1}`,
      answer: cleanText(item.answer) || "Answer not captured.",
    }));
  }

  const pairs: Array<{ question: string; answer: string }> = [];
  let pendingQuestion = "";

  for (const turn of source) {
    const text = getText(turn);
    if (!text) continue;

    if (turn.question && turn.answer) {
      pairs.push({ question: cleanText(turn.question), answer: cleanText(turn.answer) });
      continue;
    }

    if (isRecruiterTurn(turn)) {
      pendingQuestion = text;
      continue;
    }

    if (isCandidateTurn(turn)) {
      pairs.push({
        question: pendingQuestion || `Interview question ${pairs.length + 1}`,
        answer: text,
      });
      pendingQuestion = "";
    }
  }

  return pairs.slice(0, 12);
}

function countWords(text: string) {
  return (text.match(/\b[\w'+-]+\b/g) || []).length;
}

function countFillers(text: string) {
  return (text.match(/\b(um|uh|like|basically|actually|sort of|kind of|you know|i mean)\b/gi) || []).length;
}

function hasMetric(text: string) {
  return /\b\d+\s*(%|percent|k|m|million|thousand|x|times|users|customers|hours|days|weeks|months|tickets|cases|revenue|cost|sla|nps)\b/i.test(text);
}

function hasOwnership(text: string) {
  return /\b(i|my|me)\b/i.test(text) && /\b(led|owned|built|created|designed|implemented|resolved|improved|managed|delivered|automated|analyzed|coordinated|handled)\b/i.test(text);
}

function hasResult(text: string) {
  return /\b(result|outcome|impact|improved|reduced|increased|saved|achieved|delivered|therefore|as a result|because of this)\b/i.test(text) || hasMetric(text);
}

function detectRedFlags(answer: string) {
  const flags: string[] = [];
  if (/\b(my manager told me|just did what i was told|not my responsibility)\b/i.test(answer)) {
    flags.push("May sound low-ownership unless clarified.");
  }
  if (/\b(they failed|team failed|manager failed|because of them|not my fault)\b/i.test(answer)) {
    flags.push("Possible blame-shifting signal.");
  }
  if (countWords(answer) < 18) flags.push("Answer may be too short for recruiter confidence.");
  if (countWords(answer) > 260) flags.push("Answer may be too long and unfocused.");
  if (!hasMetric(answer)) flags.push("No measurable outcome detected.");
  if (!hasOwnership(answer)) flags.push("Personal ownership is not clear enough.");
  return flags.slice(0, 4);
}

function classifyPauseRisk(wordCount: number) {
  if (wordCount < 20) return "high";
  if (wordCount > 220) return "medium";
  return "low";
}

function whatHeard(answer: string) {
  const short = countWords(answer) < 22;
  const metric = hasMetric(answer);
  const ownership = hasOwnership(answer);
  const result = hasResult(answer);

  if (short) return "The answer may sound under-developed, even if the experience is relevant.";
  if (!ownership && !metric) return "The recruiter may hear useful background, but not enough proof of your personal impact.";
  if (!metric) return "The recruiter may believe the story, but still wonder how impact was measured.";
  if (!ownership) return "The recruiter may not know which part was personally owned by you versus the wider team.";
  if (!result) return "The recruiter hears action, but needs a clearer final outcome.";
  return "The recruiter hears a credible example with useful evidence and role-relevant ownership.";
}

function rewriteAnswer(question: string, answer: string) {
  if (!answer || /not captured/i.test(answer)) {
    return "Use a short STAR answer: explain the situation, your task, the action you personally took, and the measurable result.";
  }

  const roleContext = /tell me about yourself|introduce/i.test(question)
    ? "My background is strongest when I connect my experience directly to the role."
    : "In that situation, I would structure the answer around the business problem and my personal contribution.";

  const metricLine = hasMetric(answer)
    ? "I would keep the metric because it gives the recruiter evidence."
    : "I would add one measurable outcome, such as time saved, quality improved, tickets resolved, users supported, or revenue impact.";

  return `${roleContext} I would explain the specific context, what I personally owned, the action I took, and the result. ${metricLine}`;
}

function analyzeAnswer(question: string, answer: string, index: number): AnswerInsight {
  const words = countWords(answer);
  const fillerCount = countFillers(answer);
  const metricPresent = hasMetric(answer);
  const ownershipPresent = hasOwnership(answer);
  const resultPresent = hasResult(answer);
  const structureScore = clamp(35 + (words >= 35 ? 18 : 0) + (words <= 180 ? 18 : 0) + (ownershipPresent ? 14 : 0) + (resultPresent ? 15 : 0));
  const evidenceScore = clamp(30 + (metricPresent ? 35 : 0) + (ownershipPresent ? 18 : 0) + (resultPresent ? 17 : 0));
  const redFlags = detectRedFlags(answer);
  const trustImpact = clamp(evidenceScore - (redFlags.length * 7), 0, 100);

  let weakness = "Good foundation; make the answer sharper with stronger structure.";
  if (!metricPresent) weakness = "Missing measurable evidence.";
  if (!ownershipPresent) weakness = "Personal ownership is not clear.";
  if (words < 18) weakness = "Answer is too short to evaluate deeply.";
  if (words > 260) weakness = "Answer is too long and may lose recruiter attention.";

  return {
    id: `answer-${index + 1}`,
    question,
    answer,
    wordCount: words,
    wpm: words ? clamp(words / 1.4, 50, 210) : 0,
    fillerCount,
    pauseRisk: classifyPauseRisk(words),
    metricPresent,
    ownershipPresent,
    resultPresent,
    structureScore,
    evidenceScore,
    trustImpact,
    weakness,
    whatRecruiterHeard: whatHeard(answer),
    betterAnswer: rewriteAnswer(question, answer),
    redFlags,
  };
}

function companyDNA(company: string, role: string, insights: AnswerInsight[]): CompanyDNA {
  const source = `${company} ${role}`.toLowerCase();
  const avgEvidence = average(insights.map((item) => item.evidenceScore), 62);
  const avgStructure = average(insights.map((item) => item.structureScore), 64);
  const avgTrust = average(insights.map((item) => item.trustImpact), 66);

  if (/amazon|aws/.test(source)) {
    return {
      label: "Amazon Bar Raiser Alignment",
      description: "Evaluation is mapped to public Amazon-style leadership signal expectations.",
      dimensions: [
        { label: "Customer Obsession", score: clamp(avgEvidence + 4), note: "Needs customer/user impact evidence." },
        { label: "Ownership", score: avgTrust, note: "Strong when personal contribution is explicit." },
        { label: "Dive Deep", score: avgEvidence, note: "Metrics and root-cause detail matter heavily." },
        { label: "Bias for Action", score: clamp(avgStructure + 2), note: "Clear action steps improve this score." },
      ],
    };
  }

  if (/mckinsey|consulting|consultant|bcg|bain/.test(source)) {
    return {
      label: "Consulting / MECE Alignment",
      description: "Evaluation focuses on structure, prioritization, business impact, and concise reasoning.",
      dimensions: [
        { label: "Structured Thinking", score: avgStructure, note: "Answers need clean situation-task-action-result flow." },
        { label: "Business Impact", score: avgEvidence, note: "Quantified outcomes are critical." },
        { label: "Executive Clarity", score: clamp(avgStructure - 2), note: "Reduce rambling and lead with the conclusion." },
        { label: "Hypothesis Mindset", score: clamp(avgTrust - 4), note: "Explain why you chose your approach." },
      ],
    };
  }

  if (/google|meta|microsoft|software|engineer|developer|technical/.test(source)) {
    return {
      label: "Technical Company Alignment",
      description: "Evaluation focuses on evidence, scale, clarity, ownership, and cross-functional impact.",
      dimensions: [
        { label: "Technical Depth", score: avgEvidence, note: "Use concrete systems, tools, or complexity signals." },
        { label: "Ownership", score: avgTrust, note: "Clarify what you personally built or decided." },
        { label: "Collaboration", score: clamp(avgStructure + 3), note: "Explain stakeholders and trade-offs." },
        { label: "Impact", score: avgEvidence, note: "Quantify user, revenue, speed, cost, or quality impact." },
      ],
    };
  }

  if (/startup|founder|early|scaleup|saas/.test(source)) {
    return {
      label: "Startup Readiness Alignment",
      description: "Evaluation focuses on ownership, speed, ambiguity handling, and measurable outcomes.",
      dimensions: [
        { label: "Ownership", score: avgTrust, note: "Show what you drove without waiting for instructions." },
        { label: "Speed", score: clamp(avgStructure + 4), note: "Explain fast decisions and execution." },
        { label: "Ambiguity", score: clamp(avgTrust - 2), note: "Show how you handled unclear requirements." },
        { label: "Impact", score: avgEvidence, note: "Metrics make startup stories credible." },
      ],
    };
  }

  return {
    label: "Role Alignment",
    description: "Evaluation focuses on communication, role relevance, proof, and recruiter confidence.",
    dimensions: [
      { label: "Communication", score: avgStructure, note: "Sharper structure improves recruiter confidence." },
      { label: "Evidence", score: avgEvidence, note: "Specific metrics improve credibility." },
      { label: "Ownership", score: avgTrust, note: "Clarify your individual contribution." },
      { label: "Role Fit", score: clamp((avgEvidence + avgStructure) / 2), note: "Connect examples directly to the target role." },
    ],
  };
}

function average(values: number[], fallback: number) {
  const usable = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!usable.length) return clamp(fallback);
  return clamp(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function detectContradictions(insights: AnswerInsight[], stored: StoredResult) {
  const storedItems = normalizeList(stored.contradictions, [], 6);
  if (storedItems.length) {
    return storedItems.map((item, index) => ({
      severity: index === 0 ? 4 : 3,
      title: "Possible contradiction detected",
      detail: item,
      trustDrop: index === 0 ? 15 : 8,
    }));
  }

  const full = insights.map((item) => item.answer).join(" \n ").toLowerCase();
  const contradictions: Array<{ severity: number; title: string; detail: string; trustDrop: number }> = [];

  if (/\bled\b|managed a team|team of \d+/.test(full) && /no management experience|never managed|not managed/.test(full)) {
    contradictions.push({
      severity: 5,
      title: "Leadership ownership conflict",
      detail: "The transcript contains both a leadership claim and a later statement suggesting no management experience.",
      trustDrop: 18,
    });
  }

  if (/expert|advanced|strong experience/.test(full) && /beginner|basic knowledge|still learning/.test(full)) {
    contradictions.push({
      severity: 3,
      title: "Skill confidence mismatch",
      detail: "The confidence level around one skill appears inconsistent across answers.",
      trustDrop: 7,
    });
  }

  return contradictions;
}

function detectVocalFillers(insights: AnswerInsight[]) {
  const fillerTotal = insights.reduce((sum, item) => sum + item.fillerCount, 0);
  const shortAnswers = insights.filter((item) => item.wordCount < 18).length;
  const longAnswers = insights.filter((item) => item.wordCount > 220).length;
  return [
    { label: "Filler words", count: fillerTotal, risk: fillerTotal > 8 ? "high" as const : fillerTotal > 3 ? "medium" as const : "low" as const },
    { label: "Under-developed answers", count: shortAnswers, risk: shortAnswers > 2 ? "high" as const : shortAnswers > 0 ? "medium" as const : "low" as const },
    { label: "Overlong answers", count: longAnswers, risk: longAnswers > 1 ? "high" as const : longAnswers > 0 ? "medium" as const : "low" as const },
  ];
}

function buildRichReport(result: StoredResult): RichReport {
  const pairs = buildPairs(result);
  const answerInsights = pairs.map((pair, index) => analyzeAnswer(pair.question, pair.answer, index));
  const answersCount = answerInsights.length;
  const avgStructure = average(answerInsights.map((item) => item.structureScore), 72);
  const avgEvidence = average(answerInsights.map((item) => item.evidenceScore), 64);
  const avgTrust = average(answerInsights.map((item) => item.trustImpact), numberOr(result.trustScore, 68));

  const communicationScore = numberOr(result.communicationScore, avgStructure);
  const confidenceScore = numberOr(result.confidenceScore, clamp(avgTrust - 2));
  const roleCompetencyScore = numberOr(result.roleCompetencyScore, clamp((avgEvidence + avgStructure) / 2 + 4));
  const trustScore = numberOr(result.trustScore, avgTrust);
  const evidenceQuality = numberOr(result.evidenceQuality, avgEvidence);
  const contradictions = detectContradictions(answerInsights, result);
  const contradictionRisk = numberOr(result.contradictionRisk, contradictions.length ? clamp(contradictions[0].severity * 18) : 8);
  const overallScore = numberOr(
    result.overallScore,
    clamp((communicationScore * 0.24) + (confidenceScore * 0.2) + (roleCompetencyScore * 0.24) + (trustScore * 0.18) + (evidenceQuality * 0.14) - (contradictionRisk * 0.12)),
  );

  const companyLabel = cleanText(result.companyName || result.targetCompany || result.selectedCompany || result.companyStyle) || "Target company";
  const roleLabel = cleanText(result.targetRole || result.role) || "Target role";
  const recruiterName = cleanText(result.recruiterName || result.recruiter || result.recruiterPersonality) || "Recruiter";
  const durationSeconds = durationToSeconds(result.durationSeconds || result.duration || result.metadata?.duration);
  const averageWpm = average(answerInsights.map((item) => item.wpm), 0);
  const redFlags = normalizeList(
    result.redFlags,
    answerInsights.flatMap((item) => item.redFlags).slice(0, 5),
    5,
  );

  const topWeakness = answerInsights.find((item) => item.redFlags.length)?.weakness || "Make your answers more measurable and structured.";
  const quickWin = answerInsights[0]
    ? `On ${answerInsights[0].question.slice(0, 54)}${answerInsights[0].question.length > 54 ? "..." : ""}, improve by adding one metric and your personal contribution.`
    : "Complete a full interview to receive your first personalized quick win.";

  const strengths = normalizeList(result.strengths, [
    answerInsights.some((item) => item.metricPresent) ? "You included at least one measurable proof point." : "You gave useful background signal for the target role.",
    answerInsights.some((item) => item.ownershipPresent) ? "You showed personal ownership in parts of the interview." : "You showed motivation to improve and prepare seriously.",
    "Your answers contained at least some recruiter-relevant context.",
  ]);

  const improvements = normalizeList(result.improvements, [
    topWeakness,
    "Make your personal ownership clearer.",
    "Use a sharper STAR structure for every major answer.",
  ]);

  const company = companyDNA(companyLabel, roleLabel, answerInsights);
  const benchmark = [
    { label: "Structure", user: communicationScore, top: 88, note: "Top candidates answer with clean STAR flow." },
    { label: "Metric Usage", user: evidenceQuality, top: 86, note: "Top candidates quantify impact early." },
    { label: "Ownership", user: trustScore, top: 90, note: "Top candidates make their personal role unmistakable." },
    { label: "Role Fit", user: roleCompetencyScore, top: 87, note: "Top candidates connect every answer to the target role." },
  ];

  let verdictTitle = "Would continue with caution";
  if (overallScore >= 85) verdictTitle = "Strong proceed signal";
  else if (overallScore >= 72) verdictTitle = "Promising, but needs sharper proof";
  else if (overallScore >= 58) verdictTitle = "Not ready yet without stronger examples";
  else verdictTitle = "High risk for a real interview";

  const verdictBody = `${recruiterName} would likely see relevant potential for ${roleLabel}, but would still look for clearer metrics, stronger ownership, and more structured evidence before making a confident recommendation.`;

  return {
    overallScore: clamp(overallScore),
    grade: gradeFromScore(overallScore),
    communicationScore: clamp(communicationScore),
    confidenceScore: clamp(confidenceScore),
    roleCompetencyScore: clamp(roleCompetencyScore),
    trustScore: clamp(trustScore),
    evidenceQuality: clamp(evidenceQuality),
    contradictionRisk: clamp(contradictionRisk),
    durationLabel: formatDuration(durationSeconds),
    durationSeconds,
    answersCount,
    averageWpm,
    recruiterName,
    roleLabel,
    companyLabel,
    verdictTitle,
    verdictBody,
    sentiment: overallScore >= 78
      ? "You showed strong role fit, but your best answers still need sharper evidence to sound top-tier."
      : "You showed useful role fit, but the recruiter still needs sharper metrics, ownership, or structure.",
    quickWin,
    strengths,
    improvements,
    answerInsights,
    contradictions,
    redFlags,
    evidenceRequests: normalizeList(result.evidenceRequests, [
      "Add one measurable outcome to the answer you are most proud of.",
      "Clarify which achievements were personally owned by you versus the team.",
      "Connect each example directly to the target role requirements.",
    ]),
    companyDNA: company,
    benchmark,
    vocalFillers: detectVocalFillers(answerInsights),
    improvementPlan: [
      { title: "Rewrite your weakest answer", action: "Use Situation → Task → Action → Result and add one metric." },
      { title: "Prepare 3 proof stories", action: "One leadership story, one failure story, and one measurable impact story." },
      { title: "Retry with pressure follow-ups", action: "Practice when the recruiter asks for proof, ownership, and trade-offs." },
    ],
  };
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const deg = clamp(score) * 3.6;
  return (
    <div
      className="grid h-36 w-36 place-items-center rounded-full p-3"
      style={{ background: `conic-gradient(#3b82f6 ${deg}deg, rgba(255,255,255,0.08) ${deg}deg)` }}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-[#120936]">
        <div className="text-center">
          <p className="text-4xl font-black">{score}</p>
          <p className="text-xs font-bold text-slate-300">{label}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper, Icon }: { label: string; value: string; helper: string; Icon: typeof Gauge }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
      <Icon className="h-6 w-6 text-blue-300" />
      <p className="mt-4 text-xs font-black uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{helper}</p>
    </section>
  );
}

function ProgressBar({ value, top, label }: { value: number; top?: number; label: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-bold text-slate-200">{label}</span>
        <span className="text-slate-400">{value}/100{typeof top === "number" ? ` · top ${top}` : ""}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${clamp(value)}%` }} />
      </div>
      {typeof top === "number" ? (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-emerald-300/80" style={{ width: `${clamp(top)}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function LockedPreviewCard({ title, subtitle, count, onUnlock }: { title: string; subtitle: string; count?: string; onUnlock: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-violet-300/15 bg-violet-500/10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">Premium preview</p>
          <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{subtitle}</p>
          {count ? <p className="mt-3 text-sm font-black text-amber-200">{count}</p> : null}
        </div>
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-300/15 text-amber-100">
          <Lock className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-6 space-y-3 rounded-3xl bg-black/25 p-5 blur-sm">
        <div className="h-4 w-2/3 rounded-full bg-white/20" />
        <div className="h-4 w-5/6 rounded-full bg-white/20" />
        <div className="h-4 w-3/4 rounded-full bg-white/20" />
        <div className="h-4 w-1/2 rounded-full bg-white/20" />
      </div>
      <button
        type="button"
        onClick={onUnlock}
        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-400"
      >
        <Crown className="h-4 w-4" />
        Upgrade to unlock
      </button>
    </section>
  );
}

function FreeReport({ report, onUnlock }: { report: RichReport; onUnlock: () => void }) {
  return (
    <>
      <section className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Free Interview Snapshot
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight">
              Your recruiter-style feedback report
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              A useful free snapshot with one quick win. Upgrade to unlock the recruiter timeline, red flags, rewrites, trust audit, and company alignment.
            </p>
          </div>
          <ScoreRing score={report.overallScore} label={`${report.grade} · /100`} />
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-4">
        <MetricCard label="Communication" value={`${report.communicationScore}%`} helper="Clarity, answer length, and structure." Icon={MessageSquareText} />
        <MetricCard label="Confidence" value={`${report.confidenceScore}%`} helper="Pace, ownership, and certainty signals." Icon={Gauge} />
        <MetricCard label="Role Competency" value={`${report.roleCompetencyScore}%`} helper="How relevant your answers sounded for the role." Icon={Target} />
        <MetricCard label="Trust Signal" value={`${report.trustScore}%`} helper="Visible score. Detailed trust audit is premium." Icon={ShieldCheck} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <ShieldCheck className="h-6 w-6 text-emerald-300" />
            Sentiment snapshot
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-200">{report.sentiment}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Avg. pace</p>
              <p className="mt-2 text-2xl font-black">{report.averageWpm ? `${report.averageWpm} WPM` : "— WPM"}</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Duration</p>
              <p className="mt-2 text-2xl font-black">{report.durationLabel}</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-4">
              <p className="text-xs text-slate-400">Answers</p>
              <p className="mt-2 text-2xl font-black">{report.answersCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-300/15 bg-emerald-500/10 p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Lightbulb className="h-6 w-6 text-emerald-200" />
            One quick win
          </h2>
          <p className="mt-5 text-sm leading-7 text-emerald-50">{report.quickWin}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            Strengths
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-200">
            {report.strengths.map((item) => (
              <li key={item} className="rounded-2xl bg-emerald-500/10 p-4">{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Target className="h-6 w-6 text-blue-300" />
            Improvements
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-200">
            {report.improvements.map((item) => (
              <li key={item} className="rounded-2xl bg-blue-500/10 p-4">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <LockedPreviewCard
          title="Full question timeline"
          subtitle="See every question, every answer, recruiter interpretation, answer rewrite, and trust impact."
          count={`${Math.max(report.answersCount, 1)} answer(s) analyzed`}
          onUnlock={onUnlock}
        />
        <LockedPreviewCard
          title="Red flags detector"
          subtitle="We check communication risk, missing evidence, low ownership, contradictions, and confidence signals."
          count={`Premium found ${report.redFlags.length} red flag(s) and ${report.contradictions.length} contradiction concern(s).`}
          onUnlock={onUnlock}
        />
      </section>
    </>
  );
}

function PremiumReport({ report, onRetry }: { report: RichReport; onRetry: () => void }) {
  return (
    <>
      <section className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-100">
              <Crown className="h-4 w-4" />
              Premium Recruiter Masterclass
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight">{report.verdictTitle}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">{report.verdictBody}</p>
          </div>
          <ScoreRing score={report.overallScore} label={`${report.grade} · /100`} />
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-5">
        <MetricCard label="Communication" value={`${report.communicationScore}%`} helper="Structure and clarity." Icon={MessageSquareText} />
        <MetricCard label="Confidence" value={`${report.confidenceScore}%`} helper="Pace and certainty." Icon={Gauge} />
        <MetricCard label="Role Match" value={`${report.roleCompetencyScore}%`} helper="Relevance to target role." Icon={Target} />
        <MetricCard label="Trust" value={`${report.trustScore}%`} helper="Credibility signal." Icon={ShieldCheck} />
        <MetricCard label="Evidence" value={`${report.evidenceQuality}%`} helper="Proof and metrics." Icon={TrendingUp} />
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Company DNA</p>
            <h2 className="mt-2 text-2xl font-black text-white">{report.companyDNA.label}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{report.companyDNA.description}</p>
          </div>
          <p className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-slate-200">
            {report.companyLabel} · {report.roleLabel}
          </p>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {report.companyDNA.dimensions.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <ProgressBar label={item.label} value={item.score} />
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <FileText className="h-6 w-6 text-blue-300" />
          Interactive transcript timeline
        </h2>
        <div className="mt-6 space-y-5">
          {report.answerInsights.length ? report.answerInsights.map((item, index) => (
            <article key={item.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Question {index + 1}</p>
                  <h3 className="mt-2 text-lg font-black text-white">{item.question}</h3>
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-black text-slate-200">
                  Trust impact: {item.trustImpact}/100
                </div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">What you said</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.answer}</p>
                </div>
                <div className="rounded-2xl bg-amber-500/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">What recruiter heard</p>
                  <p className="mt-2 text-sm leading-6 text-amber-50">{item.whatRecruiterHeard}</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">How to say it better</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-50">{item.betterAnswer}</p>
                </div>
              </div>
            </article>
          )) : (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-sm text-slate-300">
              No full transcript was captured for this session. Future completed interviews will show question-by-question recruiter analysis here.
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black"><ShieldAlert className="h-6 w-6 text-amber-300" />Contradiction & trust audit</h2>
          <div className="mt-5 space-y-4">
            {report.contradictions.length ? report.contradictions.map((item) => (
              <div key={`${item.title}-${item.detail}`} className="rounded-2xl bg-amber-500/10 p-4">
                <p className="font-black text-amber-100">Severity {item.severity}/5 · {item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{item.detail}</p>
                <p className="mt-2 text-xs font-bold text-amber-200">Estimated trust impact: -{item.trustDrop} points</p>
              </div>
            )) : (
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-50">No major contradiction pattern detected in the captured transcript.</div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black"><Flag className="h-6 w-6 text-red-300" />Red flags detector</h2>
          <div className="mt-5 space-y-3">
            {report.redFlags.length ? report.redFlags.map((item) => (
              <div key={item} className="rounded-2xl bg-red-500/10 p-4 text-sm leading-6 text-red-50">{item}</div>
            )) : (
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-50">No critical red flags detected, but evidence quality can still improve.</div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black"><BarChart3 className="h-6 w-6 text-cyan-300" />Top 10% candidate comparison</h2>
          <div className="mt-6 space-y-5">
            {report.benchmark.map((item) => (
              <div key={item.label}>
                <ProgressBar label={item.label} value={item.user} top={item.top} />
                <p className="mt-2 text-xs leading-5 text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black"><Mic2 className="h-6 w-6 text-violet-300" />Vocal filler & pacing map</h2>
          <div className="mt-6 space-y-4">
            {report.vocalFillers.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-black/20 p-4">
                <div>
                  <p className="font-black text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-400">Risk: {item.risk}</p>
                </div>
                <p className="text-2xl font-black">{item.count}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-center gap-2 text-sm font-black text-slate-200"><Eye className="h-4 w-4" />Presence & engagement</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Camera-based eye contact and posture analysis are not captured in this version. This section is ready for post-interview multimodal processing later.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <h2 className="flex items-center gap-2 text-2xl font-black"><Wand2 className="h-6 w-6 text-emerald-300" />Recommended improvement plan</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {report.improvementPlan.map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <p className="text-lg font-black text-white">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.action}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry weakest answer
        </button>
      </section>
    </>
  );
}

export default function ResultsPage() {
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const [result] = useState<StoredResult>(() => readResultFromStorage());
  const [isMounted, setIsMounted] = useState(false);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    setPlan(getWorkZoCurrentPlan());
    recordWorkZoReportViewed();
    setIsMounted(true);
  }, []);

  const report = useMemo(() => buildRichReport(result), [result]);
  const limits = getWorkZoPlanLimits(plan);
  const isPremium = isMounted && (limits.advancedReports || result.isPremium === true || result.plan === "premium");

  function openUpgrade() {
    setUpgradeFeature("advancedReports");
  }

  function retryWeakestAnswer() {
    if (!isPremium) {
      openUpgrade();
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "workzo_retry_weakest_answer",
        JSON.stringify({
          weakAnswer: report.answerInsights[0] || null,
          createdAt: new Date().toISOString(),
        }),
      );
      window.location.href = "/interview?mode=retry-weakest";
    }
  }

  return (
    <main className="min-h-screen bg-[#050a12] px-5 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-200 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>

          <div className="flex items-center gap-3">
            <PremiumUsageBadge />
            <Link href="/pricing" className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400">
              Pricing
            </Link>
          </div>
        </header>

        {!isMounted || !isPremium ? (
          <FreeReport report={report} onUnlock={openUpgrade} />
        ) : (
          <PremiumReport report={report} onRetry={retryWeakestAnswer} />
        )}
      </div>

      <UpgradeModal
        open={Boolean(upgradeFeature)}
        feature={upgradeFeature}
        onClose={() => setUpgradeFeature("")}
        onUpgrade={() => setUpgradeFeature("")}
      />
    </main>
  );
}
