export type RecruiterStyle =
  | "supportive"
  | "analytical"
  | "skeptical"
  | "pressure";

type BuildQuestionInput = {
  style: RecruiterStyle;
  targetRole?: string;
  weaknessSignals?: string[];
  previousAnswer?: string;
};

function contains(text: string, words: string[]) {
  return words.some((word) =>
    text.toLowerCase().includes(word.toLowerCase())
  );
}

export function buildAdaptiveFollowUpQuestion(
  input: BuildQuestionInput
) {
  const answer = input.previousAnswer || "";

  const role = input.targetRole || "this role";

  const weaknessSignals = input.weaknessSignals || [];

  // Missing measurable impact
  if (
    weaknessSignals.some((w) =>
      w.toLowerCase().includes("measurable")
    ) ||
    !contains(answer, [
      "%",
      "improved",
      "reduced",
      "increased",
      "saved",
      "impact",
    ])
  ) {
    return "What was the measurable business impact of your work?";
  }

  // Too generic
  if (
    weaknessSignals.some((w) =>
      w.toLowerCase().includes("generic")
    )
  ) {
    return `Give me one real example that proves you can succeed in the ${role} role.`;
  }

  // Weak structure
  if (
    weaknessSignals.some((w) =>
      w.toLowerCase().includes("structure")
    )
  ) {
    return "Walk me through the situation, your action, and the final result.";
  }

  // Skeptical recruiter
  if (input.style === "skeptical") {
    return `Why should we hire you over another candidate for the ${role} position?`;
  }

  // Pressure recruiter
  if (input.style === "pressure") {
    return "I still don't have enough proof. Convince me with a real example.";
  }

  // Analytical recruiter
  if (input.style === "analytical") {
    return "Can you explain your exact contribution and decision-making process?";
  }

  // Supportive recruiter
  return `Tell me about a project or experience most relevant to the ${role} role.`;
}