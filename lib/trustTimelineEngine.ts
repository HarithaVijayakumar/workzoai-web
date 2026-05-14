import type { LiveAnswerAnalysis } from "@/lib/liveAnswerAnalyzer";
import type { RecruiterState } from "@/lib/recruiterStateEngine";

export type TrustTimelineEvent = {
  direction: "up" | "down" | "stable";
  value: number;
  reason: string;
  phase?: string;
  timestamp: string;
};

export function createTrustTimelineEvent(input: {
  previousTrust: number;
  nextTrust: number;
  analysis: LiveAnswerAnalysis;
  phase?: string;
}) {
  const { previousTrust, nextTrust, analysis, phase } = input;
  const diff = nextTrust - previousTrust;

  let direction: TrustTimelineEvent["direction"] = "stable";
  if (diff >= 4) direction = "up";
  if (diff <= -4) direction = "down";

  let reason = "Recruiter trust stayed mostly stable.";

  if (direction === "up") {
    if (analysis.hasMetric && analysis.hasOwnership) {
      reason = "Trust improved because the answer showed ownership and measurable impact.";
    } else if (analysis.hasExample) {
      reason = "Trust improved because the candidate gave a more concrete example.";
    } else {
      reason = "Trust improved slightly based on answer relevance.";
    }
  }

  if (direction === "down") {
    if (!analysis.hasMetric && !analysis.hasOwnership) {
      reason = "Trust dropped because the answer lacked both measurable impact and personal ownership.";
    } else if (analysis.vagueScore >= 60) {
      reason = "Trust dropped because the answer stayed too broad or generic.";
    } else if (analysis.ramblingScore >= 60) {
      reason = "Trust dropped because the answer was too long and hard to follow.";
    } else if (analysis.avoidanceScore >= 55) {
      reason = "Trust dropped because the answer did not directly address the question.";
    } else {
      reason = "Trust dropped because the recruiter did not get enough proof.";
    }
  }

  return {
    direction,
    value: nextTrust,
    reason,
    phase,
    timestamp: new Date().toISOString(),
  } satisfies TrustTimelineEvent;
}
