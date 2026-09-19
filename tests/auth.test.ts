import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthInputError,
  normalizeEmail,
  parseSignupInput,
} from "../lib/auth-users";
import { hashPassword, verifyPassword } from "../lib/password";

test("normalizes email addresses before persistence", () => {
  assert.equal(normalizeEmail("  PERSON@Example.COM "), "person@example.com");
});

test("validates the signup contract", () => {
  assert.deepEqual(
    parseSignupInput({
      email: "person@example.com",
      password: "a secure password",
      name: "Person",
    }),
    {
      email: "person@example.com",
      password: "a secure password",
      name: "Person",
    },
  );

  assert.throws(
    () => parseSignupInput({ email: "bad", password: "short" }),
    (error: unknown) => error instanceof AuthInputError,
  );
  assert.throws(
    () =>
      parseSignupInput({
        email: "person@example.com",
        password: "a secure password",
        unexpected: true,
      }),
    (error: unknown) => error instanceof AuthInputError,
  );
});

test("hashes and verifies passwords without storing plaintext", async () => {
  const hash = await hashPassword("a secure password");

  assert.match(hash, /^scrypt\$[^$]+\$[^$]+$/);
  assert.notEqual(hash, "a secure password");
  assert.equal(await verifyPassword("a secure password", hash), true);
  assert.equal(await verifyPassword("another password", hash), false);
  assert.equal(await verifyPassword("a secure password", "invalid"), false);
});
