export function generateFollowup({
  missingMetrics,
  vague,
  contradiction,
  recruiterType,
}: {
  missingMetrics: boolean;
  vague: boolean;
  contradiction: boolean;
  recruiterType: string;
}) {
  if (contradiction) {
    return "Earlier you said something slightly different. Help me understand the gap.";
  }

  if (missingMetrics) {
    return "What measurable impact did that create?";
  }

  if (vague) {
    return "Give me ONE specific example.";
  }

  if (recruiterType === "analytical_hiring_manager") {
    return "Walk me through your exact decision-making process.";
  }

  return "What specifically was YOUR contribution?";
}
