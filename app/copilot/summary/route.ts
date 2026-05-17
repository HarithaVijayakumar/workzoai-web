import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type CopilotAction =
  | "recruiter_intent"
  | "rewrite"
  | "star"
  | "metrics"
  | "ownership"
  | "concise"
  | "followups"
  | "score"
  | "magic";

type CopilotRequest = {
  action?: CopilotAction;
  question?: string;
  answer?: string;
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  targetMarket?: string;
  recruiterName?: string;
  recruiterRole?: string;
  recruiterState?: string;
  recruiterMemory?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function actionInstruction(action: CopilotAction) {
  const instructions: Record<CopilotAction, string> = {
    recruiter_intent:
      "Explain what the recruiter is really testing behind the question.",
    rewrite:
      "Rewrite the candidate answer to sound clearer, stronger, and recruiter-ready.",
    star:
      "Convert the answer into a concise STAR format without inventing facts.",
    metrics:
      "Find where measurable impact is missing and suggest safe metric placeholders.",
    ownership:
      "Improve ownership language so the candidate's personal contribution is clearer.",
    concise:
      "Shorten the answer while keeping proof, impact, and role relevance.",
    followups:
      "Predict likely recruiter follow-up questions and how to prepare.",
    score:
      "Score the answer using recruiter trust, ownership, impact evidence, clarity, and role fit.",
    magic:
      "Do a complete recruiter-aware improvement: diagnose, rewrite, score, and suggest follow-ups.",
  };

  return instructions[action] || instructions.magic;
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY is missing.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as CopilotRequest;

    const action = body.action || "magic";
    const question = cleanText(body.question, 1800);
    const answer = cleanText(body.answer, 5000);
    const cvText = cleanText(body.cvText, 7000);
    const jobDescription = cleanText(body.jobDescription, 5000);
    const targetRole = cleanText(body.targetRole, 180) || "target role";
    const targetMarket = cleanText(body.targetMarket, 120) || "Global";
    const recruiterName = cleanText(body.recruiterName, 80) || "Recruiter";
    const recruiterRole = cleanText(body.recruiterRole, 120) || "AI Recruiter";
    const recruiterState = cleanText(body.recruiterState, 120) || "Evaluating";
    const recruiterMemory = body.recruiterMemory
      ? JSON.stringify(body.recruiterMemory).slice(0, 2500)
      : "No recruiter memory provided.";

    const systemPrompt = `
You are Work-O-Bot, a recruiter-aware interview copilot for WorkZo AI.

You are NOT a generic chatbot.
You help the candidate improve the current interview answer based on:
- recruiter psychology
- role fit
- CV evidence
- job description
- measurable impact
- ownership clarity
- STAR structure
- likely recruiter doubts

STRICT TRUTH RULES:
- Never invent candidate experience.
- Never invent company names, employers, projects, metrics, tools, education, or achievements.
- Only use facts clearly present in the candidate answer, CV text, or job description.
- If a metric is missing, suggest a placeholder like "[add measurable result]" instead of inventing numbers.
- If CV evidence is unclear, say it is unclear.
- Keep the answer practical and immediately usable.

RECRUITER CONTEXT:
Recruiter name: ${recruiterName}
Recruiter role: ${recruiterRole}
Recruiter state: ${recruiterState}
Target role: ${targetRole}
Target market: ${targetMarket}

TASK:
${actionInstruction(action)}

OUTPUT FORMAT:
1. Recruiter intent
2. What is weak
3. Improved answer
4. Likely follow-up questions
5. Trust score /100
6. One next practice step

Keep it concise and professional.
`.trim();

    const userPrompt = `
RECRUITER QUESTION:
${question || "No recruiter question provided."}

CANDIDATE ANSWER:
${answer || "No candidate answer provided."}

CANDIDATE CV CONTEXT:
${cvText || "No CV context provided."}

JOB DESCRIPTION:
${jobDescription || "No job description provided."}

RECRUITER MEMORY:
${recruiterMemory}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.35,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const output =
      completion.choices[0]?.message?.content ||
      "Work-O-Bot could not generate a response.";

    return NextResponse.json({
      success: true,
      output,
      model: "gpt-4o",
    });
  } catch (error) {
    console.error("Work-O-Bot API failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Work-O-Bot could not generate a response.",
      },
      { status: 500 },
    );
  }
}
