import assert from "node:assert/strict";
import test from "node:test";
import { AiProviderError } from "../lib/ai-provider";
import type {
  GenerationJob,
  GenerationJobRepository,
  QueueConfig,
} from "../lib/generation-jobs";
import { processGenerationJob } from "../lib/generation-worker";
import { generateDocuments } from "../lib/generator";
import { parseSkillsCatalog, snapshotCatalog } from "../lib/skills";
import { validGenerateRequest } from "./fixtures";

const now = new Date("2026-09-19T12:00:00.000Z");
const config: QueueConfig = {
  maxAttempts: 2,
  leaseMs: 120_000,
  retryDelayMs: 1_000,
  timeoutMs: 60_000,
  ratePerMinute: 15,
};
const selectedSkills = parseSkillsCatalog(snapshotCatalog).skills.filter(({ id }) =>
  validGenerateRequest.selectedSkillIds.includes(id),
);
const job: GenerationJob = {
  id: "job-1",
  userId: null,
  status: "processing",
  input: validGenerateRequest,
  result: null,
  errorCode: null,
  attemptCount: 1,
  maxAttempts: 2,
  availableAt: now.toISOString(),
  leaseExpiresAt: new Date(now.getTime() + config.leaseMs).toISOString(),
  startedAt: now.toISOString(),
  completedAt: null,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};

function repositoryFor(overrides: Partial<GenerationJobRepository> = {}) {
  const calls = {
    retry: [] as Array<[string, string, Date, Date]>,
    terminal: [] as Array<[string, "failed" | "timed_out", string, Date]>,
    succeeded: [] as Array<[string, unknown, Date]>,
  };
  const repository: GenerationJobRepository = {
    enqueueFreeJob: async () => {
      throw new Error("not used");
    },
    enqueuePaidJob: async () => {
      throw new Error("not used");
    },
    getJob: async () => job,
    claimJob: async () => job,
    markSucceeded: async (...args) => {
      calls.succeeded.push(args);
      return true;
    },
    markRetryableFailure: async (...args) => {
      calls.retry.push(args);
      return true;
    },
    markTerminalFailure: async (...args) => {
      calls.terminal.push(args);
      return true;
    },
    recoverExpiredJob: async () => false,
    ...overrides,
  };
  return { repository, calls };
}

const dependencies = {
  loadCatalog: async () => ({ data: selectedSkills, meta: {} as never }),
  generateBundle: async () =>
    generateDocuments(validGenerateRequest, selectedSkills, now.toISOString()),
  now: () => now,
};

test("requeues a provider failure while attempts remain", async () => {
  const { repository, calls } = repositoryFor();
  const result = await processGenerationJob("job-1", repository, now, {
    ...dependencies,
    generateBundle: async () => {
      throw new AiProviderError("REQUEST_FAILED");
    },
  });

  assert.equal(result?.status, "processing");
  assert.deepEqual(calls.retry.map(([id, code]) => [id, code]), [
    ["job-1", "REQUEST_FAILED"],
  ]);
  assert.equal(calls.terminal.length, 0);
  assert.equal(calls.retry[0]?.[2].toISOString(), "2026-09-19T12:00:01.000Z");
});

test("marks the final provider failure as terminal", async () => {
  const { repository, calls } = repositoryFor({
    claimJob: async () => ({ ...job, attemptCount: 2 }),
  });
  await processGenerationJob("job-1", repository, now, {
    ...dependencies,
    generateBundle: async () => {
      throw new AiProviderError("INVALID_RESPONSE");
    },
  });

  assert.deepEqual(calls.terminal, [
    ["job-1", "failed", "INVALID_RESPONSE", now],
  ]);
  assert.equal(calls.retry.length, 0);
});

test("recovers an expired final lease without invoking the provider", async () => {
  const { repository, calls } = repositoryFor({
    recoverExpiredJob: async () => true,
  });
  let invoked = false;
  const result = await processGenerationJob("job-1", repository, now, {
    ...dependencies,
    generateBundle: async () => {
      invoked = true;
      return generateDocuments(validGenerateRequest, selectedSkills, now.toISOString());
    },
  });

  assert.equal(result?.id, "job-1");
  assert.equal(invoked, false);
  assert.equal(calls.terminal.length, 0);
});

test("fails a job when its persisted skill snapshot is no longer available", async () => {
  const { repository, calls } = repositoryFor();
  const result = await processGenerationJob("job-1", repository, now, {
    ...dependencies,
    loadCatalog: async () => ({ data: [], meta: {} as never }),
  });

  assert.equal(result?.id, "job-1");
  assert.deepEqual(calls.terminal, [["job-1", "failed", "UNKNOWN_SKILL", now]]);
});
