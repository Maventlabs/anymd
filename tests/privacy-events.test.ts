import assert from "node:assert/strict";
import test from "node:test";
import {
  anonymousCookieHeader,
  anonymousIdHash,
  analyticsActorKey,
  getOrCreateAnonymousId,
  parseAnalyticsEvent,
} from "../lib/privacy-events";

test("accepts only consented allowlisted events and scalar properties", () => {
  assert.deepEqual(
    parseAnalyticsEvent({
      consent: true,
      event: "generation_completed",
      properties: {
        status: "success",
        durationMs: 12,
        prompt: "must be dropped",
        nested: { secret: true },
      },
    }),
    {
      event: "generation_completed",
      properties: { status: "success", durationMs: 12 },
    },
  );
  assert.throws(() => parseAnalyticsEvent({ consent: false, event: "page_view" }));
  assert.throws(() => parseAnalyticsEvent({ consent: true, event: "prompt_content" }));
});

test("reuses a valid anonymous cookie without exposing its raw value in the hash", () => {
  const value = "a".repeat(64);
  const result = getOrCreateAnonymousId(
    new Request("https://anymd.example", {
      headers: { cookie: `anymd_anon_id=${value}` },
    }),
  );
  const hash = anonymousIdHash(value, "a-long-server-only-pepper");

  assert.equal(result.value, value);
  assert.equal(result.created, false);
  assert.equal(hash.length, 64);
  assert.doesNotMatch(hash, new RegExp(value));
  assert.match(anonymousCookieHeader(value, true), /HttpOnly/u);
});

test("uses authenticated IDs directly and hashes anonymous IDs", () => {
  const anonymousId = "b".repeat(64);

  assert.equal(analyticsActorKey("user-123", anonymousId, "a-long-server-only-pepper"), "user:user-123");
  assert.equal(
    analyticsActorKey(null, anonymousId, "a-long-server-only-pepper"),
    `anon:${anonymousIdHash(anonymousId, "a-long-server-only-pepper")}`,
  );
});
