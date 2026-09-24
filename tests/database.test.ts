import assert from "node:assert/strict";
import test from "node:test";
import { retryDatabaseOperation } from "../lib/database";

test("retries transient Neon connection failures before succeeding", async () => {
  let attempts = 0;
  const waits: number[] = [];

  const result = await retryDatabaseOperation(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        const error = new Error("fetch failed", {
          cause: new Error("Connect Timeout Error"),
        });
        throw error;
      }
      return "ok";
    },
    { sleep: async (delayMs) => { waits.push(delayMs); } },
  );

  assert.equal(result, "ok");
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [250, 1_000]);
});

test("does not retry non-transient database failures", async () => {
  let attempts = 0;

  await assert.rejects(
    retryDatabaseOperation(async () => {
      attempts += 1;
      throw new Error("duplicate key value violates unique constraint");
    }, { sleep: async () => undefined }),
    /duplicate key/u,
  );

  assert.equal(attempts, 1);
});
