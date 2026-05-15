export function buildGroundedContext({
  cvText,
  transcript,
  jobDescription,
}: {
  cvText: string;
  transcript: string;
  jobDescription: string;
}) {
  return `
STRICT RULES:

- NEVER invent candidate experience.
- NEVER mention projects not found in CV.
- ONLY use:
  1. uploaded CV
  2. transcript
  3. job description

If information is missing:
ASK a clarifying question.

Do not hallucinate:
- skills
- companies
- technologies
- certifications
- leadership claims
- project ownership

CV:
${cvText}

JOB DESCRIPTION:
${jobDescription}

TRANSCRIPT:
${transcript}
`;
}
