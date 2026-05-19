type EmotionEngineInput = {
  candidateAnswer: string;
};

export type RecruiterEmotion =
  | "Neutral"
  | "Impressed"
  | "Skeptical"
  | "Impatient"
  | "Encouraging";

export function detectRecruiterEmotion({
  candidateAnswer,
}: EmotionEngineInput): RecruiterEmotion {
  const lower =
    candidateAnswer.toLowerCase();

  const shortAnswer =
    candidateAnswer.length < 60;

  const hasMetrics =
    /\d/.test(
      candidateAnswer
    );

  const vagueClaims =
    lower.includes(
      "hardworking"
    ) ||
    lower.includes(
      "passionate"
    ) ||
    lower.includes(
      "quick learner"
    ) ||
    lower.includes(
      "team player"
    );

  const strongImpact =
    lower.includes(
      "improved"
    ) ||
    lower.includes(
      "reduced"
    ) ||
    lower.includes(
      "increased"
    ) ||
    lower.includes(
      "optimized"
    ) ||
    lower.includes(
      "resolved"
    ) ||
    lower.includes(
      "saved"
    ) ||
    lower.includes(
      "automated"
    );

  if (
    strongImpact &&
    hasMetrics
  ) {
    return "Impressed";
  }

  if (
    vagueClaims
  ) {
    return "Skeptical";
  }

  if (
    shortAnswer &&
    !/\b(hi|hello|thank you|thanks|yes|no|okay|ok|sure)\b/i.test(lower)
  ) {
    return "Impatient";
  }

  if (
    hasMetrics
  ) {
    return "Encouraging";
  }

  return "Neutral";
}