import assert from "node:assert/strict";
import test from "node:test";
import {
  getRateLimitPolicy,
  rateLimitResponse,
  type RateLimitResult,
} from "../lib/rate-limit";

test("exposes conservative policies for public abuse-sensitive endpoints", () => {
  assert.deepEqual(getRateLimitPolicy("auth"), {
    name: "auth",
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });
  assert.deepEqual(getRateLimitPolicy("signup"), {
    name: "signup",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  assert.deepEqual(getRateLimitPolicy("generate"), {
    name: "generate",
    limit: 30,
    windowMs: 60 * 1000,
  });
  assert.deepEqual(getRateLimitPolicy("checkout"), {
    name: "checkout",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
});

test("returns a retryable 429 response without leaking limiter internals", async () => {
  const result: RateLimitResult = {
    allowed: false,
    retryAfterSeconds: 42,
  };
  const response = rateLimitResponse(result);

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "42");
  assert.deepEqual(await response.json(), {
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Try again later.",
    },
  });
});
