import assert from "node:assert/strict";
import test from "node:test";
import {
  GenerationQueueError,
  clientIpHash,
  extractClientIp,
  parseQueueRate,
} from "../lib/generation-queue";

test("hashes the trusted client IP without retaining the raw address", () => {
  const request = new Request("https://anymd.example/api/generate", {
    headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.2" },
  });

  const ip = extractClientIp(request, "x-forwarded-for");
  const hash = clientIpHash(ip, "a-long-server-only-pepper");

  assert.equal(ip, "203.0.113.8");
  assert.equal(hash, clientIpHash(ip, "a-long-server-only-pepper"));
  assert.doesNotMatch(hash, /203\.0\.113\.8/);
  assert.equal(hash.length, 64);
});

test("rejects missing or malformed trusted client IP headers", () => {
  assert.throws(
    () =>
      extractClientIp(
        new Request("https://anymd.example/api/generate"),
        "x-forwarded-for",
      ),
    (error: unknown) =>
      error instanceof GenerationQueueError && error.code === "IP_UNAVAILABLE",
  );
  assert.throws(
    () =>
      extractClientIp(
        new Request("https://anymd.example/api/generate", {
          headers: { "x-forwarded-for": "not-an-ip" },
        }),
        "x-forwarded-for",
      ),
    (error: unknown) =>
      error instanceof GenerationQueueError && error.code === "IP_UNAVAILABLE",
  );
});

test("uses a safe configurable queue rate", () => {
  assert.equal(parseQueueRate(undefined), 15);
  assert.equal(parseQueueRate("30"), 30);
  assert.throws(() => parseQueueRate("0"));
  assert.throws(() => parseQueueRate("61"));
  assert.throws(() => parseQueueRate("1.5"));
});
