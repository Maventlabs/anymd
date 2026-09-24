import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { getSql } from "@/lib/database";
import {
  analyticsActorKey,
  anonymousCookieHeader,
  getOrCreateAnonymousId,
  parseAnalyticsEvent,
} from "@/lib/privacy-events";
import { getServerEnv } from "@/lib/server-env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let event: ReturnType<typeof parseAnalyticsEvent>;
  try {
    event = parseAnalyticsEvent(await request.json());
  } catch {
    return Response.json({ error: "Analytics event rejected" }, { status: 400 });
  }

  try {
    const session = await auth();
    const anonymous = getOrCreateAnonymousId(request);
    const userId = session?.user?.id ?? null;
    const actorKey = analyticsActorKey(
      userId,
      anonymous.value,
      getServerEnv("ANYMD_IP_HASH_PEPPER") ?? "",
    );
    await getSql()`
      INSERT INTO analytics_events (event_id, event_name, actor_key, user_id, properties)
      VALUES (${randomUUID()}, ${event.event}, ${actorKey}, ${userId}, ${JSON.stringify(event.properties)}::jsonb)
    `;

    const response = Response.json({ accepted: true });
    if (!userId && anonymous.created)
      response.headers.set(
        "Set-Cookie",
        anonymousCookieHeader(anonymous.value, getServerEnv("NODE_ENV") === "production"),
      );
    return response;
  } catch {
    return Response.json({ error: "Analytics is temporarily unavailable" }, { status: 503 });
  }
}
