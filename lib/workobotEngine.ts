export function getWorkobotMode(input: string) {
  const lower = input.toLowerCase();

  if (lower.includes("rewrite")) return "rewrite";
  if (lower.includes("stronger")) return "stronger";
  if (lower.includes("what recruiter wants")) return "expectation";
  if (lower.includes("star")) return "star";

  return "coaching";
}
