export const INTERVIEW_FLOW = [
  "opening",
  "background",
  "experience",
  "deep_dive",
  "pressure_round",
  "behavioral",
  "closing",
];

export function getNextStage(current: string) {
  const index = INTERVIEW_FLOW.indexOf(current);

  if (index === -1) return INTERVIEW_FLOW[0];

  return INTERVIEW_FLOW[index + 1] || "closing";
}
