type ScoringInput = {
  candidateAnswer: string;
  targetRole: string;
};

export type ScoringResult = {
  confidence: number;
  clarity: number;
  relevance: number;
  technicalDepth: number;
  measurableImpact: number;
  communication: number;
  recruiterTrust: number;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function evaluateAnswerScore({
  candidateAnswer,
  targetRole,
}: ScoringInput): ScoringResult {
  const lower = candidateAnswer.toLowerCase();

  const hasNumbers = /\d/.test(candidateAnswer);
  const isLongEnough = candidateAnswer.length >= 120;
  const isTooShort = candidateAnswer.length < 60;

  const impactWords =
    lower.includes("improved") ||
    lower.includes("reduced") ||
    lower.includes("increased") ||
    lower.includes("resolved") ||
    lower.includes("saved") ||
    lower.includes("automated") ||
    lower.includes("optimized") ||
    lower.includes("delivered");

  const vagueWords =
    lower.includes("hardworking") ||
    lower.includes("passionate") ||
    lower.includes("quick learner") ||
    lower.includes("team player");

  const roleWords = targetRole
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 2);

  const roleMatch = roleWords.some((word) => lower.includes(word));

  const technicalSignals =
    lower.includes("sql") ||
    lower.includes("python") ||
    lower.includes("api") ||
    lower.includes("dashboard") ||
    lower.includes("model") ||
    lower.includes("cloud") ||
    lower.includes("data") ||
    lower.includes("analysis");

  const confidence = clampScore(
    55 +
      (isLongEnough ? 15 : 0) +
      (hasNumbers ? 10 : 0) -
      (isTooShort ? 18 : 0) -
      (vagueWords ? 10 : 0)
  );

  const clarity = clampScore(
    58 +
      (isLongEnough ? 10 : 0) +
      (hasNumbers ? 12 : 0) -
      (isTooShort ? 20 : 0) -
      (vagueWords ? 12 : 0)
  );

  const relevance = clampScore(
    55 +
      (roleMatch ? 20 : 0) +
      (impactWords ? 12 : 0) +
      (technicalSignals ? 8 : 0) -
      (vagueWords ? 12 : 0)
  );

  const technicalDepth = clampScore(
    45 +
      (technicalSignals ? 25 : 0) +
      (hasNumbers ? 10 : 0) +
      (impactWords ? 8 : 0)
  );

  const measurableImpact = clampScore(
    40 +
      (hasNumbers ? 30 : 0) +
      (impactWords ? 25 : 0) -
      (vagueWords ? 10 : 0)
  );

  const communication = clampScore(
    60 +
      (isLongEnough ? 10 : 0) -
      (isTooShort ? 15 : 0) -
      (vagueWords ? 10 : 0)
  );

  const recruiterTrust = clampScore(
    Math.round(
      confidence * 0.2 +
        clarity * 0.2 +
        relevance * 0.2 +
        technicalDepth * 0.15 +
        measurableImpact * 0.15 +
        communication * 0.1
    )
  );

  return {
    confidence,
    clarity,
    relevance,
    technicalDepth,
    measurableImpact,
    communication,
    recruiterTrust,
  };
}