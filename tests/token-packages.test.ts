import assert from "node:assert/strict";
import test from "node:test";
import { getTokenPackage, TokenPackageError, tokenPackages } from "../lib/token-packages";

test("keeps the three token packages fixed and in cents", () => {
  assert.deepEqual(tokenPackages, {
    starter: { tokens: 10, unitAmount: 299, name: "10 AnyMD tokens" },
    builder: { tokens: 50, unitAmount: 1199, name: "50 AnyMD tokens" },
    studio: { tokens: 100, unitAmount: 1999, name: "100 AnyMD tokens" },
  });
  assert.deepEqual(getTokenPackage("builder"), {
    id: "builder",
    tokens: 50,
    unitAmount: 1199,
    name: "50 AnyMD tokens",
  });
});

test("rejects untrusted token package IDs", () => {
  assert.throws(
    () => getTokenPackage("starter;DROP TABLE token_ledger"),
    (error: unknown) =>
      error instanceof TokenPackageError && error.code === "INVALID_PACKAGE",
  );
});
