export type WorkZoInterviewHistoryItem = {
  id: string;
  setupId: string;
  targetRole: string;
  targetMarket: string;
  companyStyle?: string;
  recruiterId: string;
  recruiterName: string;
  mode: string;
  durationSeconds: number;
  answeredQuestionCount: number;
  recruiterTrust: number;
  hiringSignal: number;
  strongestMoment?: string;
  weakestMoment?: string;
  topRisk?: string;
  completedAt: string;
  createdAt: string;
};

export type WorkZoInterviewHistoryStore = {
  version: 1;
  updatedAt: string;
  items: WorkZoInterviewHistoryItem[];
};

const HISTORY_KEY = "workzo-interview-history-v1";
const MAX_HISTORY_ITEMS = 30;

function clampScore(value: unknown, fallback = 0) {
  const score = Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function buildId(payload: {
  setupId?: unknown;
  completedAt?: unknown;
  recruiterName?: unknown;
  targetRole?: unknown;
}) {
  const setupId = cleanText(payload.setupId, "local-session");
  const completedAt = cleanText(payload.completedAt, new Date().toISOString());
  const recruiterName = cleanText(payload.recruiterName, "recruiter");
  const targetRole = cleanText(payload.targetRole, "role");

  return `${setupId}::${targetRole}::${recruiterName}::${completedAt}`
    .toLowerCase()
    .replace(/[^a-z0-9:._-]+/g, "-")
    .slice(0, 220);
}

export function readInterviewHistory(): WorkZoInterviewHistoryStore {
  if (typeof window === "undefined") {
    return { version: 1, updatedAt: "", items: [] };
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return { version: 1, updatedAt: "", items: [] };

    const parsed = JSON.parse(raw) as Partial<WorkZoInterviewHistoryStore>;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, updatedAt: "", items: [] };
    }

    return {
      version: 1,
      updatedAt: cleanText(parsed.updatedAt, ""),
      items: parsed.items
        .filter((item) => item && typeof item === "object")
        .slice(0, MAX_HISTORY_ITEMS),
    };
  } catch {
    return { version: 1, updatedAt: "", items: [] };
  }
}

export function saveInterviewHistory(store: WorkZoInterviewHistoryStore) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        items: store.items.slice(0, MAX_HISTORY_ITEMS),
      }),
    );
  } catch {
    // Browser storage can fail in private mode or low-storage environments.
  }
}

export function saveCompletedInterviewHistory(payload: {
  setupId?: unknown;
  targetRole?: unknown;
  targetMarket?: unknown;
  companyStyle?: unknown;
  recruiterId?: unknown;
  recruiterName?: unknown;
  mode?: unknown;
  durationSeconds?: unknown;
  answeredQuestionCount?: unknown;
  recruiterTrust?: unknown;
  scores?: Record<string, unknown>;
  memory?: {
    rememberedStrengths?: unknown[];
    rememberedWeaknesses?: unknown[];
    openDoubts?: unknown[];
    weakMetrics?: unknown;
    ownershipIssues?: unknown;
    vagueAnswers?: unknown;
    strongRecoveries?: unknown;
  };
  completedAt?: unknown;
}) {
  const completedAt = cleanText(payload.completedAt, new Date().toISOString());
  const recruiterTrust = clampScore(payload.recruiterTrust, 0);
  const scores = payload.scores || {};
  const memory = payload.memory || {};

  const strengths = Array.isArray(memory.rememberedStrengths)
    ? memory.rememberedStrengths.map((item) => cleanText(item)).filter(Boolean)
    : [];

  const weaknesses = Array.isArray(memory.rememberedWeaknesses)
    ? memory.rememberedWeaknesses.map((item) => cleanText(item)).filter(Boolean)
    : [];

  const item: WorkZoInterviewHistoryItem = {
    id: buildId(payload),
    setupId: cleanText(payload.setupId, "local-session"),
    targetRole: cleanText(payload.targetRole, "Target Role"),
    targetMarket: cleanText(payload.targetMarket, "Global"),
    companyStyle: cleanText(payload.companyStyle, "Realistic"),
    recruiterId: cleanText(payload.recruiterId, "recruiter"),
    recruiterName: cleanText(payload.recruiterName, "Recruiter"),
    mode: cleanText(payload.mode, "voice"),
    durationSeconds: Math.max(0, Math.round(Number(payload.durationSeconds) || 0)),
    answeredQuestionCount: Math.max(
      0,
      Math.round(Number(payload.answeredQuestionCount) || 0),
    ),
    recruiterTrust,
    hiringSignal: clampScore(scores.hiringSignal ?? scores.recruiterTrust, recruiterTrust),
    strongestMoment: strengths[0] || undefined,
    weakestMoment: weaknesses[0] || undefined,
    topRisk:
      Number(memory.weakMetrics || 0) > Number(memory.ownershipIssues || 0)
        ? "Impact evidence needs stronger metrics."
        : Number(memory.ownershipIssues || 0) > 0
          ? "Ownership clarity needs improvement."
          : Number(memory.vagueAnswers || 0) > 0
            ? "Some answers were still too broad."
            : undefined,
    completedAt,
    createdAt: completedAt,
  };

  const current = readInterviewHistory();
  const withoutDuplicate = current.items.filter((existing) => existing.id !== item.id);
  const nextItems = [item, ...withoutDuplicate]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, MAX_HISTORY_ITEMS);

  const nextStore: WorkZoInterviewHistoryStore = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items: nextItems,
  };

  saveInterviewHistory(nextStore);
  return item;
}

export function getLatestInterviewHistoryItem() {
  return readInterviewHistory().items[0] || null;
}

export function clearInterviewHistory() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {}
}
