import assert from "node:assert/strict";
import test from "node:test";
import { getAppUrl, StripeConfigError } from "../lib/stripe";

test("requires an explicit app URL in production", () => {
  assert.throws(
    () =>
      getAppUrl(new Request("https://attacker.example/api/stripe/checkout"), {
        NODE_ENV: "production",
      }),
    StripeConfigError,
  );
});

test("uses the configured app URL instead of the request host", () => {
  assert.equal(
    getAppUrl(new Request("https://attacker.example/api/stripe/checkout"), {
      ANYMD_APP_URL: "https://anymd.example/",
      NODE_ENV: "production",
    }),
    "https://anymd.example",
  );
});
