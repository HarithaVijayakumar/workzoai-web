export function calculateTrustDelta({
  hasSTAR,
  hasMetrics,
  ownership,
  clarity,
  vague,
}: {
  hasSTAR: boolean;
  hasMetrics: boolean;
  ownership: boolean;
  clarity: number;
  vague: boolean;
}) {
  let trust = 0;

  if (hasSTAR) trust += 8;
  if (hasMetrics) trust += 10;
  if (ownership) trust += 6;

  trust += clarity;

  if (vague) trust -= 10;

  return trust;
}
