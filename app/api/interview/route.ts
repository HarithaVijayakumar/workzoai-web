import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { evaluateAdaptiveState } from "@/lib/adaptiveEngine";
import { buildAdaptiveFollowUpQuestion } from "@/lib/companySimulationEngine";
import { evaluateInterruption } from "@/lib/interruptionEngine";
import { getRecruiterProfile } from "@/lib/recruiterEngine";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TranscriptItem = {
  speaker: "user" | "recruiter" | "system";
  text: string;
};

type InterviewRequest = {
  targetRole?: string;
  targetMarket?: string;
  companyStyle?: string;
  recruiterPersonality?: string;
  cvText?: string;
  jobDescription?: string;
  transcript?: TranscriptItem[];
  lastUserAnswer?: string;
  mode?: "text" | "voice";
};

function safeText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];
}

function buildFallbackQuestion(role: string) {
  return `Tell me about a recent experience that proves you are suitable for the ${
    role || "target"
  } role. Please answer with a clear situation, action, and result.`;
}

function calculateBasicScore(answer: string) {
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  const hasExample =
    /example|project|customer|client|team|built|improved|resolved|created|managed|worked|handled|supported/i.test(
      answer
    );

  const hasResult =
    /result|impact|reduced|increased|improved|saved|faster|percent|%|€|\$|users|customers|tickets|time/i.test(
      answer
    );

  const hasStructure =
    /first|then|finally|situation|task|action|result|because|therefore|so/i.test(
      answer
    );

  const clarity = Math.min(100, Math.max(35, wordCount * 2));
  const relevance = hasExample ? 75 : 50;
  const evidence = hasResult ? 80 : 45;
  const structure = hasStructure ? 78 : 50;
  const confidence = wordCount > 35 ? 72 : 48;

  const overall = Math.round(
    (clarity + relevance + evidence + structure + confidence) / 5
  );

  return {
    clarity,
    relevance,
    confidence,
    structure,
    evidence,
    overall,
  };
}

function generateFallbackFeedback(answer: string) {
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const improvements: string[] = [];
  const risks: string[] = [];

  if (wordCount >= 35) {
    strengths.push("Gives enough detail for recruiter evaluation");
  } else {
    weaknesses.push("Answer is too short");
    improvements.push("Expand the answer with one concrete example");
  }

  if (/customer|client|support|ticket|technical|zoho|service/i.test(answer)) {
    strengths.push("Shows customer-facing or technical support experience");
  }

  if (/data|sql|python|dashboard|analysis|tableau|excel/i.test(answer)) {
    strengths.push("Connects experience to data or analytical skills");
  }

  if (!/result|impact|improved|reduced|increased|saved|%|percent/i.test(answer)) {
    weaknesses.push("Missing measurable impact");
    improvements.push("Add a result, metric, or business outcome");
    risks.push("Recruiter may think the answer lacks proof");
  }

  if (!/situation|task|action|result|first|then|finally/i.test(answer)) {
    weaknesses.push("Structure could be clearer");
    improvements.push("Use STAR format: situation, action, result");
  }

  if (strengths.length === 0) {
    strengths.push("Shows willingness to answer and engage");
  }

  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    improvements: improvements.slice(0, 4),
    risks: risks.slice(0, 4),
  };
}

function extractMemory(answer: string) {
  const memories: {
    label: string;
    value: string;
    importance: "low" | "medium" | "high";
  }[] = [];

  if (/support|customer|client|ticket|technical/i.test(answer)) {
    memories.push({
      label: "Support experience",
      value: "Candidate referenced customer-facing or technical support work.",
      importance: "high",
    });
  }

  if (/data|sql|python|dashboard|analysis|tableau|excel/i.test(answer)) {
    memories.push({
      label: "Data skills",
      value: "Candidate referenced data, analysis, dashboards, or technical tools.",
      importance: "high",
    });
  }

  if (/gap|career break|break|relocation|pregnancy|transition/i.test(answer)) {
    memories.push({
      label: "Career transition",
      value:
        "Candidate may need a stronger explanation for career transition or gap.",
      importance: "medium",
    });
  }

  if (/team|stakeholder|communication|collaboration/i.test(answer)) {
    memories.push({
      label: "Communication signal",
      value: "Candidate referenced teamwork, stakeholders, or communication.",
      importance: "medium",
    });
  }

  return memories.slice(0, 4);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InterviewRequest;

    const targetRole = safeText(body.targetRole, "the target role");
    const targetMarket = safeText(body.targetMarket, "global");
    const companyStyle = safeText(body.companyStyle, "realistic");
    const recruiterPersonality = safeText(
      body.recruiterPersonality,
      "professional"
    );
    const cvText = safeText(body.cvText);
    const jobDescription = safeText(body.jobDescription);
    const lastUserAnswer = safeText(body.lastUserAnswer);
    const mode = body.mode || "text";
    const transcript = Array.isArray(body.transcript) ? body.transcript : [];

    const score = calculateBasicScore(lastUserAnswer);
    const memoryUpdates = extractMemory(lastUserAnswer);
    const fallbackFeedback = generateFallbackFeedback(lastUserAnswer);

    const recruiterProfile = getRecruiterProfile(
      recruiterPersonality,
      companyStyle
    );

    const adaptiveState = evaluateAdaptiveState({
      answer: lastUserAnswer,
      pressureLevel:
        score.overall < 55
          ? Math.max(65, recruiterProfile.pressureBias)
          : recruiterProfile.pressureBias,
      targetRole,
    });

    const adaptiveQuestion = buildAdaptiveFollowUpQuestion({
      style: adaptiveState.followUpStyle,
      targetRole,
      weaknessSignals: fallbackFeedback.weaknesses,
      previousAnswer: lastUserAnswer,
    });

    const interruption = evaluateInterruption(
      lastUserAnswer,
      adaptiveState.pressureLevel
    );

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        question: adaptiveQuestion || buildFallbackQuestion(targetRole),
        recruiterReaction: adaptiveState.recruiterReaction,
        followUpReason:
          "Fallback mode is active because the server has no OpenAI API key.",
        score,
        memoryUpdates,
        recruiterProfile,
        adaptiveState,
        pressureLevel: adaptiveState.pressureLevel,
        emotionState: adaptiveState.emotion,
        strengths: fallbackFeedback.strengths,
        weaknesses: fallbackFeedback.weaknesses,
        improvements: fallbackFeedback.improvements,
        risks: fallbackFeedback.risks,
        interruption,
      });
    }

    const recentTranscript = transcript
      .slice(-8)
      .map((item) => `${item.speaker.toUpperCase()}: ${item.text}`)
      .join("\n");

    const systemPrompt = `
You are WorkZo AI, a realistic AI recruiter simulation engine.

Your job:
Evaluate the candidate's latest answer and generate the next recruiter move.

Rules:
- Ask only ONE question.
- Keep recruiter responses SHORT during voice interviews.
- Maximum 1-2 sentences.
- Sound like a real recruiter call.
- Be realistic, not motivational.
- Challenge vague answers.
- Reward concrete examples.
- Do not invent candidate experience.
- If the answer has no metric, mention that as a weakness.
- If the answer is generic, ask for a specific example.
- If interruption.shouldInterrupt is true, behave like a realistic recruiter who briefly interrupts weak, vague, overlong, or uncertain answers.
- Keep all arrays short and practical.

Interview context:
Target role: ${targetRole}
Target market: ${targetMarket}
Company style: ${companyStyle}
Recruiter personality: ${recruiterPersonality}
Interview mode: ${mode}

Recruiter profile:
Name: ${recruiterProfile.name}
Title: ${recruiterProfile.title}
Tone: ${recruiterProfile.tone}
Question style: ${recruiterProfile.questionStyle}
Feedback style: ${recruiterProfile.feedbackStyle}

CV context:
${cvText.slice(0, 3000) || "No CV text provided."}

Job description:
${jobDescription.slice(0, 2500) || "No job description provided."}

Recent transcript:
${recentTranscript || "No previous transcript."}

Candidate's latest answer:
${lastUserAnswer || "No answer yet."}

Adaptive state:
${JSON.stringify(adaptiveState)}

Interruption analysis:
${JSON.stringify(interruption)}

Return ONLY valid JSON:
{
  "question": "next recruiter question based on the adaptive follow-up style and the candidate's missing proof",
  "recruiterReaction": "brief realistic recruiter reaction or interruption",
  "followUpReason": "why this question is being asked",
  "emotionState": "neutral | engaged | skeptical | concerned | impressed | pressuring",
  "pressureLevel": 0,
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "risks": ["recruiter concern 1"]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.65,
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    let parsed: {
      question?: string;
      recruiterReaction?: string;
      followUpReason?: string;
      emotionState?: string;
      pressureLevel?: number;
      strengths?: string[];
      weaknesses?: string[];
      improvements?: string[];
      risks?: string[];
    } = {};

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const strengths = safeArray(parsed.strengths);
    const weaknesses = safeArray(parsed.weaknesses);
    const improvements = safeArray(parsed.improvements);
    const risks = safeArray(parsed.risks);

    return NextResponse.json({
      question: safeText(parsed.question, adaptiveQuestion),
      recruiterReaction: safeText(
        parsed.recruiterReaction,
        adaptiveState.recruiterReaction
      ),
      recruiterProfile,
      followUpReason: safeText(
        parsed.followUpReason,
        "The recruiter is checking for role relevance, clarity, and proof."
      ),
      score,
      memoryUpdates,
      pressureLevel:
        typeof parsed.pressureLevel === "number"
          ? Math.max(0, Math.min(100, Math.round(parsed.pressureLevel)))
          : adaptiveState.pressureLevel,
      emotionState: safeText(parsed.emotionState, adaptiveState.emotion),
      adaptiveState,
      strengths: strengths.length ? strengths : fallbackFeedback.strengths,
      weaknesses: weaknesses.length ? weaknesses : fallbackFeedback.weaknesses,
      improvements: improvements.length
        ? improvements
        : fallbackFeedback.improvements,
      risks: risks.length ? risks : fallbackFeedback.risks,
      interruption,
    });
  } catch (error) {
    console.error("Interview API error:", error);

    const fallbackInterruption = {
      shouldInterrupt: false,
      interruptionMessage: "",
      severity: "low" as const,
    };

    return NextResponse.json(
      {
        question:
          "Let’s continue. Give me one specific example from your experience that proves you can succeed in this role.",
        recruiterReaction:
          "The recruiter engine had a temporary issue, so I’m continuing with a safe fallback question.",
        followUpReason: "Fallback recovery after server-side interview error.",
        score: {
          clarity: 45,
          relevance: 45,
          confidence: 45,
          structure: 45,
          evidence: 45,
          overall: 45,
        },
        memoryUpdates: [],
        recruiterProfile: getRecruiterProfile("professional", "realistic"),
        adaptiveState: {
          emotion: "neutral",
          pressureLevel: 55,
          recruiterReaction:
            "The recruiter engine had a temporary issue, so I’m continuing safely.",
          interruptionChance: 0,
          followUpStyle: "analytical",
        },
        pressureLevel: 55,
        emotionState: "neutral",
        strengths: ["Candidate continued the interview"],
        weaknesses: ["Answer could not be fully evaluated"],
        improvements: ["Try again with a specific example and measurable result"],
        risks: ["Recruiter may not have enough evidence yet"],
        interruption: fallbackInterruption,
      },
      { status: 200 }
    );
  }
}