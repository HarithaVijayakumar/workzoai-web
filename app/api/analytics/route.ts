import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyticsEvent = {
  event?: string;
  sessionId?: string;
  setupId?: string;
  role?: string;
  market?: string;
  recruiter?: string;
  mode?: string;
  score?: number;
  trust?: number;
  pressure?: number;
  path?: string;
  host?: string;
  origin?: string;
  isLocal?: boolean;
  userAgent?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
};

const ANALYTICS_DIR = path.join(process.cwd(), ".workzo");
const ANALYTICS_FILE = path.join(ANALYTICS_DIR, "analytics.jsonl");

function isLocalAnalyticsEvent(event: Partial<AnalyticsEvent>) {
  const host = String(event.host || event.origin || "").toLowerCase();

  return (
    event.isLocal === true ||
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("192.168.") ||
    host.includes("10.0.") ||
    host.includes(".local")
  );
}

async function ensureFile() {
  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
  try {
    await fs.access(ANALYTICS_FILE);
  } catch {
    await fs.writeFile(ANALYTICS_FILE, "", "utf-8");
  }
}

function cleanEvent(input: AnalyticsEvent) {
  return {
    event: String(input.event || "unknown").slice(0, 80),
    sessionId: String(input.sessionId || "").slice(0, 120),
    setupId: String(input.setupId || "").slice(0, 120),
    role: String(input.role || "").slice(0, 160),
    market: String(input.market || "").slice(0, 80),
    recruiter: String(input.recruiter || "").slice(0, 80),
    mode: String(input.mode || "").slice(0, 20),
    score: typeof input.score === "number" ? input.score : null,
    trust: typeof input.trust === "number" ? input.trust : null,
    pressure: typeof input.pressure === "number" ? input.pressure : null,
    path: String(input.path || "").slice(0, 200),
    host: String(input.host || "").slice(0, 200),
    origin: String(input.origin || "").slice(0, 250),
    isLocal: Boolean(input.isLocal),
    userAgent: String(input.userAgent || "").slice(0, 400),
    metadata: input.metadata || {},
    timestamp: input.timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  };
}

async function readEvents() {
  await ensureFile();
  const content = await fs.readFile(ANALYTICS_FILE, "utf-8");

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as ReturnType<typeof cleanEvent>;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((event) => {
      if (!event) return false;

      return !isLocalAnalyticsEvent({
        host: event.host,
        origin: event.origin,
        isLocal: event.isLocal,
      });
    })
    .slice(-1200) as Array<ReturnType<typeof cleanEvent>>;
}

function summarize(events: Array<ReturnType<typeof cleanEvent>>) {
  const counts: Record<string, number> = {};
  const sessions = new Set<string>();
  const recruiters: Record<string, number> = {};
  const roles: Record<string, number> = {};

  for (const event of events) {
    counts[event.event] = (counts[event.event] || 0) + 1;
    if (event.sessionId) sessions.add(event.sessionId);
    if (event.recruiter) recruiters[event.recruiter] = (recruiters[event.recruiter] || 0) + 1;
    if (event.role) roles[event.role] = (roles[event.role] || 0) + 1;
  }

  const started = counts.interview_started || 0;
  const answered = counts.answer_submitted || 0;
  const results = counts.results_viewed || 0;

  return {
    totalEvents: events.length,
    uniqueSessions: sessions.size,
    uploads: counts.cv_uploaded || 0,
    interviewsStarted: started,
    answersSubmitted: answered,
    voiceStarts: counts.voice_started || 0,
    resultsViewed: results,
    answerRate: started ? Math.round((answered / started) * 100) : 0,
    resultRate: started ? Math.round((results / started) * 100) : 0,
    counts,
    recruiters,
    roles,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnalyticsEvent;

    if (isLocalAnalyticsEvent(body)) {
      return NextResponse.json({ ok: true, ignored: "local-development-event" });
    }

    const event = cleanEvent(body);

    await ensureFile();
    await fs.appendFile(ANALYTICS_FILE, JSON.stringify(event) + "\n", "utf-8");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  const events = await readEvents();

  return NextResponse.json({
    summary: summarize(events),
    events: events.slice(-250).reverse(),
  });
}
