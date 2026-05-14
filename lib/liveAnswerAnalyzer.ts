export type LiveAnswerAnalysis = {
  wordCount: number;
  fillerCount: number;
  fillerDensity: number;
  hasMetric: boolean;
  hasOwnership: boolean;
  hasExample: boolean;
  hasOutcome: boolean;
  vagueScore: number;
  relevanceScore: number;
  specificityScore: number;
  structureScore: number;
  confidenceScore: number;
  avoidanceScore: number;
  ramblingScore: number;
  contradictionRisk: number;
  overallQuality: number;
  issues: string[];
  strengths: string[];
};

const FILLERS = ["um", "uh", "like", "you know", "actually", "basically", "maybe", "probably", "i think", "kind of", "sort of", "i guess"];
const VAGUE_TERMS = ["things", "stuff", "many things", "good", "nice", "various", "some", "many", "helped", "worked on", "responsible for", "involved in"];
const OWNERSHIP_TERMS = ["i built", "i created", "i led", "i resolved", "i improved", "i automated", "i analyzed", "i implemented", "my role", "my contribution", "i was responsible"];
const OUTCOME_TERMS = ["increased", "reduced", "improved", "saved", "decreased", "boosted", "cut", "optimized", "result", "impact", "outcome"];

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function countMatches(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lower.match(new RegExp(`\\b${escaped}\\b`, "g"));
    return count + (matches?.length || 0);
  }, 0);
}

function keywordOverlap(answer: string, reference: string) {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "you", "your", "are", "was", "were", "from", "have", "has", "will", "can", "job", "role"]);
  const answerWords = new Set(answer.toLowerCase().split(/[^a-z0-9+#.]+/i).filter((word) => word.length > 3 && !stop.has(word)));
  const referenceWords = reference.toLowerCase().split(/[^a-z0-9+#.]+/i).filter((word) => word.length > 3 && !stop.has(word));
  if (!referenceWords.length) return 62;
  const hits = referenceWords.filter((word) => answerWords.has(word)).length;
  return clamp((hits / Math.min(referenceWords.length, 24)) * 100 + 35);
}

export function analyzeLiveAnswer(input: {
  answer: string;
  currentQuestion?: string;
  jobDescription?: string;
  cvText?: string;
  previousAnswers?: string[];
}): LiveAnswerAnalysis {
  const answer = (input.answer || "").trim();
  const lower = answer.toLowerCase();
  const words = answer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const fillerCount = countMatches(lower, FILLERS);
  const vagueCount = countMatches(lower, VAGUE_TERMS);
  const ownershipCount = countMatches(lower, OWNERSHIP_TERMS);

  const hasMetric = /\d|%|percent|eur|€|\$|hours|days|weeks|months|years|users|customers|tickets|revenue|cost|time/i.test(answer);
  const hasOwnership = ownershipCount > 0 || /\b(i|my|me)\b/i.test(answer);
  const hasExample = /\b(example|for instance|once|when i|in my previous|at |during|project)\b/i.test(answer);
  const hasOutcome = countMatches(lower, OUTCOME_TERMS) > 0 || hasMetric;

  const fillerDensity = wordCount ? fillerCount / wordCount : 0;
  const ramblingScore = clamp(wordCount > 170 ? 85 : wordCount > 120 ? 62 : wordCount > 85 ? 36 : 12);
  const vagueScore = clamp(vagueCount * 16 + (!hasMetric ? 20 : 0) + (!hasOwnership ? 12 : 0));
  const relevanceScore = keywordOverlap(answer, `${input.currentQuestion || ""} ${input.jobDescription || ""}`);
  const specificityScore = clamp(42 + (hasMetric ? 22 : -14) + (hasOwnership ? 14 : -8) + (hasExample ? 12 : -8) + (hasOutcome ? 10 : -8) - vagueCount * 6);
  const structureScore = clamp(46 + (/\b(situation|task|action|result)\b/i.test(answer) ? 20 : 0) + (hasExample ? 12 : 0) + (hasOutcome ? 14 : 0) - (wordCount < 22 ? 20 : 0) - (wordCount > 180 ? 14 : 0));
  const avoidanceScore = clamp((relevanceScore < 45 ? 35 : 0) + (!hasExample && wordCount > 50 ? 20 : 0) + (vagueCount >= 3 ? 20 : 0));
  const confidenceScore = clamp(72 - fillerCount * 9 - (fillerDensity > 0.06 ? 18 : 0) - (wordCount < 18 ? 18 : 0) - (wordCount > 170 ? 12 : 0) + (hasMetric ? 8 : 0) + (hasOwnership ? 8 : 0));
  const contradictionRisk = clamp(countMatches(lower, ["not sure", "i don't know", "maybe", "probably", "i guess"]) * 18);
  const overallQuality = clamp(relevanceScore * 0.22 + specificityScore * 0.26 + structureScore * 0.18 + confidenceScore * 0.18 + (hasOutcome ? 10 : 0) - avoidanceScore * 0.12 - ramblingScore * 0.08);

  const issues: string[] = [];
  const strengths: string[] = [];

  if (!hasMetric) issues.push("missing measurable impact");
  if (!hasOwnership) issues.push("unclear personal ownership");
  if (!hasExample) issues.push("no concrete example");
  if (vagueScore >= 50) issues.push("too vague");
  if (ramblingScore >= 60) issues.push("rambling");
  if (fillerCount >= 3) issues.push("hesitation/filler words");
  if (relevanceScore < 50) issues.push("not clearly tied to the question or JD");
  if (avoidanceScore >= 50) issues.push("possible avoidance");

  if (hasMetric) strengths.push("includes measurable signal");
  if (hasOwnership) strengths.push("shows ownership");
  if (hasExample) strengths.push("uses an example");
  if (hasOutcome) strengths.push("mentions outcome");
  if (relevanceScore >= 70) strengths.push("relevant to role/question");

  return { wordCount, fillerCount, fillerDensity, hasMetric, hasOwnership, hasExample, hasOutcome, vagueScore, relevanceScore, specificityScore, structureScore, confidenceScore, avoidanceScore, ramblingScore, contradictionRisk, overallQuality, issues, strengths };
}
