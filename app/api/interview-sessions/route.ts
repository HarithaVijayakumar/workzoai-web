import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InterviewSessionPayload = {
  localId?: string;
  candidateName?: string;
  targetRole?: string;
  targetCompany?: string;
  recruiterName?: string;
  recruiterTitle?: string;
  companyStyle?: string;
  atmosphere?: string;
  country?: string;
  durationSeconds?: number;
  overallScore?: number | null;
  trustScore?: number | null;
  verdict?: unknown;
  summary?: unknown;
  weakestMoment?: unknown;
  transcript?: unknown;
  report?: unknown;
};

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function cleanScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, target_role, target_company, recruiter_name, recruiter_title, company_style, atmosphere, country, duration_seconds, overall_score, trust_score, verdict, summary, weakest_moment, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: InterviewSessionPayload;
  try {
    body = (await request.json()) as InterviewSessionPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetRole = cleanText(body.targetRole, "Interview Practice");
  const localId = cleanText(body.localId);

  const row = {
    user_id: user.id,
    local_id: localId || null,
    candidate_name: cleanText(body.candidateName) || null,
    target_role: targetRole,
    target_company: cleanText(body.targetCompany) || null,
    recruiter_name: cleanText(body.recruiterName, "AI Recruiter"),
    recruiter_title: cleanText(body.recruiterTitle) || null,
    company_style: cleanText(body.companyStyle) || null,
    atmosphere: cleanText(body.atmosphere) || null,
    country: cleanText(body.country) || null,
    duration_seconds: Math.max(0, Math.round(Number(body.durationSeconds) || 0)),
    overall_score: cleanScore(body.overallScore),
    trust_score: cleanScore(body.trustScore),
    verdict: body.verdict ?? null,
    summary: body.summary ?? null,
    weakest_moment: body.weakestMoment ?? null,
    transcript: Array.isArray(body.transcript) ? body.transcript : [],
    report: body.report ?? body,
  };

  const query = supabase.from("interview_sessions");
  const { data, error } = localId
    ? await query.upsert(row, { onConflict: "user_id,local_id" }).select("id").single()
    : await query.insert(row).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
