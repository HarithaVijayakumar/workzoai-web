export function getRecruiterReaction({
  score,
  missingMetrics,
  vague,
}: {
  score: number;
  missingMetrics: boolean;
  vague: boolean;
}) {
  if (score >= 85) {
    return [
      "That’s a strong example.",
      "Good. That shows ownership.",
      "That answer feels credible.",
    ];
  }

  if (missingMetrics) {
    return [
      "I still don’t have measurable impact.",
      "Can you quantify the result?",
      "Give me actual numbers.",
    ];
  }

  if (vague) {
    return [
      "You’re being too broad.",
      "I need one concrete example.",
      "You’re losing clarity a little.",
    ];
  }

  return [
    "Okay, continue.",
    "Walk me through your thinking.",
    "What specifically did YOU do?",
  ];
}
