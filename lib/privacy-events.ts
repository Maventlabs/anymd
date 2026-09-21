import { createHash, randomBytes } from "node:crypto";

export const analyticsEventNames = [
  "page_view",
  "signup_completed",
  "generation_started",
  "generation_completed",
  "checkout_started",
  "feedback_submitted",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export function parseAnalyticsEvent(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid analytics event");

  const input = value as Record<string, unknown>;
  if (input.consent !== true || typeof input.event !== "string")
    throw new Error("Analytics consent is required");
  if (!analyticsEventNames.includes(input.event as AnalyticsEventName))
    throw new Error("Analytics event is not allowed");

  const properties: Record<string, string | number | boolean> = {};
  if (input.properties && typeof input.properties === "object" && !Array.isArray(input.properties)) {
    for (const [key, property] of Object.entries(input.properties)) {
      if (!/^[a-z][a-zA-Z0-9_]{0,31}$/u.test(key)) continue;
      if (/prompt|content|document|query|input|body|text/iu.test(key)) continue;
      if (
        (typeof property === "string" && property.length <= 100) ||
        (typeof property === "number" && Number.isFinite(property)) ||
        typeof property === "boolean"
      )
        properties[key] = property;
    }
  }

  return {
    event: input.event as AnalyticsEventName,
    properties,
  };
}

export function getOrCreateAnonymousId(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie
    .split(";")
    .map((part) => part.trim().split("=", 2))
    .find(([key]) => key === "anymd_anon_id")?.[1];
  if (value && /^[a-f0-9]{64}$/u.test(value)) return { value, created: false };
  return { value: randomBytes(32).toString("hex"), created: true };
}

export function anonymousIdHash(value: string, pepper: string) {
  if (pepper.length < 16) throw new Error("ANYMD_IP_HASH_PEPPER is not configured");
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}

export function anonymousCookieHeader(value: string, secure: boolean) {
  return `anymd_anon_id=${value}; Max-Age=31536000; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}
