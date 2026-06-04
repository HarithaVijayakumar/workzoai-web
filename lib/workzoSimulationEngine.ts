export type WorkZoSimulationProbe = {
  id: string;
  phase:
    | "introduction"
    | "cv_fact_check"
    | "project_deep_dive"
    | "jd_match"
    | "behavioral_pressure"
    | "closing";
  triggerKeywords: string[];
  question: string;
  evaluatesFor: string[];
  redFlags: string[];
};

export type WorkZoSimulationPlaybook = {
  targetRole: string;
  language: string;
  probes: WorkZoSimulationProbe[];
  pressureAnchors: WorkZoSimulationProbe[];
};

function clean(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function includesAny(source: string, words: string[]) {
  const lower = source.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

function unique(values: string[], limit = 10) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values.map(clean).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= limit) break;
  }

  return out;
}

export function buildWorkZoSimulationPlaybook(input: {
  cvText?: string;
  jobDescription?: string;
  targetRole?: string;
  language?: string;
}): WorkZoSimulationPlaybook {
  const cv = clean(input.cvText);
  const jd = clean(input.jobDescription);
  const source = `${cv}\n${jd}`;
  const targetRole = clean(input.targetRole) || "this role";
  const language = clean(input.language) || "English";

  const probes: WorkZoSimulationProbe[] = [
    {
      id: "intro_role_bridge",
      phase: "introduction",
      triggerKeywords: ["background", "experience", "role"],
      question: `Walk me through your background and connect it directly to ${targetRole}.`,
      evaluatesFor: ["role relevance", "clarity", "motivation"],
      redFlags: ["generic summary", "no role connection", "unsupported claims"],
    },
  ];

  if (includesAny(source, ["SQL", "Python", "Tableau", "Power BI", "dashboard", "data analysis"])) {
    probes.push({
      id: "data_project_deep_dive",
      phase: "project_deep_dive",
      triggerKeywords: unique(["SQL", "Python", "Tableau", "Power BI", "dashboard", "analysis"]),
      question:
        "Choose one data-related project or work example. What was the data source, what analysis did you perform, and what decision did it support?",
      evaluatesFor: ["technical depth", "business context", "evidence"],
      redFlags: ["tool list only", "no data source", "no decision or result"],
    });
  }

  if (includesAny(source, ["GCP", "Cloud Functions", "API", "web scraping", "pipeline", "MySQL"])) {
    probes.push({
      id: "pipeline_scaling_probe",
      phase: "project_deep_dive",
      triggerKeywords: unique(["GCP", "Cloud Functions", "API", "web scraping", "pipeline", "MySQL"]),
      question:
        "Walk me through the pipeline design. How did you handle source data, errors, scheduling, storage, and validation?",
      evaluatesFor: ["system thinking", "failure handling", "ownership"],
      redFlags: ["cannot explain architecture", "no failure handling", "unclear ownership"],
    });
  }

  if (includesAny(source, ["customer", "support", "ticket", "escalation", "ServiceDesk", "ITIL", "ITSM"])) {
    probes.push({
      id: "support_case_probe",
      phase: "cv_fact_check",
      triggerKeywords: unique(["customer", "support", "ticket", "escalation", "ServiceDesk", "ITIL", "ITSM"]),
      question:
        "Give me one real support case. What was the issue, what troubleshooting path did you follow, when did you escalate, and what was the outcome?",
      evaluatesFor: ["support judgment", "communication", "outcome"],
      redFlags: ["no customer context", "no troubleshooting path", "no outcome"],
    });
  }

  const pressureAnchors: WorkZoSimulationProbe[] = [];

  if (includesAny(cv, ["career break", "maternity", "relocation", "gap"])) {
    pressureAnchors.push({
      id: "career_break_rampup",
      phase: "behavioral_pressure",
      triggerKeywords: ["career break", "relocation", "maternity", "gap"],
      question:
        "Your CV suggests a transition or break. How will you ramp up quickly and prove you are ready for the current pace of this role?",
      evaluatesFor: ["adaptability", "self-awareness", "learning plan"],
      redFlags: ["defensive answer", "no ramp-up plan", "no recent learning evidence"],
    });
  }

  const jdSignals = unique(
    (jd.match(/\b(customer|stakeholder|sql|python|crm|analytics|reporting|communication|ownership|support|sales|documentation|german|dutch|english)\b/gi) || []),
    12,
  );

  for (const signal of jdSignals.slice(0, 3)) {
    pressureAnchors.push({
      id: `jd_gap_${signal.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      phase: "jd_match",
      triggerKeywords: [signal],
      question: `The JD seems to value ${signal}. Give me one verified example that proves this, or tell me honestly how you would close the gap.`,
      evaluatesFor: ["JD match", "honesty", "evidence"],
      redFlags: ["claims without evidence", "overconfidence", "no learning plan"],
    });
  }

  probes.push({
    id: "closing_verified_pitch",
    phase: "closing",
    triggerKeywords: ["closing", "why you"],
    question: `Why should we choose you for ${targetRole}? Use only verified experience and one clear result.`,
    evaluatesFor: ["positioning", "evidence", "confidence"],
    redFlags: ["generic pitch", "unsupported claims", "no result"],
  });

  return {
    targetRole,
    language,
    probes,
    pressureAnchors,
  };
}
