export type TranscriptItem = {
  role?: string;
  speaker?: string;
  text?: string;
  time?: string;
};

export type RecruiterIntelligenceSetup = {
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  targetMarket?: string;
  companyStyle?: string;
  recruiterPersonality?: string;
  language?: string;
};

export type RecruiterMemoryV2 = {
  companies: string[];
  roles: string[];
  skills: string[];
  projects: string[];
  metrics: string[];
  claims: string[];
  contradictions: string[];
  evidenceRequests: string[];
  weakAnswerReasons: string[];
  trustEvents: Array<{
    delta: number;
    reason: string;
  }>;
  nextProbeTopic: string;
};

export type RecruiterDecisionV2 = {
  reply: string;
  memory: RecruiterMemoryV2;
  trustDelta: number;
  interestDelta: number;
  concern: string;
  weakAnswer: boolean;
  contradictionDetected: boolean;
  evidenceRequested: boolean;
  projectDeepDive: boolean;
};

const EMPTY_MEMORY: RecruiterMemoryV2 = {
  companies: [],
  roles: [],
  skills: [],
  projects: [],
  metrics: [],
  claims: [],
  contradictions: [],
  evidenceRequests: [],
  weakAnswerReasons: [],
  trustEvents: [],
  nextProbeTopic: "",
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim()
    ? value.replace(/\s+/g, " ").trim()
    : fallback;
}

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function unique(values: string[], limit = 20) {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    const cleaned = text(raw);
    if (!cleaned) continue;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(cleaned);

    if (out.length >= limit) break;
  }

  return out;
}

function hasMetric(value: string) {
  return /\d|%|percent|customers?|tickets?|hours?|days?|weeks?|months?|saved|reduced|increased|improved|revenue|cost|time|quality|sla|csat|nps|conversion|response time/i.test(
    value,
  );
}

function hasOwnership(value: string) {
  return /\b(i|my|me|personally|owned|built|handled|created|led|resolved|analyzed|analysed|improved|reduced|increased|implemented|designed|managed|coordinated|delivered)\b/i.test(
    value,
  );
}

function hasOutcome(value: string) {
  return /\b(result|impact|outcome|after|therefore|which led|so that|improved|reduced|increased|saved|achieved|delivered|helped|enabled)\b/i.test(
    value,
  );
}

function extractMetrics(value: string) {
  const matches = value.match(
    /\b(?:\d+(?:\.\d+)?\s*(?:%|percent|customers?|tickets?|hours?|days?|weeks?|months?|years?|users?|projects?|cases?|minutes?)|(?:saved|reduced|increased|improved)\s+[a-z0-9 %.-]{2,40})\b/gi,
  );

  return unique(matches || [], 12);
}

function extractCompanies(value: string) {
  const vals: string[] = [];
  const patterns = [
    /\b(?:at|with|for|from)\s+([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,4})\b/g,
    /\b(Zoho|Google|Microsoft|Amazon|Meta|Apple|Tesla|Salesforce|SAP|Oracle|IBM|Deloitte|Accenture|TCS|Infosys|Wipro)\b/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value))) {
      const company = text(match[1] || match[0])
        .replace(/\b(as|where|when|and|but|because|for|from|in|on|during|between|with|using|to|the|a|an)\b.*$/i, "")
        .trim();

      if (
        company &&
        !/\b(role|position|job|team|english|german|language|skills|support|engineer|analyst|manager|developer|executive|administrator)\b/i.test(company)
      ) {
        vals.push(company);
      }
    }
  }

  return unique(vals, 12);
}

function extractRoles(value: string) {
  const vals: string[] = [];
  const patterns = [
    /\b(?:as|as a|as an|worked as|working as|role as|position as)\s+(?:a\s+|an\s+)?([A-Za-z][A-Za-z /&+\-.]{3,60})(?=[,.!?]|$|\s+(?:at|with|for|where|and|but|during))/gi,
    /\b(?:Technical Support Engineer|Application Support Engineer|Data Analyst|Data Scientist|Sales Executive|Customer Success Manager|Product Manager|Software Engineer|Project Manager|Business Analyst|IT Support Specialist)\b/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value))) {
      const role = text(match[1] || match[0])
        .replace(/\b(at|with|for|where|and|but|during)\b.*$/i, "")
        .trim();

      if (
        role &&
        /\b(executive|manager|engineer|analyst|developer|consultant|specialist|lead|support|sales|marketing|product|designer|recruiter|success|administrator)\b/i.test(role)
      ) {
        vals.push(role);
      }
    }
  }

  return unique(vals, 12);
}

function extractSkills(value: string) {
  const known = [
    "SQL",
    "Python",
    "Pandas",
    "Tableau",
    "Power BI",
    "Excel",
    "CRM",
    "ITIL",
    "ServiceDesk Plus",
    "ServiceNow",
    "GCP",
    "API",
    "REST API",
    "Machine Learning",
    "NLP",
    "Customer Support",
    "Stakeholder Management",
    "Troubleshooting",
    "Data Analysis",
    "Dashboard",
  ];

  return unique(
    known.filter((skill) => new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(value)),
    18,
  );
}

function extractProjects(value: string) {
  const vals: string[] = [];
  const lines = value
    .split(/[.\n]/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (/\b(project|dashboard|pipeline|scraper|analysis|model|classification|forecast|api|automation|portfolio)\b/i.test(line)) {
      vals.push(line.slice(0, 140));
    }
  }

  return unique(vals, 10);
}

function extractClaimSummary(answer: string) {
  const parts: string[] = [];
  const companies = extractCompanies(answer);
  const roles = extractRoles(answer);
  const metrics = extractMetrics(answer);
  const skills = extractSkills(answer);

  if (companies.length) parts.push(`company:${companies.join(", ")}`);
  if (roles.length) parts.push(`role:${roles.join(", ")}`);
  if (metrics.length) parts.push(`metric:${metrics.join(", ")}`);
  if (skills.length) parts.push(`skill:${skills.join(", ")}`);

  if (!parts.length && answer.length > 20) {
    parts.push(answer.slice(0, 140));
  }

  return unique(parts, 8);
}

function contextText(setup: RecruiterIntelligenceSetup) {
  return `${setup.cvText || ""}\n${setup.jobDescription || ""}`;
}

function isClaimSupported(claim: string, setup: RecruiterIntelligenceSetup) {
  const evidence = lower(contextText(setup));
  if (!evidence) return true;

  const cleanClaim = claim
    .toLowerCase()
    .replace(/^(company|role|metric|skill):/i, "")
    .replace(/[^a-z0-9+.# ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanClaim || cleanClaim.length < 3) return true;

  const importantWords = cleanClaim
    .split(" ")
    .filter((word) => word.length >= 4 && !/company|role|metric|skill|years|experience/.test(word));

  if (!importantWords.length) return true;

  return importantWords.some((word) => evidence.includes(word));
}

function detectContradictions(answer: string, memory: RecruiterMemoryV2) {
  const contradictions: string[] = [];
  const low = lower(answer);
  const priorText = lower([
    ...memory.claims,
    ...memory.companies.map((item) => `company:${item}`),
    ...memory.roles.map((item) => `role:${item}`),
    ...memory.metrics.map((item) => `metric:${item}`),
  ].join(" | "));

  if (/\b(i lied|i made that up|i made it up|not true|wasn't true|that is false|false|fake|i exaggerated|i was lying|sorry.*lie|i just lied)\b/i.test(low)) {
    contradictions.push("Candidate admitted that a previous claim was false or exaggerated.");
  }

  if (/\b(never worked|no experience|did not work|didn't work|haven't worked|have not worked|never had experience|no real experience)\b/i.test(low)) {
    if (memory.companies.length || memory.roles.length || memory.skills.length) {
      contradictions.push("Candidate now denies experience after previously claiming companies, roles, or skills.");
    }

    for (const company of memory.companies) {
      if (new RegExp(`\\b${company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(low)) {
        contradictions.push(`Candidate now denies or weakens earlier company claim: ${company}.`);
      }
    }

    for (const role of memory.roles) {
      if (new RegExp(`\\b${role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(low)) {
        contradictions.push(`Candidate now denies or weakens earlier role claim: ${role}.`);
      }
    }
  }

  const currentYears = Array.from(low.matchAll(/\b(\d{1,2})\s*(?:\+?\s*)?(?:years?|yrs?)\b/g)).map((match) => Number(match[1]));
  const priorYears = Array.from(priorText.matchAll(/\b(\d{1,2})\s*(?:\+?\s*)?(?:years?|yrs?)\b/g)).map((match) => Number(match[1]));
  for (const current of currentYears) {
    for (const prior of priorYears) {
      if (Math.abs(current - prior) >= 2) {
        contradictions.push(`Candidate changed years of experience from about ${prior} to ${current}.`);
      }
    }
  }

  const currentTeam = Array.from(low.matchAll(/\b(?:managed|led|handled|supervised)\s+(?:a\s+)?(?:team\s+of\s+)?(\d{1,4})\b/g)).map((match) => Number(match[1]));
  const priorTeam = Array.from(priorText.matchAll(/\b(?:managed|led|handled|supervised)\s+(?:a\s+)?(?:team\s+of\s+)?(\d{1,4})\b/g)).map((match) => Number(match[1]));

  if (/\b(worked alone|completely alone|no team|individual contributor|not a manager|did not manage|didn't manage|never managed)\b/i.test(low)) {
    if (priorTeam.some((value) => value >= 2) || /\b(managed|led|supervised)\b/i.test(priorText)) {
      contradictions.push("Candidate now says they worked alone after earlier implying team leadership or management.");
    }
  }

  for (const current of currentTeam) {
    for (const prior of priorTeam) {
      if (Math.abs(current - prior) >= 5) {
        contradictions.push(`Candidate changed team size claim from about ${prior} to ${current}.`);
      }
    }
  }

  if (/\b(not mine|team did|someone else|my manager did|not personally|i only watched|i was not involved)\b/i.test(low)) {
    if (/\b(i|my|personally|owned|built|handled|created|led|resolved|analyzed|analysed|improved|reduced|increased|implemented|designed|managed|coordinated|delivered)\b/i.test(priorText)) {
      contradictions.push("Candidate reduced personal ownership after previously describing the work as their own.");
    }
  }

  return unique(contradictions, 8);
}

function detectWeakAnswerReasons(answer: string) {
  const reasons: string[] = [];
  const words = answer.trim().split(/\s+/).filter(Boolean).length;

  if (words < 18) reasons.push("Answer is too short to judge role fit.");
  if (!hasOwnership(answer)) reasons.push("Personal ownership is unclear.");
  if (!hasMetric(answer)) reasons.push("No measurable impact or evidence was provided.");
  if (!hasOutcome(answer)) reasons.push("Outcome or business impact is missing.");
  if (/\bwe\b/i.test(answer) && !/\b(i|my|personally)\b/i.test(answer)) {
    reasons.push("Answer sounds team-level rather than individual.");
  }
  if (/\bthings|stuff|many|some|good|nice|various|etc\b/i.test(answer)) {
    reasons.push("Answer uses vague wording instead of specific details.");
  }

  return unique(reasons, 8);
}

function buildEvidenceRequest(answer: string, setup: RecruiterIntelligenceSetup) {
  if (!hasMetric(answer)) {
    return "Give me one concrete metric or proof point: time saved, tickets reduced, customer impact, quality improvement, revenue, cost, or before-and-after result.";
  }

  if (!hasOwnership(answer)) {
    return "Clarify your exact ownership. What did you personally decide, build, handle, analyze, or deliver?";
  }

  if (!hasOutcome(answer)) {
    return "What changed after your work? Explain the outcome, who benefited, and how you know it worked.";
  }

  const unsupported = extractClaimSummary(answer).filter((claim) => !isClaimSupported(claim, setup));
  if (unsupported.length) {
    return `I need evidence for this claim: ${unsupported[0]}. Was it official work, freelance work, a project, or a transferable example?`;
  }

  return "";
}

function chooseProjectDeepDive(answer: string, setup: RecruiterIntelligenceSetup, memory: RecruiterMemoryV2) {
  const source = `${answer}\n${contextText(setup)}`;
  const projects = unique([...extractProjects(answer), ...memory.projects, ...extractProjects(source)], 8);

  if (!projects.length) return "";

  if (!memory.nextProbeTopic || memory.nextProbeTopic === "project") {
    return "Let's go deeper on one project. What was the problem, what constraints did you face, what did you personally decide, and what changed after your work?";
  }

  if (memory.nextProbeTopic === "technical_depth") {
    return "Now go one level deeper technically. What tools, data, workflow, or system design choices did you use, and why?";
  }

  if (memory.nextProbeTopic === "tradeoff") {
    return "What tradeoff or mistake came up in that project, and what would you do differently if you repeated it?";
  }

  return "";
}

function localize(setup: RecruiterIntelligenceSetup, english: string) {
  const lang = lower(setup.language);

  if (lang.includes("german") || lang.includes("deutsch") || lang === "de" || lang.includes("de-de")) {
    if (/metric|proof|evidence|time saved|tickets/i.test(english)) {
      return "Nenne bitte einen konkreten Nachweis: Zeitersparnis, weniger Tickets, Kundenwirkung, Qualitätsverbesserung, Umsatz, Kosten oder ein Vorher-Nachher-Ergebnis.";
    }
    if (/ownership|personally|personally decide/i.test(english)) {
      return "Kläre bitte deine genaue Eigenleistung. Was hast du persönlich entschieden, gebaut, analysiert, gelöst oder geliefert?";
    }
    if (/project|technical|tools|data|workflow|tradeoff|mistake/i.test(english)) {
      return "Lass uns bei einem Projekt tiefer gehen. Was war das Problem, welche Einschränkungen gab es, was hast du persönlich entschieden und was hat sich danach verändert?";
    }
    if (/contradict|claim|official work|freelance/i.test(english)) {
      return "Ich muss diese Aussage genauer prüfen. War das offizielle Berufserfahrung, freiberufliche Arbeit, ein Projekt oder ein übertragbares Beispiel?";
    }
  }

  if (lang.includes("dutch") || lang.includes("nederlands") || lang === "nl") {
    if (/metric|proof|evidence|time saved|tickets/i.test(english)) {
      return "Geef één concreet bewijs: tijdwinst, minder tickets, klantimpact, kwaliteitsverbetering, omzet, kosten of een voor-en-na resultaat.";
    }
    if (/ownership|personally/i.test(english)) {
      return "Maak je persoonlijke bijdrage duidelijk. Wat heb jij persoonlijk besloten, gebouwd, geanalyseerd, opgelost of geleverd?";
    }
    if (/project|technical|tools|data|workflow|tradeoff|mistake/i.test(english)) {
      return "Laten we dieper ingaan op één project. Wat was het probleem, welke beperkingen waren er, wat besliste jij persoonlijk en wat veranderde daarna?";
    }
  }

  if (lang.includes("french") || lang.includes("français") || lang.includes("francais") || lang === "fr") {
    if (/metric|proof|evidence|time saved|tickets/i.test(english)) {
      return "Donne une preuve concrète : temps gagné, tickets réduits, impact client, amélioration qualité, revenu, coût ou résultat avant/après.";
    }
    if (/ownership|personally/i.test(english)) {
      return "Clarifie ta contribution personnelle. Qu’as-tu personnellement décidé, construit, analysé, résolu ou livré ?";
    }
    if (/project|technical|tools|data|workflow|tradeoff|mistake/i.test(english)) {
      return "Approfondissons un projet. Quel était le problème, quelles contraintes avais-tu, qu’as-tu décidé personnellement et qu’est-ce qui a changé ensuite ?";
    }
  }

  if (lang.includes("spanish") || lang.includes("español") || lang.includes("espanol") || lang === "es") {
    if (/metric|proof|evidence|time saved|tickets/i.test(english)) {
      return "Dame una prueba concreta: tiempo ahorrado, menos tickets, impacto en clientes, mejora de calidad, ingresos, costes o un resultado antes/después.";
    }
    if (/ownership|personally/i.test(english)) {
      return "Aclara tu contribución personal. ¿Qué decidiste, construiste, analizaste, resolviste o entregaste tú personalmente?";
    }
    if (/project|technical|tools|data|workflow|tradeoff|mistake/i.test(english)) {
      return "Profundicemos en un proyecto. ¿Cuál fue el problema, qué restricciones había, qué decidiste personalmente y qué cambió después?";
    }
  }

  return english;
}

function nextProbeTopic(memory: RecruiterMemoryV2, answer: string) {
  if (extractProjects(answer).length && memory.nextProbeTopic !== "technical_depth") return "technical_depth";
  if (memory.nextProbeTopic === "technical_depth") return "tradeoff";
  if (memory.nextProbeTopic === "tradeoff") return "impact";
  return "project";
}

export function createRecruiterMemoryV2(
  seed?: Partial<RecruiterMemoryV2> | unknown,
): RecruiterMemoryV2 {
  const safeSeed: Partial<RecruiterMemoryV2> =
    seed && typeof seed === "object" && !Array.isArray(seed)
      ? (seed as Partial<RecruiterMemoryV2>)
      : {};

  return {
    ...EMPTY_MEMORY,
    ...safeSeed,
    companies: unique(safeSeed.companies || []),
    roles: unique(safeSeed.roles || []),
    skills: unique(safeSeed.skills || []),
    projects: unique(safeSeed.projects || []),
    metrics: unique(safeSeed.metrics || []),
    claims: unique(safeSeed.claims || []),
    contradictions: unique(safeSeed.contradictions || []),
    evidenceRequests: unique(safeSeed.evidenceRequests || []),
    weakAnswerReasons: unique(safeSeed.weakAnswerReasons || []),
    trustEvents: Array.isArray(safeSeed.trustEvents)
      ? safeSeed.trustEvents.slice(0, 30)
      : [],
    nextProbeTopic: safeSeed.nextProbeTopic || "",
  };
}


function buildRecruiterMemoryFromTranscript(
  transcript?: TranscriptItem[],
  setup: RecruiterIntelligenceSetup = {},
): RecruiterMemoryV2 {
  const items = Array.isArray(transcript) ? transcript : [];
  const candidateAnswers = items
    .filter((item) => item?.role === "candidate" && text(item.text))
    .map((item) => text(item.text));

  let memory = createRecruiterMemoryV2();

  for (const answer of candidateAnswers) {
    memory = updateRecruiterMemoryV2(memory, answer, setup);
  }

  return memory;
}

function mergeRecruiterMemoryV2(...memories: Array<unknown>): RecruiterMemoryV2 {
  return memories.reduce<RecruiterMemoryV2>((merged, item) => {
    const current = createRecruiterMemoryV2(item);
    return {
      companies: unique([...merged.companies, ...current.companies], 30),
      roles: unique([...merged.roles, ...current.roles], 30),
      skills: unique([...merged.skills, ...current.skills], 40),
      projects: unique([...merged.projects, ...current.projects], 25),
      metrics: unique([...merged.metrics, ...current.metrics], 25),
      claims: unique([...merged.claims, ...current.claims], 50),
      contradictions: unique([...merged.contradictions, ...current.contradictions], 25),
      evidenceRequests: unique([...merged.evidenceRequests, ...current.evidenceRequests], 25),
      weakAnswerReasons: unique([...merged.weakAnswerReasons, ...current.weakAnswerReasons], 35),
      trustEvents: [...merged.trustEvents, ...current.trustEvents].slice(-40),
      nextProbeTopic: current.nextProbeTopic || merged.nextProbeTopic,
    };
  }, createRecruiterMemoryV2());
}

function contradictionClarifyingQuestion(reason: string, memory: RecruiterMemoryV2) {
  const earlier = memory.claims.slice(-5).join("; ");
  const context = earlier ? ` Earlier I noted: ${earlier}.` : "";

  if (/lied|false|fake|exaggerated|made/i.test(reason)) {
    return `I need to pause here. You just indicated that something may not be true.${context} Which exact part was inaccurate, and what is the verified version I should use from your real experience?`;
  }

  if (/ownership|personally/i.test(reason)) {
    return `I want to clarify ownership.${context} Earlier the answer sounded like you personally handled it, but now you're reducing your role. What exactly did you personally do, and what was done by the team or someone else?`;
  }

  return `I need to clarify a possible inconsistency.${context} Can you reconcile the earlier claim with what you just said and tell me the accurate version?`;
}


export function updateRecruiterMemoryV2(
  memory: Partial<RecruiterMemoryV2> | unknown | undefined,
  answer: string,
  setup: RecruiterIntelligenceSetup = {},
): RecruiterMemoryV2 {
  const current = createRecruiterMemoryV2(memory);
  const contradictions = detectContradictions(answer, current);
  const weakReasons = detectWeakAnswerReasons(answer);
  const evidenceRequest = buildEvidenceRequest(answer, setup);
  const claims = extractClaimSummary(answer);
  const unsupportedClaims = claims.filter((claim) => !isClaimSupported(claim, setup));

  const trustDelta =
    contradictions.length > 0 || unsupportedClaims.length > 0
      ? -14
      : weakReasons.length >= 3
        ? -8
        : weakReasons.length > 0
          ? -4
          : hasMetric(answer) && hasOwnership(answer) && hasOutcome(answer)
            ? 10
            : 3;

  const trustReason =
    contradictions[0] ||
    unsupportedClaims[0] ||
    weakReasons[0] ||
    (trustDelta > 0 ? "Answer provided clearer ownership, evidence, or outcome." : "Answer needs more support.");

  return {
    companies: unique([...current.companies, ...extractCompanies(answer)], 30),
    roles: unique([...current.roles, ...extractRoles(answer)], 30),
    skills: unique([...current.skills, ...extractSkills(answer)], 40),
    projects: unique([...current.projects, ...extractProjects(answer)], 25),
    metrics: unique([...current.metrics, ...extractMetrics(answer)], 25),
    claims: unique([...current.claims, ...claims], 40),
    contradictions: unique([...contradictions, ...current.contradictions], 20),
    evidenceRequests: unique([evidenceRequest, ...current.evidenceRequests].filter(Boolean), 20),
    weakAnswerReasons: unique([...weakReasons, ...current.weakAnswerReasons], 30),
    trustEvents: [
      { delta: trustDelta, reason: trustReason },
      ...current.trustEvents,
    ].slice(0, 30),
    nextProbeTopic: nextProbeTopic(current, answer),
  };
}

export function decideRecruiterResponseV2(input: {
  answer: string;
  currentQuestion?: string;
  transcript?: TranscriptItem[];
  setup?: RecruiterIntelligenceSetup;
  memory?: unknown;
  trust?: number;
  interest?: number;
}): RecruiterDecisionV2 {
  const answer = text(input.answer);
  const setup = input.setup || {};
  const transcriptMemory = buildRecruiterMemoryFromTranscript(input.transcript, setup);
  const previousMemory = mergeRecruiterMemoryV2(transcriptMemory, input.memory);
  const memory = updateRecruiterMemoryV2(previousMemory, answer, setup);

  const contradictions = detectContradictions(answer, previousMemory);
  const weakReasons = detectWeakAnswerReasons(answer);
  const evidenceRequest = buildEvidenceRequest(answer, setup);
  const unsupportedClaims = extractClaimSummary(answer).filter((claim) => !isClaimSupported(claim, setup));

  let reply = "";
  let concern = "";
  let trustDelta = 0;
  let interestDelta = 0;
  let evidenceRequested = false;
  let projectDeepDive = false;

  if (contradictions.length) {
    concern = contradictions[0];
    reply = contradictionClarifyingQuestion(contradictions[0], previousMemory);
    trustDelta = -18;
    interestDelta = -6;
  } else if (unsupportedClaims.length) {
    concern = `Unsupported claim: ${unsupportedClaims[0]}`;
    reply = `I need to verify that. ${unsupportedClaims[0]} is not clearly supported by your CV or job context. Was this official work, freelance work, a project, or a transferable example?`;
    trustDelta = -10;
    interestDelta = -3;
    evidenceRequested = true;
  } else if (evidenceRequest) {
    concern = weakReasons[0] || "Needs stronger evidence.";
    reply = evidenceRequest;
    trustDelta = weakReasons.length >= 3 ? -8 : -4;
    interestDelta = -1;
    evidenceRequested = true;
  } else {
    const projectQuestion = chooseProjectDeepDive(answer, setup, previousMemory);
    if (projectQuestion) {
      reply = projectQuestion;
      concern = "Going deeper into project evidence.";
      trustDelta = 4;
      interestDelta = 5;
      projectDeepDive = true;
    } else {
      reply = "That is clearer. Now take me one level deeper: what was the hardest decision you personally made, and what was the result?";
      concern = "Testing decision quality and depth.";
      trustDelta = 5;
      interestDelta = 4;
    }
  }

  return {
    reply: localize(setup, reply),
    memory,
    trustDelta,
    interestDelta,
    concern,
    weakAnswer: weakReasons.length > 0,
    contradictionDetected: contradictions.length > 0,
    evidenceRequested,
    projectDeepDive,
  };
}

export function buildAdvancedReportV2(input: {
  transcript?: TranscriptItem[];
  memory?: unknown;
  setup?: RecruiterIntelligenceSetup;
}) {
  const transcript = Array.isArray(input.transcript) ? input.transcript : [];
  const candidateAnswers = transcript
    .filter((item) => item.role === "candidate")
    .map((item) => text(item.text))
    .filter(Boolean);

  let memory = createRecruiterMemoryV2(input.memory);

  for (const answer of candidateAnswers) {
    memory = updateRecruiterMemoryV2(memory, answer, input.setup || {});
  }

  const trustScore = Math.max(
    0,
    Math.min(100, 72 + memory.trustEvents.reduce((sum, item) => sum + item.delta, 0)),
  );

  const weakAnswerCount = candidateAnswers.filter((answer) => detectWeakAnswerReasons(answer).length > 0).length;
  const evidenceScore = Math.max(0, Math.min(100, 100 - weakAnswerCount * 12 - memory.evidenceRequests.length * 4));
  const contradictionRisk = Math.max(0, Math.min(100, memory.contradictions.length * 25));

  return {
    trustScore,
    evidenceQuality: evidenceScore,
    contradictionRisk,
    contradictions: memory.contradictions.length ? memory.contradictions : ["No major contradictions detected."],
    evidenceRequests: memory.evidenceRequests.length ? memory.evidenceRequests : ["Add one measurable proof point to your strongest answer."],
    weakAnswers: candidateAnswers
      .map((answer, index) => ({
        answer,
        question: `Candidate answer ${index + 1}`,
        reasons: detectWeakAnswerReasons(answer),
      }))
      .filter((item) => item.reasons.length > 0)
      .slice(0, 5)
      .map((item) => ({
        question: item.question,
        answer: item.answer,
        reason: item.reasons.join(" "),
        betterAnswer:
          "Use a specific situation, explain your personal action, add one metric or proof point, and close with the outcome.",
      })),
    memory,
  };
}

export function enhanceWorkZoDecisionV2(input: {
  answer?: string;
  currentQuestion?: string;
  transcript?: TranscriptItem[];
  setup?: RecruiterIntelligenceSetup;
  memory?: unknown;
  recruiterMemory?: unknown;
  recruiterTrust?: number;
  recruiterInterest?: number;
  currentTrust?: number;
  currentInterest?: number;
  currentState?: string | null;
  recruiterState?: string | null;
  decision?: Record<string, unknown>;
  baseDecision?: Record<string, unknown>;
}): any {
  const base = input.decision || input.baseDecision || {};
  const enhanced = decideRecruiterResponseV2({
    answer: input.answer || "",
    currentQuestion: input.currentQuestion,
    transcript: input.transcript,
    setup: input.setup,
    memory: input.memory || input.recruiterMemory,
    trust: input.currentTrust ?? input.recruiterTrust,
    interest: input.currentInterest ?? input.recruiterInterest,
  });

  const spokenReply =
    enhanced.reply ||
    (typeof base.spokenReply === "string" ? base.spokenReply : "") ||
    (typeof base.reply === "string" ? base.reply : "") ||
    (typeof base.question === "string" ? base.question : "");

  const displayQuestion =
    (typeof base.displayQuestion === "string" ? base.displayQuestion : "") ||
    spokenReply;

  return {
    ...base,
    ...enhanced,
    reply: spokenReply,
    question: spokenReply,
    spokenReply,
    displayQuestion,
    feedback:
      typeof base.feedback === "string"
        ? base.feedback
        : enhanced.concern || "Follow-up generated from recruiter intelligence.",
    intent:
      typeof base.intent === "string"
        ? base.intent
        : enhanced.contradictionDetected
          ? "contradiction_check"
          : enhanced.evidenceRequested
            ? "evidence_request"
            : enhanced.projectDeepDive
              ? "project_deep_dive"
              : enhanced.weakAnswer
                ? "weak_answer_probe"
                : "adaptive_follow_up",
    recruiterState:
      typeof base.recruiterState === "string"
        ? base.recruiterState
        : enhanced.contradictionDetected
          ? "skeptical"
          : enhanced.evidenceRequested
            ? "probing"
            : enhanced.projectDeepDive
              ? "interested"
              : "engaged",
    shouldAdvanceQuestion:
      typeof base.shouldAdvanceQuestion === "boolean"
        ? base.shouldAdvanceQuestion
        : !(enhanced.evidenceRequested || enhanced.contradictionDetected),
    shouldCountAsAnswer:
      typeof base.shouldCountAsAnswer === "boolean"
        ? base.shouldCountAsAnswer
        : true,
    shouldStayOnCurrentQuestion:
      typeof base.shouldStayOnCurrentQuestion === "boolean"
        ? base.shouldStayOnCurrentQuestion
        : enhanced.evidenceRequested || enhanced.contradictionDetected,
    correction:
      typeof base.correction === "string"
        ? base.correction
        : enhanced.contradictionDetected
          ? enhanced.concern
          : "",
    psychology:
      base.psychology ||
      {
        trustDelta: enhanced.trustDelta,
        interestDelta: enhanced.interestDelta,
        state: enhanced.contradictionDetected
          ? "skeptical"
          : enhanced.evidenceRequested
            ? "probing"
            : enhanced.projectDeepDive
              ? "interested"
              : "engaged",
      },
    cvRead:
      base.cvRead ||
      {
        hasCvContext: Boolean(input.setup?.cvText),
        hasJobContext: Boolean(input.setup?.jobDescription),
        memoryCompanies: enhanced.memory.companies,
        memoryRoles: enhanced.memory.roles,
        memorySkills: enhanced.memory.skills,
      },
    evidence:
      base.evidence ||
      {
        requested: enhanced.evidenceRequested,
        requests: enhanced.memory.evidenceRequests,
      },
    contradiction:
      base.contradiction ||
      {
        detected: enhanced.contradictionDetected,
        items: enhanced.memory.contradictions,
      },
    weakAnswerReasons: enhanced.memory.weakAnswerReasons,
    advancedMemory: enhanced.memory,
    recruiterMemoryV2: enhanced.memory,
    memoryV2: enhanced.memory,
    memory: enhanced.memory,
    trustDelta: enhanced.trustDelta,
    interestDelta: enhanced.interestDelta,
    concern: enhanced.concern,
    weakAnswer: enhanced.weakAnswer,
    contradictionDetected: enhanced.contradictionDetected,
    evidenceRequested: enhanced.evidenceRequested,
    projectDeepDive: enhanced.projectDeepDive,
  };
}

export function buildWorkZoRecruiterReplyV2(input: {
  answer?: string;
  currentQuestion?: string;
  transcript?: TranscriptItem[];
  setup?: RecruiterIntelligenceSetup;
  memory?: unknown;
  recruiterMemory?: unknown;
  trust?: number;
  interest?: number;
  recruiterTrust?: number;
  recruiterInterest?: number;
  currentTrust?: number;
  currentInterest?: number;
  currentState?: string | null;
  recruiterState?: string | null;
}): any {
  const decision = decideRecruiterResponseV2({
    answer: input.answer || "",
    currentQuestion: input.currentQuestion,
    transcript: input.transcript,
    setup: input.setup,
    memory: input.memory || input.recruiterMemory,
    trust: input.trust ?? input.currentTrust ?? input.recruiterTrust,
    interest: input.interest ?? input.currentInterest ?? input.recruiterInterest,
  });

  return {
    shouldOverride: true,
    spokenReply: decision.reply,
    privateInstruction: decision.concern,
    reply: decision.reply,
    question: decision.reply,
    text: decision.reply,
    correction: decision.contradictionDetected ? decision.concern : "",
    psychology: {
      trustDelta: decision.trustDelta,
      interestDelta: decision.interestDelta,
      state: decision.contradictionDetected
        ? "skeptical"
        : decision.evidenceRequested
          ? "probing"
          : decision.projectDeepDive
            ? "interested"
            : "engaged",
    },
    cvRead: {
      hasCvContext: Boolean(input.setup?.cvText),
      hasJobContext: Boolean(input.setup?.jobDescription),
      memoryCompanies: decision.memory.companies,
      memoryRoles: decision.memory.roles,
      memorySkills: decision.memory.skills,
    },
    evidence: {
      requested: decision.evidenceRequested,
      requests: decision.memory.evidenceRequests,
    },
    contradiction: {
      detected: decision.contradictionDetected,
      items: decision.memory.contradictions,
    },
    weakAnswerReasons: decision.memory.weakAnswerReasons,
    advancedMemory: decision.memory,
    memory: decision.memory,
    recruiterMemoryV2: decision.memory,
    memoryV2: decision.memory,
    trustDelta: decision.trustDelta,
    interestDelta: decision.interestDelta,
    concern: decision.concern,
    weakAnswer: decision.weakAnswer,
    contradictionDetected: decision.contradictionDetected,
    evidenceRequested: decision.evidenceRequested,
    projectDeepDive: decision.projectDeepDive,
  };
}

