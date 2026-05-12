import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Speaker = "user" | "recruiter" | "candidate" | "assistant" | "system";

type TranscriptItem = {
  id?: string;
  speaker?: Speaker;
  role?: Speaker;
  text?: string;
  content?: string;
  timestamp?: string;
};

type MemoryItem = {
  id?: string;
  label: string;
  value: string;
  importance: "low" | "medium" | "high";
};

type InterviewSetup = {
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  companyName?: string;
  country?: string;
  language?: string;
  recruiterPersonality?: string;
  recruiterStyle?: string;
  pressureMode?: string;
};

type LiveScore = {
  confidence: number;
  relevance: number;
  structure: number;
  evidence: number;
  clarity: number;
  overall: number;
};

type InterviewRequestBody = {
  mode?: "start" | "answer" | "next" | "score" | "finish";
  answer?: string;
  currentQuestion?: string;
  question?: string;
  setup?: InterviewSetup;
  transcript?: TranscriptItem[];
  recruiterMemory?: MemoryItem[];
  pressureLevel?: number;
  emotionState?: string;
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  roleTitle?: string;
  companyName?: string;
  country?: string;
  language?: string;
  recruiterPersonality?: string;
  recruiterStyle?: string;
  pressureMode?: string;
};

type Contradiction = {
  field: string;
  candidateClaim: string;
  resumeEvidence: string;
  severity: "low" | "medium" | "high";
  clarificationQuestion: string;
};

type InterviewApiResponse = {
  ok: true;
  mode: string;
  recruiterReply: string;
  recruiterReaction: string;
  question: string;
  nextQuestion: string;
  interruption:
    | {
        shouldInterrupt: boolean;
        interruptionMessage: string;
        severity: "low" | "medium" | "high";
      }
    | "";
  contradictions: string[];
  contradictionDetails: Contradiction[];
  recruiterMood: "Analytical" | "Skeptical" | "Interested" | "Neutral" | "Supportive";
  emotionState: "skeptical" | "interested" | "neutral" | "supportive" | "concerned";
  pressureLevel: number;
  liveScore: LiveScore;
  score: LiveScore;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  risks: string[];
  recruiterMemory: MemoryItem[];
  memoryUpdates: MemoryItem[];
  resultSnapshot: {
    overall: number;
    readiness: "Interview ready" | "Almost ready" | "Needs practice";
    recruiterTrust: number;
    strongestSignal: string;
    weakestSignal: string;
    nextAction: string;
  };
};

const recruiterQuestions = [
  "Tell me about yourself and keep it relevant to this role.",
  "What measurable impact did you create in your previous role?",
  "Why should we hire you for this position?",
  "Tell me about a difficult situation and how you handled it.",
  "What is your biggest professional weakness right now?",
  "Walk me through one achievement from your CV that is directly useful for this role.",
  "I see your background here. What makes you ready for this specific position?",
];

function randomQuestion() {
  return recruiterQuestions[Math.floor(Math.random() * recruiterQuestions.length)];
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value: number, min = 0, max = 100) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getSetup(body: InterviewRequestBody): Required<InterviewSetup> {
  return {
    cvText: cleanText(body.setup?.cvText ?? body.cvText),
    jobDescription: cleanText(body.setup?.jobDescription ?? body.jobDescription),
    targetRole: cleanText(body.setup?.targetRole ?? body.targetRole ?? body.roleTitle) || "General Role",
    companyName: cleanText(body.setup?.companyName ?? body.companyName) || "Target Company",
    country: cleanText(body.setup?.country ?? body.country) || "Global",
    language: cleanText(body.setup?.language ?? body.language) || "English",
    recruiterPersonality:
      cleanText(body.setup?.recruiterPersonality ?? body.recruiterPersonality) || "Analytical recruiter",
    recruiterStyle: cleanText(body.setup?.recruiterStyle ?? body.recruiterStyle) || "Balanced",
    pressureMode: cleanText(body.setup?.pressureMode ?? body.pressureMode) || "Realistic",
  };
}

function normalizeTranscript(items: TranscriptItem[] = []) {
  return items
    .map((item) => {
      const speaker = item.speaker ?? item.role ?? "system";
      const text = cleanText(item.text ?? item.content);
      return { speaker, text };
    })
    .filter((item) => item.text)
    .slice(-16);
}

function extractLikelyNames(text: string) {
  const names = new Set<string>();
  const lines = text
    .split(/\n|•|\|/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);

  for (const line of lines) {
    const words = line.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    if (words.length >= 2 && words.length <= 4) {
      const candidate = words.slice(0, 3).join(" ");
      if (!/(university|school|engineer|analyst|developer|manager|germany|india|email|phone|linkedin|resume|curriculum)/i.test(candidate)) {
        names.add(candidate);
      }
    }
  }

  return Array.from(names).slice(0, 4);
}

function extractYears(text: string) {
  return Array.from(new Set(text.match(/\b(19|20)\d{2}\b/g) || []));
}

function extractLocations(text: string) {
  const locations = [
    "germany",
    "berlin",
    "munich",
    "hamburg",
    "nuremberg",
    "frankfurt",
    "india",
    "chennai",
    "bangalore",
    "bengaluru",
    "coimbatore",
    "hyderabad",
    "delhi",
    "london",
    "netherlands",
    "amsterdam",
    "usa",
    "united states",
    "canada",
    "singapore",
    "dubai",
  ];

  const lower = normalize(text);
  return locations.filter((place) => lower.includes(place));
}

function extractCompanies(text: string) {
  const companies = new Set<string>();
  const known =
    /\b(Zoho|Google|Microsoft|Amazon|WBS Coding School|Accenture|TCS|Infosys|Cognizant|Capgemini|Deloitte|IBM|SAP|Salesforce|Oracle)\b/gi;

  for (const match of text.match(known) || []) {
    companies.add(match);
  }

  const lines = text
    .split(/\n/)
    .filter((line) => /(engineer|analyst|developer|support|consultant|manager|specialist|intern|company|corp|ltd|gmbh)/i.test(line))
    .slice(0, 20);

  for (const line of lines) {
    const words = line.match(/\b[A-Z][A-Za-z0-9&.\-]{1,}\b/g) || [];
    const phrase = words.slice(0, 4).join(" ");
    if (phrase && phrase.length > 2) companies.add(phrase);
  }

  return Array.from(companies).slice(0, 12);
}

function extractSkills(text: string) {
  const skills = [
    "python",
    "sql",
    "excel",
    "tableau",
    "power bi",
    "javascript",
    "typescript",
    "react",
    "next.js",
    "streamlit",
    "machine learning",
    "deep learning",
    "generative ai",
    "openai",
    "langchain",
    "data analysis",
    "technical support",
    "customer support",
    "customer success",
    "api",
    "crm",
    "zoho",
    "html",
    "css",
    "tailwind",
    "firebase",
    "supabase",
  ];

  const lower = normalize(text);
  return skills.filter((skill) => lower.includes(skill));
}

function buildResumeFacts(cvText: string) {
  return {
    names: extractLikelyNames(cvText),
    years: extractYears(cvText),
    locations: extractLocations(cvText),
    companies: extractCompanies(cvText),
    skills: extractSkills(cvText),
  };
}

function issueText(issue: Contradiction) {
  return `${issue.field}: candidate said "${issue.candidateClaim}", but ${issue.resumeEvidence}`;
}

function detectContradictions(answer: string, cvText: string): Contradiction[] {
  if (!answer || !cvText) return [];

  const issues: Contradiction[] = [];
  const facts = buildResumeFacts(cvText);
  const normalizedCv = normalize(cvText);

  const nameClaim =
    answer.match(/\bmy name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i) ||
    answer.match(/\bi am\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i);

  if (nameClaim?.[1] && facts.names.length > 0) {
    const claimed = nameClaim[1];
    const matches = facts.names.some(
      (name) => normalize(name).includes(normalize(claimed)) || normalize(claimed).includes(normalize(name))
    );

    if (!matches) {
      issues.push({
        field: "candidate name",
        candidateClaim: claimed,
        resumeEvidence: `the CV appears to show ${facts.names.join(", ")}`,
        severity: "high",
        clarificationQuestion: `Let me stop you there — you said your name is ${claimed}, but your CV appears to show ${facts.names[0]}. Which one should I use?`,
      });
    }
  }

  const answerLocations = extractLocations(answer);
  for (const location of answerLocations) {
    const cvHasLocation = facts.locations.includes(location);
    const otherLocations = facts.locations.filter((item) => item !== location);

    if (!cvHasLocation && otherLocations.length > 0) {
      issues.push({
        field: "location",
        candidateClaim: location,
        resumeEvidence: `the CV mentions ${otherLocations.join(", ")}`,
        severity: "medium",
        clarificationQuestion: `You mentioned ${location}, but your CV mentions ${otherLocations[0]}. Are you describing your current location, previous location, or something else?`,
      });
    }
  }

  const answerYears = extractYears(answer);
  for (const year of answerYears) {
    if (facts.years.length > 0 && !facts.years.includes(year)) {
      issues.push({
        field: "timeline",
        candidateClaim: year,
        resumeEvidence: `the CV timeline includes ${facts.years.slice(0, 8).join(", ")}`,
        severity: "medium",
        clarificationQuestion: `You mentioned ${year}, but I do not see that year in your CV timeline. Can you clarify where it fits?`,
      });
    }
  }

  const answerCompanies = extractCompanies(answer);
  for (const company of answerCompanies) {
    if (company.length > 3 && facts.companies.length > 0 && !normalizedCv.includes(normalize(company))) {
      issues.push({
        field: "company/employer",
        candidateClaim: company,
        resumeEvidence: `the CV company/context includes ${facts.companies.slice(0, 6).join(", ")}`,
        severity: "medium",
        clarificationQuestion: `You mentioned ${company}, but I do not clearly see that in your CV. Was this a job, project, client, or example?`,
      });
    }
  }

  const leadershipClaims = [
    { regex: /\bmanaged\s+([0-9]+|a|the)?\s*(team|people|members|engineers|analysts)/i, label: "team management" },
    { regex: /\bled\s+(a|the)?\s*(team|project|migration|implementation|initiative)/i, label: "leadership" },
    { regex: /\bowned\s+(the|a)?\s*(project|product|process|pipeline|system)/i, label: "ownership" },
  ];

  for (const claim of leadershipClaims) {
    const match = answer.match(claim.regex)?.[0];
    if (match && !claim.regex.test(cvText)) {
      issues.push({
        field: claim.label,
        candidateClaim: match,
        resumeEvidence: `the CV does not clearly support this ${claim.label} claim`,
        severity: "high",
        clarificationQuestion: `Let me stop you there — you said "${match}", but I do not see that level of ${claim.label} in your CV. What exactly did you personally own?`,
      });
    }
  }

  const metricMatches = [
    ...(answer.match(/\b\d+%/g) || []),
    ...(answer.match(/\b\d+\s*(users|customers|tickets|cases|projects|people|team members|hours|days|weeks|months|years)\b/gi) || []),
  ];

  for (const metric of metricMatches) {
    if (!normalizedCv.includes(normalize(metric))) {
      issues.push({
        field: "measurable impact",
        candidateClaim: metric,
        resumeEvidence: "that exact metric is not visible in the CV context",
        severity: "medium",
        clarificationQuestion: `You mentioned ${metric}, but I do not see that number in your CV. Is this a real metric from your work, or are you estimating it?`,
      });
    }
  }

  return Array.from(
    new Map(issues.map((issue) => [`${issue.field}-${normalize(issue.candidateClaim)}`, issue])).values()
  ).slice(0, 7);
}

function strongestIssue(issues: Contradiction[]) {
  return (
    issues.find((issue) => issue.severity === "high") ||
    issues.find((issue) => issue.severity === "medium") ||
    issues[0]
  );
}

function recruiterFollowup(answer: string, contradictions: Contradiction[]) {
  if (contradictions.length > 0) {
    const top = strongestIssue(contradictions);
    return `Let me stop you there. ${top.clarificationQuestion}`;
  }

  const lower = answer.toLowerCase();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  if (!lower.includes("%") && !/\b\d+\b/.test(lower) && !/(improved|reduced|increased|saved)/i.test(answer)) {
    return "Let me stop you there — I still don’t understand the measurable impact.";
  }

  if (wordCount < 25) {
    return "That answer is too short. Can you give me a more structured example?";
  }

  if (/\bmaybe|i think|probably|not sure|kind of\b/i.test(answer)) {
    return "You sound uncertain. Recruiters usually look for stronger ownership.";
  }

  return "Interesting. Give me one specific example with business impact.";
}

function scoreAnswer(answer: string, contradictions: Contradiction[]): LiveScore {
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const hasMetric = /%|\b\d+\b|customers?|users?|tickets?|cases?|hours?|days?|weeks?|months?|revenue|cost|saved/i.test(answer);
  const hasImpactVerb = /\bimproved|reduced|increased|saved|resolved|built|automated|delivered|supported\b/i.test(answer);
  const hasStructure = /\bfirst|second|finally|situation|task|action|result|because|therefore|for example\b/i.test(answer);
  const uncertainty = /\bmaybe|i think|probably|not sure|kind of\b/i.test(answer);

  const penalty = contradictions.reduce((total, item) => {
    if (item.severity === "high") return total + 16;
    if (item.severity === "medium") return total + 10;
    return total + 5;
  }, 0);

  const evidence = clamp((hasMetric ? 78 : 48) + (hasImpactVerb ? 8 : 0) - penalty);
  const structure = clamp((wordCount > 40 ? 76 : 52) + (hasStructure ? 10 : 0) - contradictions.length * 3);
  const confidence = clamp((uncertainty ? 45 : 74) - penalty);
  const relevance = clamp(72 + (hasImpactVerb ? 6 : 0) - penalty);
  const clarity = clamp((wordCount >= 25 && wordCount <= 140 ? 76 : 62) - (uncertainty ? 6 : 0) - contradictions.length * 4);
  const overall = clamp((confidence + relevance + structure + evidence + clarity) / 5);

  return { confidence, relevance, structure, evidence, clarity, overall };
}

function readinessFromScore(score: number): "Interview ready" | "Almost ready" | "Needs practice" {
  if (score >= 80) return "Interview ready";
  if (score >= 65) return "Almost ready";
  return "Needs practice";
}

function buildMemory(existingMemory: MemoryItem[], followup: string, contradictions: Contradiction[], score: LiveScore) {
  const updates: MemoryItem[] = [];

  contradictions.forEach((issue) => {
    updates.push({
      label: "CV contradiction detected",
      value: issueText(issue),
      importance: issue.severity === "high" ? "high" : "medium",
    });
  });

  updates.push({
    label: "Recent recruiter observation",
    value: followup,
    importance: contradictions.length > 0 || score.overall < 65 ? "high" : "medium",
  });

  if (score.evidence < 60) {
    updates.push({
      label: "Weak evidence pattern",
      value: "Candidate needs stronger measurable proof and concrete business impact.",
      importance: "high",
    });
  }

  return {
    recruiterMemory: [...existingMemory, ...updates].slice(-18),
    memoryUpdates: updates,
  };
}

function localEngine(body: InterviewRequestBody): InterviewApiResponse {
  const setup = getSetup(body);
  const mode = body.mode ?? "answer";
  const answer = cleanText(body.answer);
  const pressureLevel = clamp(Number(body.pressureLevel ?? 35), 0, 100);
  const existingMemory = Array.isArray(body.recruiterMemory) ? body.recruiterMemory : [];

  const neutralScore: LiveScore = {
    confidence: 65,
    relevance: 65,
    structure: 65,
    evidence: 65,
    clarity: 65,
    overall: 65,
  };

  if (mode === "start" || !answer) {
    const firstQuestion =
      cleanText(body.currentQuestion ?? body.question) ||
      `I reviewed your CV for the ${setup.targetRole} role. Tell me about yourself and keep it relevant to this position.`;

    return {
      ok: true,
      mode,
      recruiterReply: "Good to meet you. I have your CV and the role context in front of me, so I’ll keep this close to a real interview.",
      recruiterReaction: "Good to meet you. I have your CV and the role context in front of me, so I’ll keep this close to a real interview.",
      question: firstQuestion,
      nextQuestion: firstQuestion,
      interruption: "",
      contradictions: [],
      contradictionDetails: [],
      recruiterMood: "Analytical",
      emotionState: "neutral",
      pressureLevel,
      liveScore: neutralScore,
      score: neutralScore,
      strengths: [],
      weaknesses: [],
      improvements: ["Answer with a clear structure and truthful examples."],
      risks: [],
      recruiterMemory: existingMemory,
      memoryUpdates: [],
      resultSnapshot: {
        overall: 65,
        readiness: "Almost ready",
        recruiterTrust: 68,
        strongestSignal: "Interview started with CV/JD context.",
        weakestSignal: "No answer assessed yet.",
        nextAction: "Answer the first question with a result-first structure.",
      },
    };
  }

  const contradictionDetails = detectContradictions(answer, setup.cvText);
  const hasContradiction = contradictionDetails.length > 0;
  const top = hasContradiction ? strongestIssue(contradictionDetails) : null;
  const followup = recruiterFollowup(answer, contradictionDetails);
  const score = scoreAnswer(answer, contradictionDetails);
  const updatedPressure = clamp(
    pressureLevel + (hasContradiction ? 22 : answer.length < 90 ? 10 : -5),
    0,
    100
  );
  const memory = buildMemory(existingMemory, followup, contradictionDetails, score);
  const contradictionTexts = contradictionDetails.map(issueText);

  const nextQuestion = top
    ? top.clarificationQuestion
    : score.evidence < 60
      ? "What measurable result or business impact can you attach to that example?"
      : score.structure < 65
        ? "Can you repeat that using Situation, Action, and Result in under 60 seconds?"
        : randomQuestion();

  const interruption = hasContradiction
    ? {
        shouldInterrupt: true,
        interruptionMessage: followup,
        severity: top?.severity || "medium",
      }
    : followup.startsWith("Let me stop you")
      ? {
          shouldInterrupt: true,
          interruptionMessage: followup,
          severity: "medium" as const,
        }
      : "";

  return {
    ok: true,
    mode,
    recruiterReply: followup,
    recruiterReaction: followup,
    question: nextQuestion,
    nextQuestion,
    interruption,
    contradictions: contradictionTexts,
    contradictionDetails,
    recruiterMood: hasContradiction ? "Skeptical" : score.overall > 78 ? "Interested" : "Neutral",
    emotionState: hasContradiction ? "skeptical" : score.overall > 78 ? "interested" : "neutral",
    pressureLevel: updatedPressure,
    liveScore: score,
    score,
    strengths:
      score.overall >= 75
        ? ["Relevant answer", "Good confidence", score.evidence >= 70 ? "Some measurable proof" : "Clear intent"]
        : ["Stayed engaged with the question"],
    weaknesses: [
      ...(hasContradiction ? ["Answer conflicts with CV context"] : []),
      ...(score.evidence < 65 ? ["Missing measurable proof"] : []),
      ...(score.structure < 65 ? ["Needs stronger answer structure"] : []),
    ].slice(0, 4),
    improvements: [
      hasContradiction
        ? "Clarify the mismatch before continuing. Do not invent or exaggerate details."
        : "Use result-first structure, then one specific example.",
      "Add only truthful metrics you can defend.",
      "Tie the answer directly to the job description.",
    ],
    risks: contradictionTexts.slice(0, 4),
    recruiterMemory: memory.recruiterMemory,
    memoryUpdates: memory.memoryUpdates,
    resultSnapshot: {
      overall: score.overall,
      readiness: readinessFromScore(score.overall),
      recruiterTrust: clamp((score.confidence + score.relevance + score.structure + score.evidence) / 4 - contradictionDetails.length * 8),
      strongestSignal:
        score.evidence >= 75 ? "Used measurable evidence" : score.confidence >= 72 ? "Confident delivery" : "Stayed engaged",
      weakestSignal: hasContradiction ? "CV contradiction or unsupported claim" : score.evidence < 60 ? "Missing measurable proof" : "Needs deeper role relevance",
      nextAction: hasContradiction
        ? "Clarify the CV mismatch and retry the answer truthfully."
        : score.overall >= 75
          ? "Continue with tougher follow-up questions."
          : "Retry this answer with result first, one example, and one truthful metric.",
    },
  };
}

function buildOpenAIPrompt(body: InterviewRequestBody, local: InterviewApiResponse) {
  const setup = getSetup(body);
  const answer = cleanText(body.answer);
  const currentQuestion = cleanText(body.currentQuestion ?? body.question);
  const transcript = normalizeTranscript(body.transcript);
  const memory = Array.isArray(body.recruiterMemory) ? body.recruiterMemory.slice(-10) : [];

  return `
You are WorkZo AI's Real Interview engine.

CRITICAL RULE:
If the local deterministic analysis contains contradictions, you MUST stop and clarify.
Do NOT continue the interview normally.
Do NOT accept the candidate's new detail as true if it conflicts with the CV.
Your next question must be the clarification question.

Candidate answer:
${answer || "No answer yet."}

Current recruiter question:
${currentQuestion || "No active question."}

CV:
${setup.cvText.slice(0, 9000) || "No CV text provided."}

Job description:
${setup.jobDescription.slice(0, 7000) || "No JD provided."}

Recent transcript:
${transcript.length ? transcript.map((item) => `${item.speaker}: ${item.text}`).join("\n") : "No transcript yet."}

Existing memory:
${memory.length ? memory.map((item) => `- ${item.label}: ${item.value}`).join("\n") : "No memory yet."}

Local analysis to preserve:
${JSON.stringify(local, null, 2)}

Return ONLY JSON with the same shape as local analysis.
Rules:
- If contradictions exist, recruiterMood must be Skeptical.
- If contradictions exist, emotionState must be skeptical.
- If contradictions exist, interruption.shouldInterrupt must be true.
- If contradictions exist, nextQuestion must ask clarification.
- Do not inflate scores.
`;
}

function parseJsonObject(text: string) {
  const cleaned = text.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("OpenAI did not return valid JSON.");
  }
}

function mergeAiResponse(local: InterviewApiResponse, ai: Partial<InterviewApiResponse>): InterviewApiResponse {
  const hasContradiction = local.contradictionDetails.length > 0;
  const top = hasContradiction ? strongestIssue(local.contradictionDetails) : null;

  const nextQuestion = hasContradiction
    ? top?.clarificationQuestion || local.nextQuestion
    : cleanText(ai.nextQuestion ?? ai.question) || local.nextQuestion;

  const recruiterReply = hasContradiction
    ? cleanText(ai.recruiterReply) || local.recruiterReply
    : cleanText(ai.recruiterReply ?? ai.recruiterReaction) || local.recruiterReply;

  const score = ai.liveScore || ai.score || local.liveScore;

  const liveScore: LiveScore = {
    confidence: clamp(Number(score.confidence ?? local.liveScore.confidence)),
    relevance: clamp(Number(score.relevance ?? local.liveScore.relevance)),
    structure: clamp(Number(score.structure ?? local.liveScore.structure)),
    evidence: clamp(Number(score.evidence ?? local.liveScore.evidence)),
    clarity: clamp(Number(score.clarity ?? local.liveScore.clarity)),
    overall: clamp(Number(score.overall ?? local.liveScore.overall)),
  };

  return {
    ...local,
    recruiterReply,
    recruiterReaction: cleanText(ai.recruiterReaction) || recruiterReply,
    question: nextQuestion,
    nextQuestion,
    recruiterMood: hasContradiction ? "Skeptical" : local.recruiterMood,
    emotionState: hasContradiction ? "skeptical" : local.emotionState,
    pressureLevel: hasContradiction ? clamp(local.pressureLevel + 8) : local.pressureLevel,
    liveScore,
    score: liveScore,
    resultSnapshot: {
      ...local.resultSnapshot,
      overall: liveScore.overall,
      recruiterTrust: hasContradiction ? clamp(local.resultSnapshot.recruiterTrust - 12) : local.resultSnapshot.recruiterTrust,
      weakestSignal: hasContradiction ? "CV contradiction or unsupported claim" : local.resultSnapshot.weakestSignal,
      nextAction: hasContradiction ? "Clarify the CV mismatch before continuing." : local.resultSnapshot.nextAction,
    },
  };
}

export async function POST(request: NextRequest) {
  let body: InterviewRequestBody;

  try {
    body = (await request.json()) as InterviewRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const local = localEngine(body);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      ...local,
      recruiterMemory: [
        ...local.recruiterMemory,
        {
          label: "AI fallback mode",
          value: "OPENAI_API_KEY is missing. WorkZo used the local contradiction-aware interview engine.",
          importance: "medium",
        },
      ].slice(-18),
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are WorkZo AI's strict JSON-only recruiter simulation engine. You must challenge CV contradictions. Never return markdown or prose outside JSON.",
        },
        {
          role: "user",
          content: buildOpenAIPrompt(body, local),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const ai = parseJsonObject(raw) as Partial<InterviewApiResponse>;
    return NextResponse.json(mergeAiResponse(local, ai));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error.";

    return NextResponse.json({
      ...local,
      recruiterMemory: [
        ...local.recruiterMemory,
        {
          label: "OpenAI fallback",
          value: `OpenAI call failed, so WorkZo used the local contradiction-aware interview engine. ${message}`,
          importance: "medium",
        },
      ].slice(-18),
    });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "WorkZo AI Interview API",
    status: "ready",
    intelligence: "contradiction-aware",
  });
}
