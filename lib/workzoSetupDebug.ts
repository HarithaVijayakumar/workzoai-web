export function debugWorkZoInterviewSetup() {
  if (typeof window === "undefined") return null;

  const keys = ["workzo-interview-setup", "workzo_setup", "workzo-onboarding", "workzo_onboarding"];

  const result = keys.map((key) => {
    const raw = window.localStorage.getItem(key);

    try {
      const parsed = raw ? JSON.parse(raw) : null;

      return {
        key,
        exists: Boolean(raw),
        cvChars: parsed?.cvText?.length || 0,
        jdChars: parsed?.jobDescription?.length || 0,
        targetRole: parsed?.targetRole || "",
        targetMarket: parsed?.targetMarket || parsed?.country || "",
        recruiterPersonality: parsed?.recruiterPersonality || "",
      };
    } catch {
      return {
        key,
        exists: Boolean(raw),
        error: "Invalid JSON",
      };
    }
  });

  console.table(result);
  return result;
}
