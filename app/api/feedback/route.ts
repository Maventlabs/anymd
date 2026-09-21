import { auth } from "@/auth";
import { getSql } from "@/lib/database";
import { getServerEnv } from "@/lib/server-env";
import { anonymousCookieHeader, anonymousIdHash, getOrCreateAnonymousId } from "@/lib/privacy-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const value = await request.json();
    const rating = value?.rating;
    const comment = value?.comment;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return Response.json({ error: "Feedback rating is invalid" }, { status: 400 });
    if (comment !== undefined && (typeof comment !== "string" || comment.length > 1000))
      return Response.json({ error: "Feedback comment is invalid" }, { status: 400 });

    const session = await auth();
    const anonymous = getOrCreateAnonymousId(request);
    const userId = session?.user?.id ?? null;
    const feedbackKey = userId
      ? `user:${userId}`
      : `anonymous:${anonymousIdHash(anonymous.value, getServerEnv("ANYMD_IP_HASH_PEPPER") ?? "")}`;
    const rows = (await getSql()`
      INSERT INTO generation_feedback (feedback_key, user_id, rating, comment)
      VALUES (${feedbackKey}, ${userId}, ${rating}, ${comment ?? null})
      ON CONFLICT (feedback_key) DO NOTHING
      RETURNING feedback_key
    `) as Array<Record<string, unknown>>;
    if (rows.length === 0)
      return Response.json({ error: "Feedback already submitted" }, { status: 409 });

    const response = Response.json({ accepted: true }, { status: 201 });
    if (!userId && anonymous.created)
      response.headers.set(
        "Set-Cookie",
        anonymousCookieHeader(anonymous.value, getServerEnv("NODE_ENV") === "production"),
      );
    return response;
  } catch {
    return Response.json({ error: "Feedback could not be saved" }, { status: 400 });
  }
}
