export type RecruiterMemoryProfile = {
  candidateName: string;
  location: string;
  targetRole: string;
  summary: string[];
  skills: {
    technical: string[];
    business: string[];
    tools: string[];
  };
  experience: Array<{
    company: string;
    role: string;
    dates: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    summary: string;
  }>;
  education: string[];
  languages: string[];
  recruiterMemory: string[];
  possibleConcerns: string[];
};

export type JobMemoryProfile = {
  roleTitle: string;
  businessContext: string;
  responsibilities: string[];
  requiredSkills: string[];
  softSkills: string[];
  interviewFocus: string[];
};

export type WorkZoInterviewSetup = {
  cvText: string;
  jobDescription: string;
  targetRole: string;
  targetMarket: string;
  companyStyle: string;
  recruiterPersonality: string;
  language: string;
  recruiterMemoryProfile: RecruiterMemoryProfile | null;
  jobMemoryProfile: JobMemoryProfile | null;
  source: "latest-upload" | "manual" | "unknown";
  setupVersion: number;
  setupId: string;
  updatedAt: string;
};

const CANONICAL_SETUP_KEY = "workzo-interview-setup-v4";

const LEGACY_SETUP_KEYS = [
  "workzo-interview-setup-v3",
  "workzo-interview-setup-v2",
  "workzo-interview-setup",
  "workzo_setup",
  "workzo-onboarding",
  "workzo_onboarding",
];

const EMPTY_RECRUITER_MEMORY_PROFILE: RecruiterMemoryProfile = {
  candidateName: "",
  location: "",
  targetRole: "",
  summary: [],
  skills: {
    technical: [],
    business: [],
    tools: [],
  },
  experience: [],
  projects: [],
  education: [],
  languages: [],
  recruiterMemory: [],
  possibleConcerns: [],
};

const EMPTY_JOB_MEMORY_PROFILE: JobMemoryProfile = {
  roleTitle: "",
  businessContext: "",
  responsibilities: [],
  requiredSkills: [],
  softSkills: [],
  interviewFocus: [],
};

const DEFAULT_SETUP: WorkZoInterviewSetup = {
  cvText: "",
  jobDescription: "",
  targetRole: "General Role",
  targetMarket: "Global",
  companyStyle: "Realistic",
  recruiterPersonality: "analytical_hiring_manager",
  language: "English",
  recruiterMemoryProfile: null,
  jobMemoryProfile: null,
  source: "unknown",
  setupVersion: 4,
  setupId: "",
  updatedAt: "",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createSetupId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `setup_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanArray(value: unknown, limit = 12) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, limit);
}

function safeParse(value: string | null) {
  if (!value) return null;

  try {
    return JSON.parse(value) as Partial<WorkZoInterviewSetup> & {
      country?: string;
      recruiterStyle?: string;
      cvProfile?: unknown;
      jobProfile?: unknown;
      structuredCv?: unknown;
      structuredJob?: unknown;
    };
  } catch {
    return null;
  }
}

function normalizeRecruiterMemoryProfile(input: unknown): RecruiterMemoryProfile | null {
  if (!input || typeof input !== "object") return null;

  const profile = input as Partial<RecruiterMemoryProfile>;

  return {
    candidateName: cleanText(profile.candidateName),
    location: cleanText(profile.location),
    targetRole: cleanText(profile.targetRole),
    summary: cleanArray(profile.summary, 8),
    skills: {
      technical: cleanArray(profile.skills?.technical, 18),
      business: cleanArray(profile.skills?.business, 18),
      tools: cleanArray(profile.skills?.tools, 18),
    },
    experience: Array.isArray(profile.experience)
      ? profile.experience
          .map((item) => ({
            company: cleanText(item.company),
            role: cleanText(item.role),
            dates: cleanText(item.dates),
            highlights: cleanArray(item.highlights, 8),
          }))
          .filter((item) => item.company || item.role || item.highlights.length)
          .slice(0, 8)
      : [],
    projects: Array.isArray(profile.projects)
      ? profile.projects
          .map((item) => ({
            name: cleanText(item.name),
            summary: cleanText(item.summary),
          }))
          .filter((item) => item.name || item.summary)
          .slice(0, 8)
      : [],
    education: cleanArray(profile.education, 8),
    languages: cleanArray(profile.languages, 8),
    recruiterMemory: cleanArray(profile.recruiterMemory, 12),
    possibleConcerns: cleanArray(profile.possibleConcerns, 8),
  };
}

function normalizeJobMemoryProfile(input: unknown): JobMemoryProfile | null {
  if (!input || typeof input !== "object") return null;

  const profile = input as Partial<JobMemoryProfile>;

  return {
    roleTitle: cleanText(profile.roleTitle),
    businessContext: cleanText(profile.businessContext),
    responsibilities: cleanArray(profile.responsibilities, 12),
    requiredSkills: cleanArray(profile.requiredSkills, 16),
    softSkills: cleanArray(profile.softSkills, 12),
    interviewFocus: cleanArray(profile.interviewFocus, 12),
  };
}

export function normalizeInterviewSetup(
  input?: Partial<WorkZoInterviewSetup> & {
    country?: string;
    recruiterStyle?: string;
    cvProfile?: unknown;
    jobProfile?: unknown;
    structuredCv?: unknown;
    structuredJob?: unknown;
  }
): WorkZoInterviewSetup {
  const now = new Date().toISOString();

  const recruiterMemoryProfile =
    normalizeRecruiterMemoryProfile(input?.recruiterMemoryProfile) ||
    normalizeRecruiterMemoryProfile(input?.cvProfile) ||
    normalizeRecruiterMemoryProfile(input?.structuredCv);

  const jobMemoryProfile =
    normalizeJobMemoryProfile(input?.jobMemoryProfile) ||
    normalizeJobMemoryProfile(input?.jobProfile) ||
    normalizeJobMemoryProfile(input?.structuredJob);

  return {
    cvText: cleanText(input?.cvText),
    jobDescription: cleanText(input?.jobDescription),
    targetRole: cleanText(input?.targetRole) || DEFAULT_SETUP.targetRole,
    targetMarket:
      cleanText(input?.targetMarket) ||
      cleanText(input?.country) ||
      DEFAULT_SETUP.targetMarket,
    companyStyle:
      cleanText(input?.companyStyle) ||
      cleanText(input?.recruiterStyle) ||
      DEFAULT_SETUP.companyStyle,
    recruiterPersonality:
      cleanText(input?.recruiterPersonality) ||
      DEFAULT_SETUP.recruiterPersonality,
    language: cleanText(input?.language) || DEFAULT_SETUP.language,
    recruiterMemoryProfile,
    jobMemoryProfile,
    source: input?.source || "latest-upload",
    setupVersion: 4,
    setupId: cleanText(input?.setupId) || createSetupId(),
    updatedAt: cleanText(input?.updatedAt) || now,
  };
}

export function saveLatestInterviewSetup(
  input: Partial<WorkZoInterviewSetup> & {
    country?: string;
    recruiterStyle?: string;
    cvProfile?: unknown;
    jobProfile?: unknown;
    structuredCv?: unknown;
    structuredJob?: unknown;
  }
) {
  const setup = normalizeInterviewSetup({
    ...input,
    source: input.source || "latest-upload",
    setupId: input.setupId || createSetupId(),
    updatedAt: new Date().toISOString(),
  });

  if (!canUseStorage()) return setup;

  try {
    window.localStorage.setItem(CANONICAL_SETUP_KEY, JSON.stringify(setup));

    for (const key of LEGACY_SETUP_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage may be blocked in private mode.
  }

  return setup;
}

export function readLatestInterviewSetup() {
  if (!canUseStorage()) return DEFAULT_SETUP;

  const canonical = safeParse(window.localStorage.getItem(CANONICAL_SETUP_KEY));

  if (canonical) {
    return normalizeInterviewSetup(canonical);
  }

  for (const key of LEGACY_SETUP_KEYS) {
    const parsed = safeParse(window.localStorage.getItem(key));

    if (parsed?.cvText || parsed?.jobDescription || parsed?.targetRole) {
      return saveLatestInterviewSetup({
        ...parsed,
        recruiterMemoryProfile: normalizeRecruiterMemoryProfile(
          parsed.recruiterMemoryProfile ||
            parsed.cvProfile ||
            parsed.structuredCv
        ),
        jobMemoryProfile: normalizeJobMemoryProfile(
          parsed.jobMemoryProfile ||
            parsed.jobProfile ||
            parsed.structuredJob
        ),
        source: "latest-upload",
      });
    }
  }

  return DEFAULT_SETUP;
}

export function clearAllInterviewSetup() {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(CANONICAL_SETUP_KEY);

    for (const key of LEGACY_SETUP_KEYS) {
      window.localStorage.removeItem(key);
    }

    window.localStorage.removeItem("workzo-last-results");
  } catch {
    // Ignore storage errors.
  }
}

export function getInterviewSetupDebugInfo() {
  if (!canUseStorage()) return [];

  const keys = [CANONICAL_SETUP_KEY, ...LEGACY_SETUP_KEYS];

  return keys.map((key) => {
    const parsed = safeParse(window.localStorage.getItem(key));
    const normalized = parsed ? normalizeInterviewSetup(parsed) : null;

    return {
      key,
      exists: Boolean(parsed),
      setupId: normalized?.setupId || "",
      updatedAt: normalized?.updatedAt || "",
      setupVersion: normalized?.setupVersion || 0,
      cvChars: normalized?.cvText?.length || 0,
      jdChars: normalized?.jobDescription?.length || 0,
      hasRecruiterMemoryProfile: Boolean(normalized?.recruiterMemoryProfile),
      hasJobMemoryProfile: Boolean(normalized?.jobMemoryProfile),
      candidateName: normalized?.recruiterMemoryProfile?.candidateName || "",
      targetRole: normalized?.targetRole || "",
      targetMarket: normalized?.targetMarket || "",
      cvPreview: normalized?.cvText?.slice(0, 180) || "",
      jdPreview: normalized?.jobDescription?.slice(0, 180) || "",
    };
  });
}

export function getCanonicalSetupKey() {
  return CANONICAL_SETUP_KEY;
}

export function buildRecruiterMemoryPrompt(setup: WorkZoInterviewSetup) {
  const profile = setup.recruiterMemoryProfile || EMPTY_RECRUITER_MEMORY_PROFILE;
  const job = setup.jobMemoryProfile || EMPTY_JOB_MEMORY_PROFILE;

  return `
RECRUITER MEMORY PROFILE:
Name: ${profile.candidateName || "Unknown"}
Location: ${profile.location || "Unknown"}
Target role: ${setup.targetRole || profile.targetRole || "Unknown"}

Candidate summary:
${profile.summary.length ? profile.summary.map((item) => `- ${item}`).join("\n") : "- No clean summary available."}

Technical skills:
${profile.skills.technical.length ? profile.skills.technical.join(", ") : "Unknown"}

Business/support skills:
${profile.skills.business.length ? profile.skills.business.join(", ") : "Unknown"}

Tools:
${profile.skills.tools.length ? profile.skills.tools.join(", ") : "Unknown"}

Experience:
${
  profile.experience.length
    ? profile.experience
        .map(
          (item) =>
            `- ${item.role || "Role"} at ${item.company || "Company"} ${item.dates ? `(${item.dates})` : ""}: ${item.highlights.join(" | ")}`
        )
        .join("\n")
    : "- No structured experience available."
}

Projects:
${
  profile.projects.length
    ? profile.projects.map((item) => `- ${item.name}: ${item.summary}`).join("\n")
    : "- No structured projects available."
}

Education:
${profile.education.length ? profile.education.map((item) => `- ${item}`).join("\n") : "- Unknown"}

Languages:
${profile.languages.length ? profile.languages.join(", ") : "Unknown"}

Important recruiter memory:
${
  profile.recruiterMemory.length
    ? profile.recruiterMemory.map((item) => `- ${item}`).join("\n")
    : "- No recruiter memory facts available."
}

Possible concerns:
${
  profile.possibleConcerns.length
    ? profile.possibleConcerns.map((item) => `- ${item}`).join("\n")
    : "- None identified yet."
}

JOB MEMORY PROFILE:
Role title: ${job.roleTitle || setup.targetRole || "Unknown"}
Business context: ${job.businessContext || "Unknown"}

Responsibilities:
${job.responsibilities.length ? job.responsibilities.map((item) => `- ${item}`).join("\n") : "- Unknown"}

Required skills:
${job.requiredSkills.length ? job.requiredSkills.join(", ") : "Unknown"}

Soft skills:
${job.softSkills.length ? job.softSkills.join(", ") : "Unknown"}

Interview focus:
${job.interviewFocus.length ? job.interviewFocus.map((item) => `- ${item}`).join("\n") : "- Ask role-specific follow-ups."}
`.trim();
}
