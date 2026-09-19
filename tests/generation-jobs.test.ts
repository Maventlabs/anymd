import assert from "node:assert/strict";
import test from "node:test";
import { generateDocuments } from "../lib/generator";
import {
  GenerationJobStorageError,
  mapGenerationJobRow,
  parseQueueConfig,
  type GenerationJobDatabaseRow,
} from "../lib/generation-jobs";
import { validGenerateRequest } from "./fixtures";

const generatedAt = "2026-09-19T12:00:00.000Z";
const bundle = generateDocuments(validGenerateRequest, [], generatedAt);

test("uses conservative queue defaults and validates configuration bounds", () => {
  assert.deepEqual(
    parseQueueConfig({}),
    {
      maxAttempts: 2,
      leaseMs: 120_000,
      retryDelayMs: 1_000,
      timeoutMs: 60_000,
      ratePerMinute: 15,
    },
  );
  assert.equal(
    parseQueueConfig({
      ANYMD_QUEUE_MAX_ATTEMPTS: "4",
      ANYMD_QUEUE_LEASE_MS: "30000",
      ANYMD_QUEUE_RETRY_DELAY_MS: "250",
      ANYMD_GENERATION_TIMEOUT_MS: "45000",
      ANYMD_QUEUE_RATE_PER_MINUTE: "30",
    }).maxAttempts,
    4,
  );
  assert.throws(() =>
    parseQueueConfig({ ANYMD_QUEUE_MAX_ATTEMPTS: "0" }),
  );
  assert.throws(() =>
    parseQueueConfig({ ANYMD_QUEUE_LEASE_MS: "999" }),
  );
  assert.throws(() =>
    parseQueueConfig({ ANYMD_GENERATION_TIMEOUT_MS: "600001" }),
  );
});

test("maps a validated database row into a public job model", () => {
  const row: GenerationJobDatabaseRow = {
    id: "job-1",
    user_id: null,
    status: "succeeded",
    input: validGenerateRequest,
    result: bundle,
    error_code: null,
    attempt_count: 1,
    max_attempts: 2,
    available_at: "2026-09-19T12:00:00.000Z",
    lease_expires_at: null,
    started_at: "2026-09-19T12:00:01.000Z",
    completed_at: "2026-09-19T12:00:02.000Z",
    created_at: "2026-09-19T12:00:00.000Z",
    updated_at: "2026-09-19T12:00:02.000Z",
  };

  assert.deepEqual(mapGenerationJobRow(row), {
    id: "job-1",
    userId: null,
    status: "succeeded",
    input: validGenerateRequest,
    result: bundle,
    errorCode: null,
    attemptCount: 1,
    maxAttempts: 2,
    availableAt: "2026-09-19T12:00:00.000Z",
    leaseExpiresAt: null,
    startedAt: "2026-09-19T12:00:01.000Z",
    completedAt: "2026-09-19T12:00:02.000Z",
    createdAt: "2026-09-19T12:00:00.000Z",
    updatedAt: "2026-09-19T12:00:02.000Z",
  });
});

test("rejects malformed persisted job input or result", () => {
  const row: GenerationJobDatabaseRow = {
    id: "job-2",
    user_id: null,
    status: "succeeded",
    input: { ...validGenerateRequest, unexpected: true },
    result: bundle,
    error_code: null,
    attempt_count: 1,
    max_attempts: 2,
    available_at: generatedAt,
    lease_expires_at: null,
    started_at: null,
    completed_at: generatedAt,
    created_at: generatedAt,
    updated_at: generatedAt,
  };

  assert.throws(
    () => mapGenerationJobRow(row),
    (error: unknown) => error instanceof GenerationJobStorageError,
  );
});
