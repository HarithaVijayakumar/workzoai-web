import { NextResponse } from "next/server";
import OpenAI from "openai";

import {
  buildRecruiterMemoryPrompt,
  normalizeInterviewSetup,
  type WorkZoInterviewSetup,
} from "@/lib/workzoInterviewSetup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestBody = {
  answer?: string;
  currentQuestion?: string;
  transcript?: Array<{ role?: string; text?: string; time?: string }>;
  setup?: Partial<WorkZoInterviewSetup>;
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  targetMarket?: string;
  companyStyle?: string;
  recruiterPersonality?: string;
  pressure?: number;
  recruiterTrust?: number;
  scores?: Record<string, number>;
  memory?: {
    strengths?: string[];
    weaknesses?: string[];
    improvements?: string[];
    risks?: string[];
    contradictions?: string[];
    missingMetrics?: string[];
    vagueAnswers?: string[];
    repeatedPatterns?: string[];
  };
  contradictions?: string[];
  trustTimeline?: Array<{
    direction?: "up" | "down" | "stable";
    value?: number;
    reason?: string;
  }>;
};

function safeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : fallback;
}

function resolveRecruiterIdentity(recruiterPersonality: string) {
  const key = recruiterPersonality.toLowerCase();

  if (key.includes("markus") || key.includes("german") || key.includes("corporate")) {
    return {
      name: "Markus",
      role: "Corporate Recruiter",
      style: "structured, formal, precise, analytical, process-oriented",
    };
  }

  if (key.includes("priya") || key.includes("startup")) {
    return {
      name: "Priya",
      role: "Startup Recruiter",
      style: "fast-paced, practical, ownership-focused, impact-oriented",
    };
  }

  if (key.includes("sarah") || key.includes("friendly") || key.includes("hr")) {
    return {
      name: "Sarah",
      role: "HR Recruiter",
      style: "warm, supportive, communication-focused, emotionally intelligent",
    };
  }

  return {
    name: "Daniel",
    role: "Hiring Manager",
    style: "analytical, skeptical, evidence-focused, detailed",
  };
}

function getScore(answer: string, setup: WorkZoInterviewSetup, previousTrust: number) {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const text = answer.toLowerCase();

  const hasMetric = /\d|%|percent|reduced|increased|improved|saved|users|customers|tickets|revenue|time/i.test(answer);
  const hasOwnership = /\b(i|my|me)\b/i.test(answer);
  const allSkills = [
    ...(setup.jobMemoryProfile?.requiredSkills || []),
    ...(setup.recruiterMemoryProfile?.skills.technical || []),
    ...(setup.recruiterMemoryProfile?.skills.business || []),
  ];
  const hasRoleFit = allSkills.some((skill) => text.includes(skill.toLowerCase()));

  const clarity = words.length < 25 ? 38 : words.length > 160 ? 52 : 76;
  const evidence = hasMetric ? 82 : 42;
  const confidence = hasOwnership ? 74 : 45;
  const relevance = hasRoleFit ? 78 : 54;
  const structure = /first|then|finally|result|because|situation|action|impact/i.test(answer) ? 76 : 52;

  const overall = Math.round((clarity + evidence + confidence + relevance + structure) / 5);
  const recruiterTrust = Math.max(18, Math.min(94, previousTrust + Math.round((overall - 58) / 4)));

  return {
    score: {
      clarity,
      relevance,
      confidence,
      evidence,
      structure,
      overall,
    },
    recruiterTrust,
  };
}

function fallbackQuestion(setup: WorkZoInterviewSetup, score: ReturnType<typeof getScore>["score"]) {
  const name = setup.recruiterMemoryProfile?.candidateName;
  const prefix = name ? `${name}, ` : "";
  const role = setup.jobMemoryProfile?.roleTitle || setup.targetRole || "this role";
  const skill = setup.jobMemoryProfile?.requiredSkills?.[0] || setup.recruiterMemoryProfile?.skills.technical?.[0];
  const fact = setup.recruiterMemoryProfile?.recruiterMemory?.[0];

  if (score.evidence < 55) {
    return `${prefix}I need a measurable result. Can you give me one number, outcome, or business impact from that example?`;
  }

  if (score.confidence < 55) {
    return `${prefix}what exactly did you personally own in that situation?`;
  }

  if (skill) {
    return `${prefix}this role seems to require ${skill}. Can you connect one real example from your background to that requirement?`;
  }

  if (fact) {
    return `${prefix}I noticed this from your profile: ${fact}. Can you explain how it prepares you for ${role}?`;
  }

  return `${prefix}connect your answer directly to ${role}. What is your strongest proof that you can do this job?`;
}

function buildSystemPrompt(input: {
  setup: WorkZoInterviewSetup;
  recruiter: ReturnType<typeof resolveRecruiterIdentity>;
  currentQuestion: string;
  previousTrust: number;
}) {
  const { setup, recruiter, currentQuestion, previousTrust } = input;
  const memory = buildRecruiterMemoryPrompt(setup);

  return `
You are ${recruiter.name}, ${recruiter.role}, inside WorkZo AI.

RECRUITER IDENTITY LOCK:
- Your name is ${recruiter.name}.
- Your role is ${recruiter.role}.
- Your style is ${recruiter.style}.
- Never call yourself Alex.
- If asked your name, say: "I'm ${recruiter.name}, your WorkZo AI recruiter for this interview."

CV/JD ACCESS LOCK:
- You CAN see the Recruiter Memory Profile and Job Memory Profile below.
- If asked whether you can see the CV or JD, say yes and mention one real detail from the memory profile.
- Never say you cannot access the CV when the memory profile exists.
- Never invent role, company, industry, background, or metrics.
- Only use facts present in the memory profiles or raw backup text.
- If the role is unclear, say it is unclear. Do not invent "Senior Data Analyst" or financial services.

PRODUCT PROMISE:
"The closest thing to a real interview."

Previous recruiter trust: ${previousTrust}/100
Current question: ${currentQuestion || "Opening question"}

${memory}

RAW CV BACKUP ONLY IF NEEDED:
${setup.cvText.slice(0, 2200) || "No raw CV text loaded."}

RAW JD BACKUP ONLY IF NEEDED:
${setup.jobDescription.slice(0, 1800) || "No raw JD loaded."}

HOW TO RESPOND:
- Sound like a real recruiter, not a coach.
- Keep it short: 2–4 sentences.
- Ask exactly one focused follow-up question.
- Use at least one specific memory profile detail when possible.
- Challenge vague answers.
- Ask for metrics if proof is missing.
- Ask for ownership if the answer sounds team-based.
- Do not repeat long CV details.
- Return JSON only.

JSON:
{
  "recruiterMessage": "short realistic recruiter reaction",
  "followUpQuestion": "one specific follow-up question",
  "feedback": "one sentence about recruiter perception",
  "memoryStrength": "one remembered strength",
  "memoryWeakness": "one concern or gap"
}
`.trim();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as RequestBody;

    const setup = normalizeInterviewSetup({
      ...(body.setup || {}),
      cvText: body.cvText || body.setup?.cvText || "",
      jobDescription: body.jobDescription || body.setup?.jobDescription || "",
      targetRole: body.targetRole || body.setup?.targetRole || "General Role",
      targetMarket: body.targetMarket || body.setup?.targetMarket || "Global",
      companyStyle: body.companyStyle || body.setup?.companyStyle || "Realistic",
      recruiterPersonality:
        body.recruiterPersonality ||
        body.setup?.recruiterPersonality ||
        "analytical_hiring_manager",
    });

    const answer = body.answer?.trim();

    if (!answer) {
      return NextResponse.json({ error: "Answer is required." }, { status: 400 });
    }

    const previousTrust = safeNumber(body.recruiterTrust, 58);
    const recruiter = resolveRecruiterIdentity(setup.recruiterPersonality);
    const scoreResult = getScore(answer, setup, previousTrust);

    let recruiterMessage = "I understand the direction of your answer.";
    let followUpQuestion = fallbackQuestion(setup, scoreResult.score);
    let feedback = "The recruiter is evaluating relevance, proof, and ownership.";
    let memoryStrength =
      setup.recruiterMemoryProfile?.recruiterMemory?.[0] ||
      setup.recruiterMemoryProfile?.skills.technical?.[0] ||
      "";
    let memoryWeakness =
      scoreResult.score.evidence < 55
        ? "The answer needs a clearer measurable result."
        : "";

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_INTERVIEW_MODEL || "gpt-4o-mini",
        temperature: 0.45,
        max_tokens: 650,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildSystemPrompt({
              setup,
              recruiter,
              currentQuestion: body.currentQuestion || "",
              previousTrust,
            }),
          },
          {
            role: "user",
            content: JSON.stringify({
              candidateAnswer: answer,
              recentTranscript: body.transcript?.slice(-8) || [],
              required:
                "Use recruiter memory profile first. Do not invent role/company/industry. Ask one specific follow-up.",
            }),
          },
        ],
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

      recruiterMessage = parsed.recruiterMessage || recruiterMessage;
      followUpQuestion = parsed.followUpQuestion || followUpQuestion;
      feedback = parsed.feedback || feedback;
      memoryStrength = parsed.memoryStrength || memoryStrength;
      memoryWeakness = parsed.memoryWeakness || memoryWeakness;
    }

    const finalQuestion = `${recruiterMessage} ${followUpQuestion}`.trim();
    const trustDirection =
      scoreResult.recruiterTrust > previousTrust
        ? "up"
        : scoreResult.recruiterTrust < previousTrust
          ? "down"
          : "stable";

    return NextResponse.json({
      recruiterName: recruiter.name,
      recruiterRole: recruiter.role,
      recruiterPersonality: setup.recruiterPersonality,

      question: finalQuestion,
      reply: finalQuestion,
      message: finalQuestion,
      content: finalQuestion,
      recruiterMessage,
      followUpQuestion,
      feedback,

      mood:
        scoreResult.recruiterTrust >= 72
          ? "impressed"
          : scoreResult.recruiterTrust <= 42
            ? "skeptical"
            : "neutral",
      emotion:
        scoreResult.recruiterTrust >= 72
          ? "impressed"
          : scoreResult.recruiterTrust <= 42
            ? "skeptical"
            : "neutral",
      pressure:
        scoreResult.score.overall < 55
          ? Math.min(88, safeNumber(body.pressure, 35) + 12)
          : Math.max(25, safeNumber(body.pressure, 35) - 4),
      recruiterTrust: scoreResult.recruiterTrust,
      trust: scoreResult.recruiterTrust,
      score: scoreResult.score,
      scores: scoreResult.score,

      memory: {
        strengths: [memoryStrength].filter(Boolean),
        weaknesses: [memoryWeakness].filter(Boolean),
        improvements: [
          scoreResult.score.evidence < 55
            ? "Add measurable impact."
            : "Connect the answer more tightly to the JD.",
        ],
        risks: [],
        contradictions: body.contradictions || [],
        missingMetrics:
          scoreResult.score.evidence < 55
            ? ["No clear metric or outcome in the answer."]
            : [],
        vagueAnswers:
          scoreResult.score.confidence < 55
            ? ["Ownership was not clear enough."]
            : [],
        repeatedPatterns: setup.recruiterMemoryProfile?.recruiterMemory || [],
      },

      interruption: {
        shouldInterrupt: scoreResult.score.overall < 45,
        severity: scoreResult.score.overall < 35 ? "high" : "medium",
        interruptionMessage:
          scoreResult.score.overall < 45
            ? "Let me stop you there. I need a more concrete example with your action and the result."
            : "",
      },

      wowMoment: {
        shouldTrigger: scoreResult.recruiterTrust < previousTrust - 6,
        type: trustDirection === "down" ? "trust_drop" : "neutral",
        line:
          trustDirection === "down"
            ? "Your answer is not fully convincing yet because the proof is still too vague."
            : "",
        emotionalTag:
          trustDirection === "down"
            ? "Trust dropped because the answer lacked proof."
            : "Trust remained stable.",
      },

      arc: {
        phase:
          scoreResult.recruiterTrust < 45
            ? "pressure"
            : scoreResult.recruiterTrust > 70
              ? "probing"
              : "opening",
        instruction:
          "Continue adapting questions based on recruiter memory profile, JD relevance, evidence, and ownership.",
      },

      trustTimeline: [
        ...(body.trustTimeline || []),
        {
          direction: trustDirection,
          value: scoreResult.recruiterTrust,
          reason: feedback,
        },
      ].slice(-12),

      liveUiState: {
        label:
          trustDirection === "up"
            ? "Recruiter confidence improved"
            : trustDirection === "down"
              ? "Recruiter trust dropped"
              : "Recruiter is still evaluating",
      },

      postInterviewPsychologyReport: {
        finalDecision:
          scoreResult.recruiterTrust > 70
            ? "continue"
            : scoreResult.recruiterTrust > 48
              ? "borderline"
              : "reject",
        finalPerception: feedback,
        strongestSignal: memoryStrength,
        weakestPattern: memoryWeakness,
        nextPracticeAction:
          scoreResult.score.evidence < 55
            ? "Practice adding measurable impact to every answer."
            : "Practice connecting each answer to the job description.",
      },

      contextDebug: {
        hasCvText: setup.cvText.length > 50,
        hasJobDescription: setup.jobDescription.length > 30,
        hasRecruiterMemoryProfile: Boolean(setup.recruiterMemoryProfile),
        hasJobMemoryProfile: Boolean(setup.jobMemoryProfile),
        candidateName: setup.recruiterMemoryProfile?.candidateName || "",
        roleTitle: setup.jobMemoryProfile?.roleTitle || setup.targetRole,
        memoryFacts: setup.recruiterMemoryProfile?.recruiterMemory || [],
        jobResponsibilities: setup.jobMemoryProfile?.responsibilities || [],
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Interview engine failed.";

    return NextResponse.json(
      {
        error: message,
        question:
          "Something went wrong. Please continue with one specific example from your background and connect it to the job description.",
        reply:
          "Something went wrong. Please continue with one specific example from your background and connect it to the job description.",
      },
      { status: 500 }
    );
  }
}
