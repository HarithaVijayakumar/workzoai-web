import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TavusRequest = {
  recruiterName?: string;
  recruiterTrust?: number;
  pressure?: number;
};

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is missing in .env.local`);
  }

  return value.trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as TavusRequest;

    const apiKey = requiredEnv("TAVUS_API_KEY");
    const replicaId = requiredEnv("TAVUS_REPLICA_ID");
    const personaId = requiredEnv("TAVUS_PERSONA_ID");

    const recruiterName = body.recruiterName || "Recruiter";
    const recruiterTrust =
      typeof body.recruiterTrust === "number" ? body.recruiterTrust : 50;
    const pressure = typeof body.pressure === "number" ? body.pressure : 50;

    const response = await fetch("https://tavusapi.com/v2/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        replica_id: replicaId,
        persona_id: personaId,
        conversation_name: `WorkZo Interview - ${recruiterName}`,
        conversational_context: `
You are ${recruiterName}, a realistic recruiter inside WorkZo AI.

Current recruiter trust: ${recruiterTrust}/100
Current pressure: ${pressure}/100

Stay professional, realistic, analytical, and emotionally believable.
Ask one question at a time.
Challenge vague answers.
Ask for measurable impact, ownership, and proof.
Do not behave like a coach.
Do not give long explanations.
        `.trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.error ||
            `Tavus conversation failed with status ${response.status}`,
          raw: data,
        },
        { status: response.status }
      );
    }

    const conversationUrl =
      data?.conversation_url ||
      data?.conversationUrl ||
      data?.daily_room_url ||
      data?.dailyRoomUrl ||
      data?.url ||
      data?.conversation?.url ||
      "";

    return NextResponse.json({
      conversationUrl,
      conversationId:
        data?.conversation_id ||
        data?.conversationId ||
        data?.id ||
        data?.conversation?.id ||
        "",
      raw: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create Tavus conversation",
      },
      { status: 500 }
    );
  }
}
