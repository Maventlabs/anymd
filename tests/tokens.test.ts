import assert from "node:assert/strict";
import test from "node:test";
import { createTokenRepository, TokenLedgerError } from "../lib/tokens";
import type { Sql } from "../lib/database";

function fakeSql(responses: Array<Record<string, unknown>[]>) {
  const statements: string[] = [];
  const query = (strings: TemplateStringsArray, ...values: unknown[]) => {
    statements.push(strings.raw.map((part, index) => `${part}${values[index] ?? ""}`).join(""));
    return Promise.resolve(responses.shift() ?? []);
  };
  return { query: query as unknown as Sql, statements };
}

test("returns an applied debit mutation from the ledger result", async () => {
  const fake = fakeSql([
    [{ user_id: "user-1", balance: 8, delta: -2, outcome: "APPLIED" }],
  ]);
  const result = await createTokenRepository(fake.query).debit("user-1", 2, "debit-1");

  assert.deepEqual(result, { userId: "user-1", balance: 8, delta: -2, applied: true });
  assert.match(fake.statements[0], /ON CONFLICT \(idempotency_key\) DO NOTHING/);
});

test("replays a concurrent debit idempotently after the first statement commits", async () => {
  const fake = fakeSql([
    [{ user_id: "user-1", balance: 0, delta: 0, outcome: "INSUFFICIENT" }],
    [{ user_id: "user-1", delta: -2 }],
    [{ user_id: "user-1", balance: 8 }],
  ]);
  const result = await createTokenRepository(fake.query).debit("user-1", 2, "debit-1");

  assert.deepEqual(result, { userId: "user-1", balance: 8, delta: -2, applied: false });
});

test("raises a stable error when a debit idempotency key belongs to another user", async () => {
  const fake = fakeSql([
    [{ user_id: "user-1", balance: 0, delta: 0, outcome: "INSUFFICIENT" }],
    [{ user_id: "user-2", delta: -2 }],
  ]);

  await assert.rejects(
    () => createTokenRepository(fake.query).debit("user-1", 2, "debit-1"),
    (error: unknown) =>
      error instanceof TokenLedgerError && error.code === "IDEMPOTENCY_CONFLICT",
  );
});

test("maps a verified purchase credit to an applied mutation", async () => {
  const fake = fakeSql([
    [{ user_id: "user-1", balance: 50, delta: 50, outcome: "APPLIED" }],
  ]);
  const result = await createTokenRepository(fake.query).creditPurchase(
    "user-1",
    50,
    "evt_123",
    "builder",
  );

  assert.deepEqual(result, { userId: "user-1", balance: 50, delta: 50, applied: true });
  assert.match(fake.statements[0], /stripe_webhook_events/);
  assert.match(fake.statements[0], /ON CONFLICT \(user_id\) DO UPDATE/);
});
