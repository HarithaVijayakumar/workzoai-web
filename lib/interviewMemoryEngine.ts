export type MemoryBucket = {
  weakAnswers: string[];
  strongAnswers: string[];
  missingMetrics: string[];
  vagueStatements: string[];
  contradictions: string[];
  confidenceDrops: string[];
  ownershipSignals: string[];
  recruiterConcerns: string[];
};

export type InterviewMemory = {
  recruiterTrust: number;
  recruiterMood:
    | "engaged"
    | "skeptical"
    | "impressed"
    | "concerned"
    | "neutral";
  memory: MemoryBucket;
};

export const DEFAULT_MEMORY: InterviewMemory = {
  recruiterTrust: 52,
  recruiterMood: "neutral",
  memory: {
    weakAnswers: [],
    strongAnswers: [],
    missingMetrics: [],
    vagueStatements: [],
    contradictions: [],
    confidenceDrops: [],
    ownershipSignals: [],
    recruiterConcerns: [],
  },
};

export function addWeakAnswer(memory: InterviewMemory, answer: string) {
  memory.memory.weakAnswers.push(answer);
  memory.recruiterTrust -= 6;
}

export function addStrongAnswer(memory: InterviewMemory, answer: string) {
  memory.memory.strongAnswers.push(answer);
  memory.recruiterTrust += 5;
}

export function addMissingMetric(memory: InterviewMemory, answer: string) {
  memory.memory.missingMetrics.push(answer);
  memory.recruiterTrust -= 3;
}

export function addContradiction(memory: InterviewMemory, answer: string) {
  memory.memory.contradictions.push(answer);
  memory.recruiterTrust -= 8;
}
