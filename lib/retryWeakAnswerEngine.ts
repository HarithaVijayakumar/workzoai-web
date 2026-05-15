export function compareAnswers(oldScore: number, newScore: number) {
  const delta = newScore - oldScore;

  return {
    improved: delta > 0,
    trustDelta: delta,
  };
}
