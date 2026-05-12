// Server-side Tavus API for Next.js (App Router).
// Reads TAVUS_API_KEY from server environment — never exposed to the client.
// Get an API key: https://platform.tavus.io/api-keys

const TAVUS_API_BASE = 'https://tavusapi.com/v2';

type CreateBody = {
	action: 'create';
	// Forwarded verbatim to POST /v2/conversations. See the create-conversation
	// API reference for the full field list:
	// https://docs.tavus.io/api-reference/conversations/create-conversation
	params?: Record<string, unknown>;
};
type EndBody = { action: 'end'; conversationId: string };
type Body = CreateBody | EndBody;

export async function POST(request: Request) {
	const apiKey = process.env.TAVUS_API_KEY;
	if (!apiKey) {
		return Response.json(
			{ error: 'TAVUS_API_KEY is not set in the server environment.' },
			{ status: 500 }
		);
	}

	const body = (await request.json()) as Body;

	if (body.action === 'create') {
		const res = await fetch(`${TAVUS_API_BASE}/conversations`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
			body: JSON.stringify(body.params ?? {}),
		});
		if (!res.ok) {
			return Response.json(
				{ error: `Tavus create failed: ${res.status} ${await res.text()}` },
				{ status: res.status }
			);
		}
		return Response.json(await res.json());
	}

	if (body.action === 'end') {
		const res = await fetch(`${TAVUS_API_BASE}/conversations/${body.conversationId}/end`, {
			method: 'POST',
			headers: { 'x-api-key': apiKey },
		});
		if (!res.ok) {
			return Response.json(
				{ error: `Tavus end failed: ${res.status} ${await res.text()}` },
				{ status: res.status }
			);
		}
		return new Response(null, { status: 204 });
	}

	return Response.json({ error: 'Unknown action' }, { status: 400 });
}
