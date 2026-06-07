export type TranscriptItem95 = {
  role?: "candidate" | "recruiter" | "system" | string;
  text?: string;
  time?: string;
};

export type CompanyDNAProfile = {
  id: string;
  label: string;
  confidence: number;
  promptDecorator: string;
  evaluationPrinciples: string[];
  challengeStyle: string;
  evidenceBias: string;
  redFlags: string[];
  followUpTemplates: string[];
};

export type DeterministicRubricFacts = {
  quantifiableMetricPresent: boolean;
  metricValue: string;
  explainedPersonalContribution: boolean;
  problemClearlyDefined: boolean;
  actionClearlyExplained: boolean;
  resultClearlyExplained: boolean;
  roleRelevantEvidence: boolean;
  demonstratedOwnership: boolean;
  demonstratedLearning: boolean;
  demonstratedBlameShifting: boolean;
  vagueOrGeneric: boolean;
  companySpecificAlignment: boolean;
  askedClarifyingQuestion: boolean;
  fillerHeavy: boolean;
  contradictionSignal: boolean;
};

export type DeterministicScore = {
  relevance: number;
  clarity: number;
  structure: number;
  evidence: number;
  confidence: number;
  ownership: number;
  roleFit: number;
  companyFit: number;
  overall: number;
  rubricFacts: DeterministicRubricFacts;
  scoreReason: string;
};

export type ContradictionChallenge = {
  detected: boolean;
  severity: 0 | 1 | 2 | 3 | 4 | 5;
  type: "none" | "timeline" | "role_scope" | "ownership" | "team_size" | "skill_claim" | "company_claim";
  previousClaim: string;
  currentClaim: string;
  challengePrompt: string;
  trustPenalty: number;
  shouldInterruptFlow: boolean;
};

export type LatencyHidingCue = {
  enabled: boolean;
  text: string;
  personaTone: "warm" | "analytical" | "skeptical" | "executive";
  estimatedCoverMs: number;
};

export type InterviewIntelligence95 = {
  companyDNA: CompanyDNAProfile;
  deterministicScore: DeterministicScore;
  contradictionChallenge: ContradictionChallenge;
  latencyCue: LatencyHidingCue;
  whatRecruiterHeard: string;
  benchmark: {
    band: "top_10" | "strong" | "average" | "weak";
    gapToTopCandidate: string[];
    topCandidateWouldSay: string;
  };
  answerRewrites: string[];
  nextBestProbe: string;
  failureAnalytics: {
    riskFlags: string[];
    recoveryHint: string;
  };
};

function clean(value: unknown, max = 3000) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function lower(value: unknown) {
  return clean(value, 8000).toLowerCase();
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hasAny(source: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(source));
}

function metricValue(answer: string) {
  return answer.match(/\b\d+(?:\.\d+)?\s*(?:%|percent|users?|customers?|tickets?|hours?|days?|weeks?|months?|years?|x|times|revenue|cost|€|\$|kpi|sla)\b/i)?.[0] || "";
}

function detectCompanyName(input: {
  companyName?: string;
  companyStyle?: string;
  jobDescription?: string;
  targetRole?: string;
}) {
  const source = `${input.companyName || ""} ${input.companyStyle || ""} ${input.jobDescription || ""} ${input.targetRole || ""}`.toLowerCase();
  const known = [
    ["amazon", /\bamazon\b|bar raiser|leadership principles/i],
    ["mckinsey", /\bmckinsey\b|case interview|mece|consulting/i],
    ["google", /\bgoogle\b|googliness|structured problem solving/i],
    ["meta", /\bmeta\b|facebook|move fast|product sense/i],
    ["microsoft", /\bmicrosoft\b|growth mindset/i],
    ["startup", /startup|founder-led|early-stage|fast-paced/i],
    ["bank", /bank|banking|compliance|risk|regulated|audit/i],
  ] as const;
  return known.find(([, pattern]) => pattern.test(source))?.[0] || "generic";
}

const COMPANY_DNA: Record<string, Omit<CompanyDNAProfile, "confidence">> = {
  amazon: {
    id: "amazon",
    label: "Amazon-style Bar Raiser",
    promptDecorator:
      "Evaluate through Amazon-style Leadership Principles. Demand ownership, customer obsession, dive-deep detail, measurable outcomes, and clarity about the candidate's exact contribution. Do not accept vague team-level answers.",
    evaluationPrinciples: ["Customer Obsession", "Ownership", "Dive Deep", "Bias for Action", "Deliver Results", "Learn and Be Curious"],
    challengeStyle: "Direct, evidence-heavy, data-first, with repeated follow-ups on ownership and measurable result.",
    evidenceBias: "Metrics, customer impact, root cause, trade-offs, and exact personal contribution.",
    redFlags: ["blame shifting", "no metrics", "unclear ownership", "surface-level answers", "team-only claims"],
    followUpTemplates: [
      "Let’s dive deeper. What exact metric changed because of your action?",
      "What was your personal contribution versus the team’s contribution?",
      "What was the root cause, and how did you validate it?",
    ],
  },
  mckinsey: {
    id: "mckinsey",
    label: "McKinsey-style Structured Interviewer",
    promptDecorator:
      "Evaluate through consulting-style structured thinking. Push for MECE structure, business impact, hypothesis clarity, and concise executive communication.",
    evaluationPrinciples: ["MECE structure", "business judgment", "hypothesis thinking", "executive clarity", "impact orientation"],
    challengeStyle: "Calm but rigorous. Ask for structure, prioritization, and business reasoning.",
    evidenceBias: "Clear problem framing, quantified business impact, and structured decision logic.",
    redFlags: ["unstructured storytelling", "no prioritization", "activity without impact", "rambling"],
    followUpTemplates: [
      "Can you structure that answer into the problem, options, decision, and impact?",
      "What was the business implication of that work?",
      "If you had to explain this to a senior client in 30 seconds, how would you frame it?",
    ],
  },
  google: {
    id: "google",
    label: "Google-style Structured Problem Solver",
    promptDecorator:
      "Evaluate for structured problem solving, collaboration, technical depth, learning agility, and user impact. Ask for trade-offs and decision criteria.",
    evaluationPrinciples: ["structured problem solving", "collaboration", "technical depth", "user impact", "learning agility"],
    challengeStyle: "Curious, analytical, and trade-off focused.",
    evidenceBias: "User impact, technical reasoning, collaboration, and scalable thinking.",
    redFlags: ["no trade-offs", "no user impact", "unclear technical reasoning", "weak collaboration"],
    followUpTemplates: [
      "What alternatives did you consider, and why did you choose that approach?",
      "How did this affect the end user or business outcome?",
      "What would you do differently if the scale were ten times larger?",
    ],
  },
  meta: {
    id: "meta",
    label: "Meta-style Product and Execution Interviewer",
    promptDecorator:
      "Evaluate for speed, ownership, product sense, impact, and ability to operate in ambiguity. Push for prioritization and execution clarity.",
    evaluationPrinciples: ["impact", "execution speed", "ownership", "ambiguity handling", "product sense"],
    challengeStyle: "Fast, practical, and impact-focused.",
    evidenceBias: "Prioritization, measurable impact, iteration, and trade-offs.",
    redFlags: ["slow decision-making", "no impact", "low ownership", "no prioritization"],
    followUpTemplates: [
      "How did you prioritize what to do first?",
      "What was the measurable impact, and how quickly did you reach it?",
      "What signal told you that your decision was working?",
    ],
  },
  microsoft: {
    id: "microsoft",
    label: "Microsoft-style Growth Mindset Interviewer",
    promptDecorator:
      "Evaluate for collaboration, growth mindset, customer value, learning from failure, and inclusive problem solving.",
    evaluationPrinciples: ["growth mindset", "collaboration", "customer value", "learning", "inclusive teamwork"],
    challengeStyle: "Supportive but precise; probes learning, teamwork, and customer outcome.",
    evidenceBias: "Learning, collaboration, customer value, and reflection.",
    redFlags: ["no learning", "poor collaboration", "blame shifting", "no customer value"],
    followUpTemplates: [
      "What did you learn from that experience?",
      "How did you bring others along?",
      "How did this create value for the customer or user?",
    ],
  },
  startup: {
    id: "startup",
    label: "Startup Operator Interviewer",
    promptDecorator:
      "Evaluate for ownership, speed, scrappiness, ambiguity tolerance, and direct business impact. Push for what the candidate personally shipped or solved.",
    evaluationPrinciples: ["ownership", "speed", "scrappiness", "ambiguity", "impact"],
    challengeStyle: "Direct, fast, and execution-focused.",
    evidenceBias: "What was shipped, how fast, what improved, and what the candidate owned.",
    redFlags: ["waiting for instructions", "no ownership", "no shipped outcome", "vague impact"],
    followUpTemplates: [
      "What did you personally own end-to-end?",
      "What did you ship or improve, and how fast?",
      "How did you handle ambiguity without waiting for perfect direction?",
    ],
  },
  bank: {
    id: "bank",
    label: "Regulated Industry Interviewer",
    promptDecorator:
      "Evaluate for reliability, compliance awareness, process discipline, risk thinking, documentation, and stakeholder communication.",
    evaluationPrinciples: ["risk awareness", "process discipline", "documentation", "reliability", "stakeholder communication"],
    challengeStyle: "Structured, cautious, and risk-aware.",
    evidenceBias: "Controls, documentation, escalation, risk handling, and process quality.",
    redFlags: ["ignored process", "no documentation", "poor risk awareness", "casual handling of sensitive work"],
    followUpTemplates: [
      "How did you control risk in that situation?",
      "What documentation or process did you follow?",
      "How did you escalate or communicate the issue to stakeholders?",
    ],
  },
  generic: {
    id: "generic",
    label: "Role-specific Company DNA",
    promptDecorator:
      "Evaluate against the target role, job description, candidate CV evidence, and company style. Ask for concrete evidence, metrics, ownership, and role relevance.",
    evaluationPrinciples: ["role relevance", "evidence", "ownership", "communication", "impact"],
    challengeStyle: "Balanced, realistic, and evidence-seeking.",
    evidenceBias: "Relevant examples, measurable outcomes, and personal contribution.",
    redFlags: ["vague answers", "no evidence", "unclear ownership", "unsupported claims"],
    followUpTemplates: [
      "Can you give me a more concrete example?",
      "What was your exact contribution?",
      "What result or metric proves that this worked?",
    ],
  },
};

export function buildCompanyDNAProfile(input: {
  companyName?: string;
  companyStyle?: string;
  jobDescription?: string;
  targetRole?: string;
}): CompanyDNAProfile {
  const id = detectCompanyName(input);
  const base = COMPANY_DNA[id] || COMPANY_DNA.generic;
  const source = `${input.companyName || ""} ${input.companyStyle || ""} ${input.jobDescription || ""}`;
  const confidence = id === "generic" ? 35 : /\b(amazon|mckinsey|google|meta|facebook|microsoft)\b/i.test(source) ? 92 : 70;
  return { ...base, confidence };
}

export function decorateJobContextWithCompanyDNA(jobDescription: string, dna: CompanyDNAProfile) {
  const original = clean(jobDescription, 2400);
  return [
    original,
    "",
    "WORKZO_COMPANY_DNA_DECORATOR:",
    dna.promptDecorator,
    `Evaluation principles: ${dna.evaluationPrinciples.join(", ")}.`,
    `Challenge style: ${dna.challengeStyle}`,
    `Evidence bias: ${dna.evidenceBias}`,
    `Red flags: ${dna.redFlags.join(", ")}.`,
  ].filter(Boolean).join("\n").slice(0, 3200);
}

export function extractDeterministicRubricFacts(input: {
  answer: string;
  currentQuestion?: string;
  cvText?: string;
  jobDescription?: string;
  companyDNA?: CompanyDNAProfile;
}): DeterministicRubricFacts {
  const answer = clean(input.answer, 5000);
  const a = lower(answer);
  const q = lower(input.currentQuestion || "");
  const jd = lower(input.jobDescription || "");
  const metric = metricValue(answer);
  const firstPersonAction = /\b(i|my)\b.{0,40}\b(built|created|led|owned|managed|implemented|resolved|improved|designed|developed|automated|analyzed|delivered|coordinated)\b/i.test(answer);
  const teamOnly = /\bwe\b/i.test(answer) && !/\b(i|my)\b/i.test(answer);
  const problem = hasAny(a, [/\bproblem\b/, /\bchallenge\b/, /\bissue\b/, /\bneeded\b/, /\bgoal\b/, /\bsituation\b/]);
  const action = hasAny(a, [/\bi\s+(built|created|led|owned|managed|implemented|resolved|improved|designed|developed|automated|analyzed|delivered|coordinated)\b/, /\bmy\s+(role|responsibility|contribution|approach)\b/]);
  const result = Boolean(metric) || hasAny(a, [/\bresult\b/, /\boutcome\b/, /\bimpact\b/, /\bimproved\b/, /\breduced\b/, /\bincreased\b/, /\bsaved\b/]);
  const blame = hasAny(a, [/\bmy manager\b.*\bfailed\b/, /\bteam\b.*\bfailed\b/, /\bnot my fault\b/, /\bthey\b.*\bmistake\b/, /\bblame\b/]);
  const vague = answer.length < 90 || hasAny(a, [/\bstuff\b/, /\bthings\b/, /\betc\b/, /\bsomething like that\b/, /\bi just helped\b/, /\bas needed\b/]);
  const roleRelevantEvidence = jd
    ? jd.split(/[^a-z0-9+#]+/).filter((token) => token.length > 4).slice(0, 80).some((token) => a.includes(token))
    : hasAny(a, [/\bcustomer\b/, /\bdata\b/, /\btechnical\b/, /\bproject\b/, /\bteam\b/, /\bprocess\b/, /\bsales\b/, /\bdesign\b/]);
  const companySpecificAlignment = Boolean(input.companyDNA?.evaluationPrinciples.some((principle) => a.includes(principle.toLowerCase().split(" ")[0])));
  const fillerMatches = answer.match(/\b(um|uh|like|you know|basically|actually)\b/gi) || [];

  return {
    quantifiableMetricPresent: Boolean(metric),
    metricValue: metric,
    explainedPersonalContribution: firstPersonAction && !teamOnly,
    problemClearlyDefined: problem,
    actionClearlyExplained: action,
    resultClearlyExplained: result,
    roleRelevantEvidence,
    demonstratedOwnership: firstPersonAction || /\bowned\b|\bresponsible for\b|\bmy responsibility\b/i.test(answer),
    demonstratedLearning: /\blearned\b|\bimproved\b|\bnext time\b|\bfeedback\b|\breflection\b/i.test(answer),
    demonstratedBlameShifting: blame,
    vagueOrGeneric: vague,
    companySpecificAlignment,
    askedClarifyingQuestion: /\bdo you mean\b|\bcan you clarify\b|\bwhat do you mean\b|\bcould you explain\b/i.test(answer),
    fillerHeavy: fillerMatches.length >= 4,
    contradictionSignal: false,
  };
}

export function calculateDeterministicScore(facts: DeterministicRubricFacts, dna?: CompanyDNAProfile): DeterministicScore {
  let relevance = 45;
  let clarity = 45;
  let structure = 40;
  let evidence = 35;
  let confidence = 48;
  let ownership = 40;
  let roleFit = 45;
  let companyFit = dna?.id === "generic" ? 45 : 50;

  if (facts.problemClearlyDefined) structure += 12;
  if (facts.actionClearlyExplained) structure += 12;
  if (facts.resultClearlyExplained) structure += 14;
  if (facts.quantifiableMetricPresent) evidence += 24;
  if (facts.explainedPersonalContribution) ownership += 22;
  if (facts.demonstratedOwnership) ownership += 14;
  if (facts.roleRelevantEvidence) roleFit += 22;
  if (facts.companySpecificAlignment) companyFit += 18;
  if (facts.demonstratedLearning) confidence += 8;
  if (facts.askedClarifyingQuestion) clarity += 8;

  if (facts.vagueOrGeneric) {
    clarity -= 18;
    evidence -= 16;
    relevance -= 8;
  }
  if (facts.demonstratedBlameShifting) {
    ownership -= 28;
    confidence -= 22;
    companyFit -= 16;
  }
  if (facts.fillerHeavy) clarity -= 10;
  if (facts.contradictionSignal) confidence -= 25;

  const overall = clamp(
    relevance * 0.14 + clarity * 0.14 + structure * 0.14 + evidence * 0.2 + confidence * 0.12 + ownership * 0.14 + roleFit * 0.08 + companyFit * 0.04,
  );

  const missing: string[] = [];
  if (!facts.quantifiableMetricPresent) missing.push("no metric");
  if (!facts.explainedPersonalContribution) missing.push("unclear personal contribution");
  if (!facts.resultClearlyExplained) missing.push("unclear result");
  if (!facts.roleRelevantEvidence) missing.push("weak role-specific evidence");

  return {
    relevance: clamp(relevance),
    clarity: clamp(clarity),
    structure: clamp(structure),
    evidence: clamp(evidence),
    confidence: clamp(confidence),
    ownership: clamp(ownership),
    roleFit: clamp(roleFit),
    companyFit: clamp(companyFit),
    overall,
    rubricFacts: facts,
    scoreReason: missing.length ? `Score limited by ${missing.join(", ")}.` : "Answer contains concrete evidence, ownership, and role-relevant impact.",
  };
}

function extractTeamSize(text: string) {
  const match = text.match(/\b(?:led|managed|supervised|handled)\s+(?:a\s+)?(?:team\s+of\s+)?(\d{1,3})\b/i) || text.match(/\b(\d{1,3})\s+(?:people|members|engineers|analysts|teammates)\b/i);
  return match ? Number(match[1]) : 0;
}

function extractNoManagement(text: string) {
  return /\b(no|not|never|haven't|have not|didn't|did not)\b.{0,35}\b(manage|managed|management|lead|led|supervise|team)\b/i.test(text);
}

function extractOwnershipClaim(text: string) {
  if (/\b(i|my)\b.{0,35}\b(owned|led|managed|built|created|implemented|delivered)\b/i.test(text)) return "owned";
  if (/\b(we|team)\b.{0,35}\b(built|created|implemented|delivered)\b/i.test(text) && !/\b(i|my)\b/i.test(text)) return "team_only";
  return "unknown";
}

export function detectContradictionChallenge(input: {
  answer: string;
  transcript?: TranscriptItem95[];
}): ContradictionChallenge {
  const answer = clean(input.answer, 2500);
  const previous = (input.transcript || [])
    .filter((item) => item.role === "candidate")
    .map((item) => clean(item.text, 1200))
    .filter(Boolean)
    .slice(-8);
  const currentTeam = extractTeamSize(answer);
  const currentNoManagement = extractNoManagement(answer);
  const currentOwnership = extractOwnershipClaim(answer);

  for (const prev of previous) {
    const previousTeam = extractTeamSize(prev);
    const previousNoManagement = extractNoManagement(prev);
    const previousOwnership = extractOwnershipClaim(prev);

    if ((previousTeam >= 2 && currentNoManagement) || (currentTeam >= 2 && previousNoManagement)) {
      const high = Math.max(previousTeam, currentTeam) >= 5;
      const team = Math.max(previousTeam, currentTeam);
      return {
        detected: true,
        severity: high ? 5 : 4,
        type: "team_size",
        previousClaim: prev,
        currentClaim: answer,
        challengePrompt: `Earlier you mentioned leading or managing a team${team ? ` of ${team}` : ""}, but just now you suggested you have not managed or led a team. Could you clarify your actual responsibility and whether this was formal people management, project leadership, or informal coordination?`,
        trustPenalty: high ? -14 : -10,
        shouldInterruptFlow: true,
      };
    }

    if (previousOwnership === "owned" && currentOwnership === "team_only") {
      return {
        detected: true,
        severity: 3,
        type: "ownership",
        previousClaim: prev,
        currentClaim: answer,
        challengePrompt: "Earlier you framed this as something you personally owned, but now it sounds more like a team-level contribution. Can you clarify exactly what you personally did versus what the team did?",
        trustPenalty: -7,
        shouldInterruptFlow: true,
      };
    }
  }

  return {
    detected: false,
    severity: 0,
    type: "none",
    previousClaim: "",
    currentClaim: answer,
    challengePrompt: "",
    trustPenalty: 0,
    shouldInterruptFlow: false,
  };
}

export function buildLatencyHidingCue(input: {
  answer: string;
  recruiterPersonality?: string;
  companyDNA?: CompanyDNAProfile;
  facts?: DeterministicRubricFacts;
}): LatencyHidingCue {
  const persona = lower(input.recruiterPersonality || input.companyDNA?.label || "");
  const facts = input.facts;
  let personaTone: LatencyHidingCue["personaTone"] = "analytical";
  if (/friendly|hr|supportive|microsoft/.test(persona)) personaTone = "warm";
  if (/skeptical|bar raiser|amazon|executive/.test(persona)) personaTone = "skeptical";
  if (/mckinsey|executive|corporate|bank/.test(persona)) personaTone = "executive";

  const text = (() => {
    if (facts?.vagueOrGeneric) return personaTone === "warm" ? "Okay, let’s make that a bit more concrete." : "Right, I’ll need a more specific example there.";
    if (facts?.quantifiableMetricPresent) return personaTone === "skeptical" ? "Okay, that metric is useful — let’s test it a bit." : "Got it, that gives me something concrete.";
    if (facts?.askedClarifyingQuestion) return "Fair question — let me clarify the angle.";
    if (personaTone === "executive") return "Understood. Let’s sharpen the business angle.";
    if (personaTone === "warm") return "Got it, thanks for explaining that.";
    return "Interesting. Let me probe that slightly.";
  })();

  return { enabled: true, text, personaTone, estimatedCoverMs: 900 };
}

export function buildWhatRecruiterHeard(facts: DeterministicRubricFacts, answer: string) {
  if (facts.demonstratedBlameShifting) return "The recruiter may hear low ownership or blame-shifting, even if the situation was genuinely difficult.";
  if (facts.vagueOrGeneric) return "The recruiter may hear a broad claim without enough proof, ownership, or measurable outcome.";
  if (!facts.explainedPersonalContribution) return "The recruiter may hear team activity, but not enough about what you personally owned.";
  if (!facts.quantifiableMetricPresent) return "The recruiter understands the action, but may still wonder how success was measured.";
  if (facts.quantifiableMetricPresent && facts.explainedPersonalContribution) return "The recruiter hears a credible example with ownership and measurable impact.";
  return `The recruiter hears: ${clean(answer, 180)}`;
}

export function buildBenchmark(score: DeterministicScore, dna: CompanyDNAProfile) {
  const band = score.overall >= 86 ? "top_10" : score.overall >= 74 ? "strong" : score.overall >= 55 ? "average" : "weak";
  const gapToTopCandidate: string[] = [];
  const facts = score.rubricFacts;
  if (!facts.quantifiableMetricPresent) gapToTopCandidate.push("Add one measurable result or business metric.");
  if (!facts.explainedPersonalContribution) gapToTopCandidate.push("Separate your personal contribution from the team contribution.");
  if (!facts.resultClearlyExplained) gapToTopCandidate.push("Close the answer with the outcome and why it mattered.");
  if (!facts.companySpecificAlignment && dna.id !== "generic") gapToTopCandidate.push(`Tie the example to ${dna.evaluationPrinciples.slice(0, 2).join(" and ")}.`);

  return {
    band,
    gapToTopCandidate: gapToTopCandidate.slice(0, 4),
    topCandidateWouldSay: facts.metricValue
      ? `A top candidate would briefly frame the problem, state their exact action, and connect ${facts.metricValue} to a business or customer outcome.`
      : "A top candidate would add a concrete metric, the decision they personally made, and the measurable outcome.",
  } as InterviewIntelligence95["benchmark"];
}

export function buildAnswerRewrites(input: {
  answer: string;
  facts: DeterministicRubricFacts;
  dna: CompanyDNAProfile;
  targetRole?: string;
}) {
  const role = clean(input.targetRole, 80) || "the role";
  const metric = input.facts.metricValue || "[metric/result]";
  const dnaPrinciple = input.dna.evaluationPrinciples[0] || "role impact";
  return [
    `In my previous work, the core problem was [problem]. I personally [specific action], which led to ${metric} and helped the team/customer by [business impact].`,
    `For ${role}, the most relevant example is [example]. My direct contribution was [ownership], and the outcome was ${metric}.`,
    `To connect this to ${input.dna.label}, this example shows ${dnaPrinciple}: I [action], measured success through ${metric}, and learned [lesson].`,
  ];
}

export function buildInterviewIntelligence95(input: {
  answer: string;
  currentQuestion?: string;
  transcript?: TranscriptItem95[];
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  companyName?: string;
  companyStyle?: string;
  recruiterPersonality?: string;
}): InterviewIntelligence95 {
  const companyDNA = buildCompanyDNAProfile(input);
  const facts = extractDeterministicRubricFacts({ ...input, companyDNA });
  const contradictionChallenge = detectContradictionChallenge({ answer: input.answer, transcript: input.transcript });
  const factsWithContradiction = { ...facts, contradictionSignal: contradictionChallenge.detected };
  const deterministicScore = calculateDeterministicScore(factsWithContradiction, companyDNA);
  const latencyCue = buildLatencyHidingCue({ ...input, companyDNA, facts: factsWithContradiction });
  const whatRecruiterHeard = buildWhatRecruiterHeard(factsWithContradiction, input.answer);
  const benchmark = buildBenchmark(deterministicScore, companyDNA);
  const answerRewrites = buildAnswerRewrites({ answer: input.answer, facts: factsWithContradiction, dna: companyDNA, targetRole: input.targetRole });
  const nextBestProbe = contradictionChallenge.shouldInterruptFlow
    ? contradictionChallenge.challengePrompt
    : companyDNA.followUpTemplates.find((template) => {
        if (!factsWithContradiction.quantifiableMetricPresent && /metric|measurable|impact/i.test(template)) return true;
        if (!factsWithContradiction.explainedPersonalContribution && /personal|contribution|own/i.test(template)) return true;
        return false;
      }) || companyDNA.followUpTemplates[0];
  const riskFlags = [
    factsWithContradiction.vagueOrGeneric ? "vague_answer" : "",
    !factsWithContradiction.quantifiableMetricPresent ? "missing_metric" : "",
    !factsWithContradiction.explainedPersonalContribution ? "unclear_ownership" : "",
    contradictionChallenge.detected ? `contradiction_${contradictionChallenge.type}` : "",
    factsWithContradiction.demonstratedBlameShifting ? "blame_shifting" : "",
  ].filter(Boolean);

  return {
    companyDNA,
    deterministicScore,
    contradictionChallenge,
    latencyCue,
    whatRecruiterHeard,
    benchmark,
    answerRewrites,
    nextBestProbe,
    failureAnalytics: {
      riskFlags,
      recoveryHint: riskFlags.length ? "Keep the candidate on the same topic and ask for evidence before advancing." : "No immediate recovery needed.",
    },
  };
}

export function applyInterviewIntelligence95ToDecision<T extends Record<string, any>>(decision: T, intelligence: InterviewIntelligence95): T {
  const contradiction = intelligence.contradictionChallenge;
  const deterministic = intelligence.deterministicScore;
  const shouldConfront = contradiction.shouldInterruptFlow && contradiction.severity >= 4;
  const spokenReply = shouldConfront ? contradiction.challengePrompt : (decision.spokenReply || decision.question || intelligence.nextBestProbe);
  const trustDelta = shouldConfront
    ? contradiction.trustPenalty
    : Math.max(-12, Math.min(10, Math.round((deterministic.overall - 62) / 5)));

  return {
    ...decision,
    spokenReply,
    question: spokenReply,
    displayQuestion: shouldConfront ? contradiction.challengePrompt : (decision.displayQuestion || spokenReply),
    shouldAdvanceQuestion: shouldConfront ? false : decision.shouldAdvanceQuestion,
    shouldStayOnCurrentQuestion: shouldConfront ? true : decision.shouldStayOnCurrentQuestion,
    shouldCountAsAnswer: shouldConfront ? false : decision.shouldCountAsAnswer,
    trustDelta,
    recruiterState: shouldConfront ? "skeptical" : decision.recruiterState,
    concern: shouldConfront ? contradiction.challengePrompt : decision.concern,
    workzoInterviewIntelligence95: intelligence,
    companyDNA: intelligence.companyDNA,
    deterministicScore: intelligence.deterministicScore,
    contradictionChallenge: intelligence.contradictionChallenge,
    latencyCue: intelligence.latencyCue,
    whatRecruiterHeard: intelligence.whatRecruiterHeard,
    benchmark: intelligence.benchmark,
    answerRewrites: intelligence.answerRewrites,
  };
}
