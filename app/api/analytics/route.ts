import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RawAnalyticsEvent = Record<string, unknown>;

type NormalizedAnalyticsEvent = {
  event: string;
  sessionId: string;
  role: string;
  market: string;
  recruiter: string;
  mode: string;
  score: number | null;
  trust: number | null;
  pressure: number | null;
  path: string;
  timestamp: string;
  receivedAt: string;
  source: string;
  device: "mobile" | "desktop" | "tablet" | "unknown";
  isMobile: boolean;
  metadata: Record<string, unknown>;
};

const LOCAL_DATA_DIR = path.join(process.cwd(), ".workzo-data");
const TMP_DATA_DIR = path.join(os.tmpdir(), "workzo-data");
const DATA_FILE_NAME = "analytics-events.jsonl";
const SUPABASE_TABLE = process.env.WORKZO_ANALYTICS_TABLE || "workzo_analytics_events";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

declare global {
  // eslint-disable-next-line no-var
  var __WORKZO_ANALYTICS_EVENTS__: NormalizedAnalyticsEvent[] | undefined;
}

function memoryEvents() {
  globalThis.__WORKZO_ANALYTICS_EVENTS__ ||= [];
  return globalThis.__WORKZO_ANALYTICS_EVENTS__;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function candidateFiles() {
  return [
    path.join(LOCAL_DATA_DIR, DATA_FILE_NAME),
    path.join(TMP_DATA_DIR, DATA_FILE_NAME),
  ];
}

function supabaseEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

function supabaseRestUrl(query = "") {
  const base = SUPABASE_URL.replace(/\/$/, "");
  return `${base}/rest/v1/${SUPABASE_TABLE}${query}`;
}

async function supabaseRequest(pathQuery: string, init: RequestInit) {
  if (!supabaseEnabled()) return null;

  const response = await fetch(supabaseRestUrl(pathQuery), {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Supabase analytics request failed: ${response.status} ${text}`);
  }

  return response;
}

async function readSupabaseEvents(): Promise<RawAnalyticsEvent[]> {
  if (!supabaseEnabled()) return [];

  try {
    const response = await fetch(
      supabaseRestUrl("?select=payload,received_at&order=received_at.desc&limit=1500"),
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) return [];

    const rows = (await response.json()) as Array<{ payload?: RawAnalyticsEvent; received_at?: string }>;
    return rows
      .map((row) => ({ ...(row.payload || {}), receivedAt: row.received_at || (row.payload || {}).receivedAt }))
      .filter(Boolean);
  } catch (error) {
    console.warn("Supabase analytics read failed, falling back to local analytics.", error);
    return [];
  }
}

async function writeSupabaseEvents(events: RawAnalyticsEvent[]) {
  if (!supabaseEnabled() || !events.length) return false;

  try {
    const rows = events.map((event) => ({
      session_id: asString(event.sessionId, "unknown_session"),
      event: asString(event.event, "unknown_event"),
      path: asString(event.path, "/"),
      source: asString(event.source, "Direct / unknown"),
      device: detectDevice(event),
      recruiter: asString(event.recruiter, "Unknown recruiter"),
      role: asString(event.role, "Unknown role"),
      mode: asString(event.mode, "standard"),
      trust: asNumber(event.trust),
      pressure: asNumber(event.pressure),
      score: asNumber(event.score),
      timestamp: asString(event.timestamp, new Date().toISOString()),
      received_at: asString(event.receivedAt, new Date().toISOString()),
      payload: event,
    }));

    await supabaseRequest("", { method: "POST", body: JSON.stringify(rows) });
    return true;
  } catch (error) {
    console.warn("Supabase analytics write failed, using local fallback.", error);
    return false;
  }
}

async function readJsonl(filePath: string): Promise<RawAnalyticsEvent[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as RawAnalyticsEvent;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as RawAnalyticsEvent[];
  } catch {
    return [];
  }
}

async function appendJsonl(events: RawAnalyticsEvent[]) {
  if (!events.length) return;
  const lines = events.map((event) => JSON.stringify(event)).join("\n") + "\n";

  for (const dir of [LOCAL_DATA_DIR, TMP_DATA_DIR]) {
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, DATA_FILE_NAME), lines, { flag: "a" });
      return;
    } catch {
      // Try next writable location.
    }
  }
}

function detectTrafficSource(event: RawAnalyticsEvent) {
  const metadata = asRecord(event.metadata);
  const explicit = asString(metadata.source || metadata.trafficSource || event.source);
  if (explicit) return explicit;

  const url = `${asString(event.path)} ${asString(event.referrer)} ${asString(event.utm_source)}`.toLowerCase();
  if (url.includes("producthunt") || url.includes("product_hunt")) return "Product Hunt";
  if (url.includes("linkedin")) return "LinkedIn";
  if (url.includes("instagram")) return "Instagram";
  if (url.includes("reddit")) return "Reddit";
  if (url.includes("twitter") || url.includes("x.com")) return "X/Twitter";
  return "Direct / unknown";
}

function detectDevice(event: RawAnalyticsEvent): "mobile" | "desktop" | "tablet" | "unknown" {
  const metadata = asRecord(event.metadata);
  const ua = `${asString(event.userAgent)} ${asString(metadata.userAgent)} ${asString(metadata.device)} ${asString(metadata.platform)}`.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/iphone|android|mobile|ipod/.test(ua)) return "mobile";
  if (/windows|macintosh|linux|desktop/.test(ua)) return "desktop";
  return "unknown";
}

function sessionKey(event: NormalizedAnalyticsEvent) {
  return event.sessionId || `${event.source}:${event.path}:${event.receivedAt.slice(0, 13)}`;
}

function normalizeEvent(event: RawAnalyticsEvent): NormalizedAnalyticsEvent {
  const metadata = asRecord(event.metadata);
  const receivedAt = asString(event.receivedAt, new Date().toISOString());
  const device = detectDevice(event);

  return {
    event: asString(event.event, "unknown_event"),
    sessionId: asString(event.sessionId, "unknown_session"),
    role: asString(event.role, "Unknown role"),
    market: asString(event.market, "Global"),
    recruiter: asString(event.recruiter, "Unknown recruiter"),
    mode: asString(event.mode, "standard"),
    score: asNumber(event.score ?? metadata.score),
    trust: asNumber(event.trust ?? metadata.trust),
    pressure: asNumber(event.pressure ?? metadata.pressure),
    path: asString(event.path, "/"),
    timestamp: asString(event.timestamp, receivedAt),
    receivedAt,
    source: detectTrafficSource(event),
    device,
    isMobile: device === "mobile" || device === "tablet",
    metadata,
  };
}

function dedupe(events: NormalizedAnalyticsEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.sessionId}|${event.event}|${event.timestamp}|${event.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readStoredEvents(): Promise<NormalizedAnalyticsEvent[]> {
  const supabaseEvents = await readSupabaseEvents();
  const rawFiles = await Promise.all(candidateFiles().map(readJsonl));
  const fileEvents = rawFiles.flat();
  const inMemory = memoryEvents();

  return dedupe([
    ...supabaseEvents.map(normalizeEvent),
    ...fileEvents.map(normalizeEvent),
    ...inMemory,
  ]).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

async function appendEvents(events: RawAnalyticsEvent[]) {
  if (!events.length) return;
  const stamped = events.map((event) => ({ ...event, receivedAt: new Date().toISOString() }));
  const normalized = stamped.map(normalizeEvent);
  const memory = memoryEvents();
  memory.push(...normalized);
  globalThis.__WORKZO_ANALYTICS_EVENTS__ = memory.slice(-5000);

  const storedInSupabase = await writeSupabaseEvents(stamped);

  // Keep local dev/backstop persistence even when Supabase is configured. This
  // makes analytics resilient during schema mistakes or temporary Supabase issues.
  if (!storedInSupabase || process.env.NODE_ENV !== "production") {
    await appendJsonl(stamped);
  }
}

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] || 0) + 1;
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function buildSummary(events: NormalizedAnalyticsEvent[]) {
  const counts: Record<string, number> = {};
  const recruiters: Record<string, number> = {};
  const roles: Record<string, number> = {};
  const modes: Record<string, number> = {};
  const trafficSources: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const errors: Record<string, number> = {};
  const weakSignals: Record<string, number> = {};
  const sessions = new Set<string>();
  const sessionReplay: Record<string, { events: number; first: string; last: string; device: string; recruiter: string; role: string; started: boolean; completed: boolean; lastEvent: string; dropoff: string }> = {};
  const modePerformance: Record<string, { starts: number; completions: number; voiceFailures: number; results: number; avgTrust: number | null }> = {};

  for (const event of events) {
    sessions.add(event.sessionId);
    increment(counts, event.event);
    increment(recruiters, event.recruiter);
    increment(roles, event.role);
    increment(modes, event.mode);
    increment(trafficSources, event.source);
    increment(devices, event.device);
    if (/error|failed|blocked|exception/i.test(event.event)) increment(errors, event.event);

    const key = sessionKey(event);
    const replay = (sessionReplay[key] ||= {
      events: 0,
      first: event.timestamp,
      last: event.timestamp,
      device: event.device,
      recruiter: event.recruiter,
      role: event.role,
      started: false,
      completed: false,
      lastEvent: event.event,
      dropoff: "Visited",
    });
    replay.events += 1;
    replay.last = event.timestamp;
    replay.lastEvent = event.event;
    replay.started ||= event.event === "interview_started" || event.event === "voice_started";
    replay.completed ||= event.event === "interview_completed" || event.event === "results_viewed";
    replay.dropoff = replay.completed
      ? "Completed/results"
      : replay.started
        ? "Started interview"
        : event.event.includes("upload")
          ? "Uploaded CV"
          : "Visited/unknown";

    const signal = asString(event.metadata.signal || event.metadata.tag || event.metadata.weakness || event.metadata.action);
    if (signal) increment(weakSignals, signal);

    const perf = (modePerformance[event.mode] ||= {
      starts: 0,
      completions: 0,
      voiceFailures: 0,
      results: 0,
      avgTrust: null,
    });
    if (event.event === "interview_started" || event.event === "voice_started") perf.starts += 1;
    if (event.event === "interview_completed") perf.completions += 1;
    if (event.event === "voice_failed" || event.event === "video_failed") perf.voiceFailures += 1;
    if (event.event === "results_viewed") perf.results += 1;
  }

  for (const mode of Object.keys(modePerformance)) {
    const trustValues = events
      .filter((event) => event.mode === mode && typeof event.trust === "number")
      .map((event) => event.trust as number);
    modePerformance[mode].avgTrust = trustValues.length
      ? Math.round(trustValues.reduce((sum, value) => sum + value, 0) / trustValues.length)
      : null;
  }

  const uploads = counts.cv_uploaded || 0;
  const interviewsStarted = counts.interview_started || counts.voice_started || 0;
  const voiceStarts = counts.voice_started || 0;
  const answersSubmitted = counts.answer_submitted || counts.copilot_action_used || 0;
  const completedInterviews = counts.interview_completed || 0;
  const resultsViewed = counts.results_viewed || 0;
  const voiceFailures = (counts.voice_failed || 0) + (counts.video_failed || 0);
  const voicePaused = counts.voice_paused || 0;
  const voiceRecovered = counts.voice_recovered || 0;

  const dropoffFunnel = [
    { stage: "CV uploaded", count: uploads },
    { stage: "Interview started", count: interviewsStarted },
    { stage: "First answer / interaction", count: answersSubmitted },
    { stage: "Interview completed", count: completedInterviews },
    { stage: "Results viewed", count: resultsViewed },
  ];

  const biggestDrop = dropoffFunnel.reduce(
    (best, stage, index) => {
      if (index === 0) return best;
      const previous = dropoffFunnel[index - 1];
      const drop = Math.max(0, previous.count - stage.count);
      return drop > best.drop ? { from: previous.stage, to: stage.stage, drop } : best;
    },
    { from: "", to: "", drop: 0 },
  );

  const topWeakness = Object.entries(weakSignals).sort((a, b) => b[1] - a[1])[0]?.[0] || "Not enough answer data yet";
  const insight = biggestDrop.drop
    ? `Largest drop-off: ${biggestDrop.from} → ${biggestDrop.to}.`
    : voiceFailures
      ? "Voice stability needs attention before scaling traffic."
      : "No major drop-off pattern yet. Keep collecting sessions.";

  return {
    totalEvents: events.length,
    uniqueSessions: sessions.size,
    uploads,
    interviewsStarted,
    answersSubmitted,
    voiceStarts,
    voiceFailures,
    voicePaused,
    voiceRecovered,
    completedInterviews,
    resultsViewed,
    answerRate: pct(answersSubmitted, interviewsStarted),
    resultRate: pct(resultsViewed, interviewsStarted),
    completionRate: pct(completedInterviews, interviewsStarted),
    voiceFailureRate: pct(voiceFailures, Math.max(voiceStarts, interviewsStarted)),
    counts,
    recruiters,
    roles,
    modes,
    trafficSources,
    devices,
    errors,
    mobileShare: pct((devices.mobile || 0) + (devices.tablet || 0), events.length),
    sessionReplay: Object.values(sessionReplay).sort((a, b) => b.last.localeCompare(a.last)).slice(0, 100),
    weakSignals,
    dropoffFunnel,
    modePerformance,
    topWeakness,
    insight,
    storage: {
      backend: supabaseEnabled() ? "supabase+local-fallback" : "local-file+memory",
      supabaseConfigured: supabaseEnabled(),
      supabaseTable: SUPABASE_TABLE,
      primary: LOCAL_DATA_DIR,
      fallback: TMP_DATA_DIR,
      note: supabaseEnabled()
        ? "Analytics are Supabase-ready with local fallback. Use the provided SQL table schema before enabling production analytics."
        : "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to persist analytics across deployments.",
    },
  };
}

export async function GET() {
  const events = (await readStoredEvents()).slice(-1500).reverse();
  return NextResponse.json({ summary: buildSummary(events), events });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RawAnalyticsEvent | { events?: RawAnalyticsEvent[] };
    const events = Array.isArray((body as { events?: RawAnalyticsEvent[] }).events)
      ? ((body as { events: RawAnalyticsEvent[] }).events || [])
      : [body as RawAnalyticsEvent];

    await appendEvents(events.filter((event) => asString(event.event)));
    return NextResponse.json({ success: true, supabaseConfigured: supabaseEnabled() });
  } catch (error) {
    console.error("Analytics event write failed:", error);
    return NextResponse.json(
      { success: false, error: "Analytics event write failed." },
      { status: 500 },
    );
  }
}
