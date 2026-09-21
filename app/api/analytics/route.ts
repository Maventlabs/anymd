import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { getSql } from "@/lib/database";
import { parseAnalyticsEvent, getOrCreateAnonymousId, anonymousCookieHeader } from "@/lib/privacy-events";
import { getServerEnv } from "@/lib/server-env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const event = parseAnalyticsEvent(await request.json());
    const session = await auth();
    const anonymous = getOrCreateAnonymousId(request);
    const userId = session?.user?.id ?? null;
    await getSql()`
      INSERT INTO analytics_events (event_id, event_name, user_id, properties)
      VALUES (${randomUUID()}, ${event.event}, ${userId}, ${JSON.stringify(event.properties)}::jsonb)
    `;

    const response = Response.json({ accepted: true });
    if (!userId && anonymous.created)
      response.headers.set(
        "Set-Cookie",
        anonymousCookieHeader(anonymous.value, getServerEnv("NODE_ENV") === "production"),
      );
    return response;
  } catch {
    return Response.json({ error: "Analytics event rejected" }, { status: 400 });
  }
}
