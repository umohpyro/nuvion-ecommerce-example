import { env } from "@/lib/env";
import { EVENT_ID_HEADER, verify } from "@/lib/webhook";

/**
 * Nuvion webhook receiver.
 *
 * This example keeps no database, so there is nothing to update here: the order page reads the
 * payment's real status from Nuvion on every visit. What the handler still demonstrates is the part
 * that matters, in order:
 *   1. Read the raw body. Never re-serialize parsed JSON before verifying.
 *   2. Verify the HMAC-SHA256 signature in constant time and reject anything that fails.
 *   3. Acknowledge with a 2xx quickly. Any other status makes Nuvion retry.
 *
 * To fulfill orders in a real shop you also need a database, so you can record each event ID and
 * ignore repeats (Nuvion retries and can deliver an event twice), then ship goods exactly once.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const secret = env.webhookSecret;
  if (!secret) return Response.json({ error: "No webhook secret configured." }, { status: 503 });

  if (!verify(secret, raw, request.headers)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { id?: string; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Body isn't valid JSON." }, { status: 400 });
  }

  // In production, replace this log with: record the event ID, update the order, then fulfill.
  console.log("nuvion webhook", { id: request.headers.get(EVENT_ID_HEADER), event: event.event, object: event.data?.id, status: event.data?.status });
  return Response.json({ received: true });
}
