import type { LiveAnswerAnalysis } from "@/lib/liveAnswerAnalyzer";
import type { RecruiterState } from "@/lib/recruiterStateEngine";

export type EmotionalMemoryItem = {
  turn: number;
  type:
    | "weak_answer"
    | "strong_answer"
    | "missing_metric"
    | "unclear_ownership"
    | "rambling"
    | "confidence_drop"
    | "recovery"
    | "contradiction_risk";
  note: string;
  answerPreview: string;
  trustAfter: number;
  moodAfter: string;
  timestamp: string;
};

export type EmotionalRecruiterMemory = {
  strongestMoments: EmotionalMemoryItem[];
  weakMoments: EmotionalMemoryItem[];
  repeatedConcerns: string[];
  recoveryMoments: EmotionalMemoryItem[];
  timeline: EmotionalMemoryItem[];
};

export function createEmptyEmotionalMemory(): EmotionalRecruiterMemory {
  return { strongestMoments: [], weakMoments: [], repeatedConcerns: [], recoveryMoments: [], timeline: [] };
}

export function updateEmotionalRecruiterMemory(input: {
  memory?: EmotionalRecruiterMemory | null;
  answer: string;
  analysis: LiveAnswerAnalysis;
  recruiterState: RecruiterState;
}) {
  const memory = input.memory || createEmptyEmotionalMemory();
  const items: EmotionalMemoryItem[] = [];
  const preview = input.answer.trim().slice(0, 180);
  const now = new Date().toISOString();

  function item(type: EmotionalMemoryItem["type"], note: string): EmotionalMemoryItem {
    return {
      turn: input.recruiterState.turns,
      type,
      note,
      answerPreview: preview,
      trustAfter: input.recruiterState.trust,
      moodAfter: input.recruiterState.mood,
      timestamp: now,
    };
  }

  if (input.analysis.overallQuality >= 74) items.push(item("strong_answer", "Strong answer with enough relevance, ownership, and proof."));
  if (input.analysis.overallQuality < 48) items.push(item("weak_answer", "Answer reduced recruiter confidence."));
  if (!input.analysis.hasMetric) items.push(item("missing_metric", "Candidate did not quantify the impact."));
  if (!input.analysis.hasOwnership) items.push(item("unclear_ownership", "Candidate did not clearly explain personal ownership."));
  if (input.analysis.ramblingScore >= 60) items.push(item("rambling", "Answer was too long or hard to follow."));
  if (input.analysis.confidenceScore < 45) items.push(item("confidence_drop", "Candidate sounded uncertain or hesitant."));
  if (input.analysis.contradictionRisk >= 40) items.push(item("contradiction_risk", "Potential contradiction or uncertainty detected."));
  if (input.recruiterState.strongAnswerStreak >= 1 && memory.weakMoments.length > 0 && input.analysis.overallQuality >= 70) {
    items.push(item("recovery", "Candidate recovered after earlier weak signal."));
  }

  const timeline = [...memory.timeline, ...items].slice(-40);
  const weakMoments = [
    ...memory.weakMoments,
    ...items.filter((x) =>
      ["weak_answer", "missing_metric", "unclear_ownership", "rambling", "confidence_drop", "contradiction_risk"].includes(x.type)
    ),
  ].slice(-16);
  const strongestMoments = [...memory.strongestMoments, ...items.filter((x) => x.type === "strong_answer")].slice(-8);
  const recoveryMoments = [...memory.recoveryMoments, ...items.filter((x) => x.type === "recovery")].slice(-8);
  const repeatedConcerns = deriveRepeatedConcerns(weakMoments);

  return { strongestMoments, weakMoments, repeatedConcerns, recoveryMoments, timeline } satisfies EmotionalRecruiterMemory;
}

function deriveRepeatedConcerns(items: EmotionalMemoryItem[]) {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item.type] = (counts[item.type] || 0) + 1;

  const labels: Record<string, string> = {
    missing_metric: "Repeatedly missing measurable impact",
    unclear_ownership: "Repeatedly unclear personal ownership",
    rambling: "Answers are often too long",
    confidence_drop: "Confidence sounds unstable",
    contradiction_risk: "Possible inconsistency risk",
    weak_answer: "Repeated weak answer quality",
  };

  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([type]) => labels[type] || type)
    .slice(0, 5);
}

export function buildMemoryInstruction(memory?: EmotionalRecruiterMemory | null) {
  if (!memory) return "";

  const concerns = memory.repeatedConcerns.length
    ? `Repeated concerns:\n${memory.repeatedConcerns.map((x) => `- ${x}`).join("\n")}`
    : "";

  const weak = memory.weakMoments.length
    ? `Recent weak signals:\n${memory.weakMoments.slice(-4).map((x) => `- ${x.note}`).join("\n")}`
    : "";

  const strong = memory.strongestMoments.length
    ? `Strong signals:\n${memory.strongestMoments.slice(-3).map((x) => `- ${x.note}`).join("\n")}`
    : "";

  return [concerns, weak, strong].filter(Boolean).join("\n\n");
}
