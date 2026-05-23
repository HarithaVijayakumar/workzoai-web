import { runRecruiterRuntime, type RecruiterRuntimePersonality } from "./recruiterRuntimeOrchestrator";
import { initialEmotionalMemory, type EmotionalMemoryState } from "./emotionalMemoryEngine";

type RecruiterId = RecruiterRuntimePersonality;

type Scenario = {
  label: string;
  expected: string;
  recruiterId?: RecruiterId;
  answer: string;
  score?: number;
  pressureLevel?: number;
  memory?: EmotionalMemoryState;
  turnIndex?: number;
};

function divider() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

function makeMemory(
  overrides: Partial<EmotionalMemoryState> & {
    memorySignals?: Array<"vague_answer" | "missing_metrics" | "weak_clarity" | "strong_answer" | "neutral_answer" | "too_long">;
  } = {},
): EmotionalMemoryState {
  const memorySignals = overrides.memorySignals ?? [];

  return {
    ...initialEmotionalMemory,
    ...overrides,
    repeatedWeaknesses:
      overrides.repeatedWeaknesses ??
      memorySignals.filter((signal) =>
        signal === "vague_answer" ||
        signal === "missing_metrics" ||
        signal === "weak_clarity",
      ),
    memories:
      overrides.memories ??
      memorySignals.map((signal, index) => ({
        id: `test-memory-${index + 1}`,
        signal,
        summary: `Previous ${signal.replace(/_/g, " ")} pattern`,
        timestamp: Date.now() - (index + 1) * 1000,
      })),
  } as EmotionalMemoryState;
}

function printScenario(result: ReturnType<typeof runRecruiterRuntime>) {
  console.log("Runtime decision:", result.runtimeDecision);
  console.log("State:", result.state);
  console.log("Mood:", result.mood);
  console.log("Pressure:", result.pressureLevel);
  console.log("Trust:", result.trust);
  console.log("Confidence:", result.confidence);
  console.log("Interest:", result.interest);
  console.log("Should interrupt:", result.interruption.shouldInterrupt);
  console.log("Interruption severity:", result.interruption.severity ?? "none");
  console.log("Memory line:", result.memoryLine || "none");
  console.log("Micro reaction:", result.microReaction || "none");
  console.log("Suggested line:", result.suggestedLine);

  const lines = Array.isArray(result.reactionLines) ? result.reactionLines : [];
  console.log("Reaction lines:");
  if (!lines.length) {
    console.log("  none");
  } else {
    lines.forEach((line: string, index: number) => {
      console.log(`  ${index + 1}. ${line}`);
    });
  }
}

function runScenario(scenario: Scenario) {
  divider();
  console.log(`Scenario: ${scenario.label}`);
  console.log(`Expected: ${scenario.expected}`);
  divider();

  const result = runRecruiterRuntime({
    recruiterId: scenario.recruiterId ?? "analytical_hiring_manager",
    answer: scenario.answer,
    score: scenario.score ?? 65,
    pressureLevel: scenario.pressureLevel ?? 50,
    memory: scenario.memory,
    turnIndex: scenario.turnIndex ?? 1,
  });

  printScenario(result);
}

function runPersonalityBlock() {
  divider();
  console.log("Scenario: Personality-aware micro reactions");
  console.log(
    "Expected: Daniel, Sarah, Priya, and Markus should react differently to the same vague answer.",
  );
  divider();

  const recruiters: Array<{ label: string; id: RecruiterId }> = [
    { label: "Daniel", id: "analytical_hiring_manager" },
    { label: "Sarah", id: "friendly_hr" },
    { label: "Priya", id: "startup_recruiter" },
    { label: "Markus", id: "german_corporate" },
  ];

  for (const recruiter of recruiters) {
    const result = runRecruiterRuntime({
      recruiterId: recruiter.id,
      answer:
        "I worked on several projects and handled different responsibilities, but I do not remember the exact impact or numbers.",
      score: 55,
      pressureLevel: 70,
      turnIndex: 1,
    });

    console.log(`\n${recruiter.label}`);
    console.log("Micro reaction:", result.microReaction || "none");
    console.log("Suggested line:", result.suggestedLine);

    const lines = Array.isArray(result.reactionLines) ? result.reactionLines : [];
    if (lines.length) {
      console.log("Reaction lines:");
      lines.forEach((line: string, index: number) => {
        console.log(`  ${index + 1}. ${line}`);
      });
    }
  }
}

function runRuntimeTest() {
  const scenarios: Scenario[] = [
    {
      label: "Vague answer without metrics",
      expected:
        "Recruiter should become skeptical or pressuring and ask for specifics/metrics.",
      answer:
        "I worked on several projects and handled different responsibilities, but I do not remember the exact impact or numbers.",
      score: 55,
      pressureLevel: 60,
      turnIndex: 1,
    },
    {
      label: "Repeated vague answer under high pressure",
      expected:
        "Recruiter should interrupt because the candidate is repeating the same vague pattern under high pressure.",
      answer:
        "As I said, I handled many things and worked on various tasks. I always try to do my best and help when needed.",
      score: 48,
      pressureLevel: 92,
      turnIndex: 3,
      memory: makeMemory({
        trust: 47,
        confidence: 58,
        interest: 64,
        memorySignals: ["vague_answer", "missing_metrics"],
      }),
    },
    {
      label: "Concrete example",
      expected:
        "Recruiter should show interest and ask a deeper follow-up, not reset the question.",
      answer:
        "One user could not access the platform. I checked the login flow, verified the account settings, guided the user step by step, documented the issue, and restored access.",
      score: 72,
      pressureLevel: 42,
      turnIndex: 2,
    },
    {
      label: "Strong recovery after previous vague answers",
      expected:
        "Recruiter should soften and acknowledge recovery after a stronger, measurable answer.",
      answer:
        "I documented the repeated login issue, created a checklist for the team, and shared the fix steps. It helped the next teammate resolve a similar case around 20% faster and avoided repeating the same troubleshooting steps.",
      score: 86,
      pressureLevel: 72,
      turnIndex: 4,
      memory: makeMemory({
        trust: 43,
        confidence: 54,
        interest: 62,
        memorySignals: ["vague_answer", "missing_metrics"],
      }),
    },
    {
      label: "Strong answer with measurable impact",
      expected: "Recruiter should be impressed or interested and reduce pressure.",
      answer:
        "I created a checklist for a repeated workflow issue. It reduced handling time by around 20% and helped newer teammates solve similar cases faster.",
      score: 88,
      pressureLevel: 50,
      turnIndex: 2,
    },
    {
      label: "Rambling answer under pressure",
      expected:
        "Recruiter may interrupt or redirect because the answer is broad and overloaded.",
      answer:
        "There were many situations where I handled different responsibilities and sometimes the issues were technical and sometimes non technical and sometimes the process was long and I had to do many things with different tools and different people and overall I think it helped me learn a lot and become better with communication and execution.",
      score: 52,
      pressureLevel: 84,
      turnIndex: 3,
    },
  ];

  scenarios.forEach(runScenario);
  runPersonalityBlock();

  console.log(
    "\n✅ Recruiter runtime isolated test completed.\nNo Vapi, no browser speech, no interview page changes. This test only validates recruiter runtime behavior.",
  );
}

runRuntimeTest();
