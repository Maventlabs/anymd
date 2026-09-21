import { getSql, type Sql } from "@/lib/database";
import { getServerEnv } from "@/lib/server-env";
import {
  clientIpHash,
  extractClientIp,
  GenerationQueueError,
} from "@/lib/generation-queue";

export type RateLimitName = "auth" | "signup" | "generate" | "checkout";

export type RateLimitPolicy = {
  name: RateLimitName;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const policies: Record<RateLimitName, RateLimitPolicy> = {
  auth: { name: "auth", limit: 20, windowMs: 15 * 60 * 1000 },
  signup: { name: "signup", limit: 5, windowMs: 15 * 60 * 1000 },
  generate: { name: "generate", limit: 30, windowMs: 60 * 1000 },
  checkout: { name: "checkout", limit: 10, windowMs: 15 * 60 * 1000 },
};

export function getRateLimitPolicy(name: RateLimitName) {
  return policies[name];
}

export function rateLimitResponse(result: RateLimitResult) {
  return Response.json(
    {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again later.",
      },
    },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    },
  );
}

export function getRateLimitSubject(request: Request, userId?: string) {
  if (userId) return `user:${userId}`;

  const pepper = getServerEnv("ANYMD_IP_HASH_PEPPER") ?? "";
  for (const headerName of ["x-forwarded-for", "x-real-ip"]) {
    try {
      return `ip:${clientIpHash(extractClientIp(request, headerName), pepper)}`;
    } catch (error) {
      if (!(error instanceof GenerationQueueError)) throw error;
    }
  }

  if (getServerEnv("NODE_ENV") !== "production") return "environment:development";
  throw new GenerationQueueError(
    "IP_UNAVAILABLE",
    "A client IP address is required for rate limiting",
  );
}

export async function consumeRequestRateLimit(
  request: Request,
  name: RateLimitName,
  userId?: string,
  sql?: Sql,
) {
  const policy = getRateLimitPolicy(name);
  const subject = getRateLimitSubject(request, userId);
  try {
    return await consumeRateLimit(`${name}:${subject}`, policy, sql);
  } catch (error) {
    if (getServerEnv("NODE_ENV") !== "production")
      return { allowed: true, retryAfterSeconds: 0 };
    throw error;
  }
}

export async function consumeRateLimit(
  bucketKey: string,
  policy: RateLimitPolicy,
  sql: Sql = getSql(),
): Promise<RateLimitResult> {
  const rows = (await sql`
    INSERT INTO api_rate_limit_buckets
      (bucket_key, window_started_at, request_count, updated_at)
    VALUES (${bucketKey}, now(), 1, now())
    ON CONFLICT (bucket_key) DO UPDATE
    SET
      window_started_at = CASE
        WHEN api_rate_limit_buckets.window_started_at
          + (${policy.windowMs} * interval '1 millisecond') <= now()
        THEN now()
        ELSE api_rate_limit_buckets.window_started_at
      END,
      request_count = CASE
        WHEN api_rate_limit_buckets.window_started_at
          + (${policy.windowMs} * interval '1 millisecond') <= now()
        THEN 1
        ELSE api_rate_limit_buckets.request_count + 1
      END,
      updated_at = now()
    WHERE api_rate_limit_buckets.window_started_at
      + (${policy.windowMs} * interval '1 millisecond') <= now()
      OR api_rate_limit_buckets.request_count < ${policy.limit}
    RETURNING request_count
  `) as Array<Record<string, unknown>>;

  if (rows.length > 0) return { allowed: true, retryAfterSeconds: 0 };

  return {
    allowed: false,
    retryAfterSeconds: Math.ceil(policy.windowMs / 1000),
  };
}
