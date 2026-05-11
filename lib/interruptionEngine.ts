export type InterruptionResult = {
  shouldInterrupt: boolean;
  interruptionMessage: string;
  severity: "low" | "medium" | "high";
};

function contains(text: string, keywords: string[]) {
  return keywords.some((keyword) =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}

export function evaluateInterruption(
  answer: string,
  pressureLevel: number
): InterruptionResult {
  const text = answer.toLowerCase();

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const vagueLanguage = contains(text, [
    "hardworking",
    "passionate",
    "quick learner",
    "team player",
    "good communication",
  ]);

  const fillerWords = contains(text, [
    "um",
    "uh",
    "like",
    "basically",
    "actually",
    "kind of",
    "sort of",
  ]);

  const weakConfidence = contains(text, [
    "maybe",
    "probably",
    "i think",
    "not sure",
  ]);

  const noEvidence =
    !contains(text, [
      "%",
      "improved",
      "reduced",
      "increased",
      "result",
      "impact",
      "saved",
      "users",
      "customers",
    ]);

  // aggressive pressure mode
  if (pressureLevel >= 75) {
    if (wordCount > 60) {
      return {
        shouldInterrupt: true,
        interruptionMessage:
          "You are taking too long. Give me the direct answer.",
        severity: "high",
      };
    }

    if (vagueLanguage || noEvidence) {
      return {
        shouldInterrupt: true,
        interruptionMessage:
          "Hold on. That still sounds vague. What exactly was your impact?",
        severity: "high",
      };
    }
  }

  // medium pressure
  if (pressureLevel >= 50) {
    if (weakConfidence) {
      return {
        shouldInterrupt: true,
        interruptionMessage:
          "You sound uncertain. Answer with confidence.",
        severity: "medium",
      };
    }

    if (fillerWords && wordCount > 35) {
      return {
        shouldInterrupt: true,
        interruptionMessage:
          "Focus on the important part. What was the actual result?",
        severity: "medium",
      };
    }
  }

  // light interruption
  if (wordCount > 90) {
    return {
      shouldInterrupt: true,
      interruptionMessage:
        "Summarize that in a shorter and clearer way.",
      severity: "low",
    };
  }

  return {
    shouldInterrupt: false,
    interruptionMessage: "",
    severity: "low",
  };
}