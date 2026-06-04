import { NextResponse } from "next/server";
import { parseResumeWithAiStructure } from "@/lib/workzoAiCvParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const cvText =
      typeof body?.cvText === "string"
        ? body.cvText
        : typeof body?.text === "string"
          ? body.text
          : "";

    const layoutText =
      typeof body?.layoutText === "string" ? body.layoutText : "";

    const jobDescription =
      typeof body?.jobDescription === "string"
        ? body.jobDescription
        : typeof body?.jdText === "string"
          ? body.jdText
          : "";

    const targetRole =
      typeof body?.targetRole === "string" ? body.targetRole : "";

    const targetMarket =
      typeof body?.targetMarket === "string" ? body.targetMarket : "";

    if (!cvText.trim() && !layoutText.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "CV text is required.",
        },
        { status: 400 },
      );
    }

    const result = await parseResumeWithAiStructure({
      cvText,
      layoutText,
      jobDescription,
      targetRole,
      targetMarket,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "route_error",
        error:
          error instanceof Error
            ? error.message
            : "CV AI structuring failed.",
      },
      { status: 500 },
    );
  }
}
