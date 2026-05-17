import { NextResponse } from "next/server";
import OpenAI from "openai";
import { analyzeLiveAnswer } from "@/lib/liveAnswerAnalyzer";
import { decideRecruiterBehavior } from "@/lib/recruiterBehaviorEngine";
import { getRecruiterChallengeMoment } from "@/lib/recruiterChallengeEngine";
import {
  buildPhaseInstruction,
  decideInterviewPhase,
} from "@/lib/interviewPhaseEngine";
import {
  buildMemoryInstruction,
  updateEmotionalRecruiterMemory,
  type EmotionalRecruiterMemory,
} from "@/lib/recruiterMemoryEngine";
import {
  createInitialRecruiterState,
  normalizeRecruiterPersonality,
  updateRecruiterState,
  type RecruiterState,
} from "@/lib/recruiterStateEngine";
import { createTrustTimelineEvent } from "@/lib/trustTimelineEngine";
import {
  buildTavusContextInstruction,
  getTavusVisualState,
} from "@/lib/tavusSyncEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TranscriptItem = {
  role: "candidate" | "recruiter" | "system";
  text: string;
  time?: string;
};

type InterviewRequest = {
  answer?: string;
  currentQuestion?: string;
  transcript?: TranscriptItem[];
  setup?: {
    cvText?: string;
    jobDescription?: string;
    targetRole?: string;
    targetMarket?: string;
    companyStyle?: string;
    recruiterPersonality?: string;
    recruiterMemoryProfile?: unknown;
    jobMemoryProfile?: unknown;
  };
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  targetMarket?: string;
  companyStyle?: string;
  recruiterPersonality?: string;
  pressure?: number;
  recruiterTrust?: number;
  recruiterState?: RecruiterState | null;
  emotionalMemory?: EmotionalRecruiterMemory | null;
  memory?: unknown;
  scores?: unknown;
  contradictions?: unknown;
  trustTimeline?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeJson(value: unknown, limit = 8000) {
  try {
    return JSON.stringify(value || {}, null, 2).slice(0, limit);
  } catch {
    return "{}";
  }
}

function buildFallbackQuestion(input: {
  decision: ReturnType<typeof decideRecruiterBehavior>;
  analysis: ReturnType<typeof analyzeLiveAnswer>;
}) {
  const { decision, analysis } = input;

  if (decision.shouldInterrupt) return decision.interruptionMessage;
  if (!analysis.hasOwnership) return "What exactly was your personal contribution?";
  if (!analysis.hasMetric) return "Can you quantify the impact or give me the scale?";
  if (!analysis.hasExample) return "Give me one specific example, not a general summary.";
  if (analysis.relevanceScore < 50) return "How does that example connect to this role?";
  return "What was the outcome, and what would you do differently next time?";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InterviewRequest;

    const setup = body.setup || {};
    const candidateAnswer = text(body.answer);
    const currentQuestion = text(body.currentQuestion);
    const cvText = text(body.cvText || setup.cvText);
    const jobDescription = text(body.jobDescription || setup.jobDescription);
    const targetRole = text(body.targetRole || setup.targetRole) || "General Role";
    const targetMarket = text(body.targetMarket || setup.targetMarket) || "Global";
    const recruiterPersonality =
      text(body.recruiterPersonality || setup.recruiterPersonality) || "realistic";

    if (!candidateAnswer) {
      return NextResponse.json(
        { error: "Candidate answer is required." },
        { status: 400 }
      );
    }

    const personality = normalizeRecruiterPersonality(recruiterPersonality);

    const previousAnswers =
      body.transcript
        ?.filter((item) => item.role === "candidate")
        .map((item) => item.text)
        .slice(-6) || [];

    const baseState = body.recruiterState || createInitialRecruiterState(recruiterPersonality);

    const recruiterState: RecruiterState = {
      ...createInitialRecruiterState(recruiterPersonality),
      ...baseState,
      trust:
        typeof body.recruiterTrust === "number"
          ? body.recruiterTrust
          : baseState.trust,
      pressure:
        typeof body.pressure === "number"
          ? body.pressure
          : baseState.pressure,
    };

    const previousTrust = recruiterState.trust;

    const analysis = analyzeLiveAnswer({
      answer: candidateAnswer,
      currentQuestion,
      jobDescription,
      cvText,
      previousAnswers,
    });

    const decision = decideRecruiterBehavior({
      analysis,
      recruiterState,
      personality,
    });

    const nextRecruiterState = updateRecruiterState(
      recruiterState,
      decision.stateDelta
    );

    const arc = decideInterviewPhase({
      turnCount: nextRecruiterState.turns,
      analysis,
      recruiterState: nextRecruiterState,
    });

    const challengeMoment = getRecruiterChallengeMoment({
      analysis,
      recruiterState: nextRecruiterState,
      arc,
    });

    const trustEvent = createTrustTimelineEvent({
      previousTrust,
      nextTrust: nextRecruiterState.trust,
      analysis,
      phase: arc.phase,
    });

    const emotionalMemory = updateEmotionalRecruiterMemory({
      memory: body.emotionalMemory,
      answer: candidateAnswer,
      analysis,
      recruiterState: nextRecruiterState,
    });

    const tavusVisualState = getTavusVisualState({
      recruiterState: nextRecruiterState,
      decision,
    });

    const fallbackQuestion = buildFallbackQuestion({ decision, analysis });

    const fallbackPayload = {
      question: fallbackQuestion,
      feedback: decision.followUpFocus,
      interruption: decision.shouldInterrupt
        ? {
            shouldInterrupt: true,
            interruptionMessage: decision.interruptionMessage,
            severity: nextRecruiterState.mood === "impatient" ? "high" : "medium",
          }
        : {
            shouldInterrupt: false,
            interruptionMessage: "",
            severity: "low",
          },
      recruiterState: nextRecruiterState,
      emotionalMemory,
      tavusVisualState,
      analysis,
      behaviorDecision: decision,
      wowMoment: challengeMoment,
      arc,
      liveUiState: {
        label:
          arc.phase === "pressure"
            ? "Pressure rising"
            : arc.phase === "recovery"
              ? "Recovery chance"
              : arc.phase === "closing"
                ? "Closing evaluation"
                : nextRecruiterState.mood,
        theme: arc.phase,
      },
      trustTimeline: [trustEvent],
      postInterviewPsychologyReport: {
        finalDecision:
          nextRecruiterState.trust < 38
            ? "reject"
            : nextRecruiterState.trust < 58
              ? "borderline"
              : "continue",
        finalPerception:
          nextRecruiterState.trust < 40
            ? "The recruiter is losing confidence because answers need more proof and direct ownership."
            : nextRecruiterState.trust < 62
              ? "The recruiter sees potential but still needs stronger evidence."
              : "The recruiter is becoming more confident in the candidate.",
        strongestSignal: analysis.strengths[0] || "No strong signal detected yet.",
        weakestPattern: emotionalMemory.repeatedConcerns[0] || analysis.issues[0] || "No repeated weak pattern yet.",
        nextPracticeAction:
          analysis.issues[0] === "missing measurable impact"
            ? "Retry the answer with one number, one result, and one business impact."
            : "Retry the answer using situation, action, result, and measurable proof.",
      },
      scores: {
        relevance: analysis.relevanceScore,
        clarity: analysis.specificityScore,
        structure: analysis.structureScore,
        evidence: analysis.hasMetric ? 78 : 42,
        confidence: analysis.confidenceScore,
        overall: analysis.overallQuality,
      },
    };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(fallbackPayload);
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `
You are ${personality.displayName}, a realistic recruiter inside WorkZo AI.

You are NOT a coach.
You are NOT a friendly chatbot.
You are a recruiter evaluating a candidate in a live interview.

Candidate target role: ${targetRole}
Candidate market: ${targetMarket}

Recruiter state:
${safeJson(nextRecruiterState)}

Interview phase:
${buildPhaseInstruction(arc)}

Live answer analysis:
${safeJson(analysis)}

Recruiter behavior decision:
${safeJson(decision)}

Challenge moment:
${safeJson(challengeMoment)}

Emotional recruiter memory:
${buildMemoryInstruction(emotionalMemory)}

Tavus visual/speaking instruction:
${buildTavusContextInstruction(tavusVisualState)}

CV memory:
${safeJson(setup.recruiterMemoryProfile)}

Job memory:
${safeJson(setup.jobMemoryProfile)}

Raw CV text excerpt:
${cvText.slice(0, 2500)}

Job description excerpt:
${jobDescription.slice(0, 2500)}

Rules:
- Ask only ONE question.
- Keep response short: 1 to 3 sentences.
- If the answer was weak, become more direct and skeptical.
- If the answer was vague, say what was vague.
- If metrics are missing, ask for measurable impact.
- If ownership is unclear, ask what the candidate personally did.
- If the candidate rambled, interrupt or ask for a concise version.
- If the phase is pressure, reduce warmth and increase directness.
- If the phase is recovery, give the candidate one chance to recover trust.
- Do not give long coaching advice.
- Do not say "as an AI".
- Never invent a company, role, or experience.
- Never claim you cannot see CV/JD if context exists.
- Stay in recruiter character.
`.trim();

    const userPrompt = `
Current question:
${currentQuestion || "Continue the interview based on the candidate's previous answer."}

Candidate answer:
${candidateAnswer}

Recent transcript:
${safeJson(body.transcript?.slice(-10) || [], 5000)}

Return JSON only:
{
  "question": "your next recruiter response or follow-up question",
  "feedback": "short internal feedback summary",
  "interruption": {
    "shouldInterrupt": false,
    "interruptionMessage": "",
    "severity": "low"
  }
}
`.trim();

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_INTERVIEW_MODEL || "gpt-4o",
      temperature: arc.phase === "pressure" ? 0.32 : 0.45,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed: {
      question?: string;
      feedback?: string;
      interruption?: {
        shouldInterrupt?: boolean;
        interruptionMessage?: string;
        severity?: "low" | "medium" | "high";
      };
    } = {};

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    return NextResponse.json({
      ...fallbackPayload,
      question: parsed.question || fallbackQuestion,
      feedback: parsed.feedback || decision.followUpFocus,
      interruption: {
        shouldInterrupt:
          parsed.interruption?.shouldInterrupt ?? decision.shouldInterrupt,
        interruptionMessage:
          parsed.interruption?.interruptionMessage ||
          (decision.shouldInterrupt ? decision.interruptionMessage : ""),
        severity:
          parsed.interruption?.severity ||
          (decision.shouldInterrupt
            ? nextRecruiterState.mood === "impatient"
              ? "high"
              : "medium"
            : "low"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Interview analysis failed.",
      },
      { status: 500 }
    );
  }
}
