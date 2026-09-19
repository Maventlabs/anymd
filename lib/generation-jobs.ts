import { randomUUID } from "node:crypto";
import { getSql, type Sql } from "./database";
import {
  parseGenerateRequest,
  type GenerateDocumentsRequest,
} from "./generator";
import {
  parseGeneratedBundle,
  type GeneratedBundle,
} from "./generated-documents";
import { GenerationQueueError, parseQueueRate } from "./generation-queue";
import { getServerEnvSnapshot } from "./server-env";
import { createTokenRepository } from "./tokens";

export const generationJobStatuses = [
  "queued",
  "processing",
  "succeeded",
  "failed",
  "timed_out",
] as const;

export type GenerationJobStatus = (typeof generationJobStatuses)[number];

export type QueueConfig = {
  maxAttempts: number;
  leaseMs: number;
  retryDelayMs: number;
  timeoutMs: number;
  ratePerMinute: number;
};

export type GenerationJob = {
  id: string;
  userId: string | null;
  status: GenerationJobStatus;
  input: GenerateDocumentsRequest;
  result: GeneratedBundle | null;
  errorCode: string | null;
  attemptCount: number;
  maxAttempts: number;
  availableAt: string;
  leaseExpiresAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GenerationJobDatabaseRow = {
  id: string;
  user_id: string | null;
  status: string;
  input: unknown;
  result: unknown;
  error_code: string | null;
  attempt_count: number;
  max_attempts: number;
  available_at: string | Date;
  lease_expires_at: string | Date | null;
  started_at: string | Date | null;
  completed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export class GenerationJobStorageError extends Error {
  constructor(public readonly code: "INVALID_ROW" | "INVALID_IP_HASH") {
    super(code);
    this.name = "GenerationJobStorageError";
  }
}

type QueueEnv = Record<string, string | undefined>;

function boundedInteger(
  env: QueueEnv,
  key: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = env[key]?.trim() ?? String(fallback);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max)
    throw new GenerationQueueError(
      "NOT_CONFIGURED",
      `${key} must be an integer from ${min} to ${max}`,
    );
  return value;
}

export function parseQueueConfig(
  env: QueueEnv = getServerEnvSnapshot(),
): QueueConfig {
  return {
    maxAttempts: boundedInteger(env, "ANYMD_QUEUE_MAX_ATTEMPTS", 2, 1, 5),
    leaseMs: boundedInteger(env, "ANYMD_QUEUE_LEASE_MS", 120_000, 1_000, 600_000),
    retryDelayMs: boundedInteger(
      env,
      "ANYMD_QUEUE_RETRY_DELAY_MS",
      1_000,
      0,
      300_000,
    ),
    timeoutMs: boundedInteger(
      env,
      "ANYMD_GENERATION_TIMEOUT_MS",
      60_000,
      1_000,
      600_000,
    ),
    ratePerMinute: parseQueueRate(env.ANYMD_QUEUE_RATE_PER_MINUTE),
  };
}

function invalidRow(): never {
  throw new GenerationJobStorageError("INVALID_ROW");
}

function timestamp(value: string | Date | null, nullable: true): string | null;
function timestamp(value: string | Date | null, nullable: false): string;
function timestamp(value: string | Date | null, nullable: boolean) {
  if (value === null) {
    if (nullable) return null;
    return invalidRow();
  }
  const parsed = new Date(value instanceof Date ? value : value);
  if (!Number.isFinite(parsed.valueOf())) return invalidRow();
  return parsed.toISOString();
}

function integer(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : invalidRow();
}

function jobStatus(value: string): GenerationJobStatus {
  return generationJobStatuses.includes(value as GenerationJobStatus)
    ? (value as GenerationJobStatus)
    : invalidRow();
}

export function mapGenerationJobRow(row: GenerationJobDatabaseRow): GenerationJob {
  let input: GenerateDocumentsRequest;
  let result: GeneratedBundle | null = null;
  try {
    input = parseGenerateRequest(row.input);
    if (row.result !== null) result = parseGeneratedBundle(row.result);
  } catch {
    return invalidRow();
  }
  if (row.result !== null && !result) return invalidRow();
  if (typeof row.id !== "string" || !row.id) return invalidRow();
  if (row.user_id !== null && typeof row.user_id !== "string") return invalidRow();
  if (row.error_code !== null && typeof row.error_code !== "string") return invalidRow();

  return {
    id: row.id,
    userId: row.user_id,
    status: jobStatus(row.status),
    input,
    result,
    errorCode: row.error_code,
    attemptCount: integer(row.attempt_count),
    maxAttempts: integer(row.max_attempts),
    availableAt: timestamp(row.available_at, false),
    leaseExpiresAt: timestamp(row.lease_expires_at, true),
    startedAt: timestamp(row.started_at, true),
    completedAt: timestamp(row.completed_at, true),
    createdAt: timestamp(row.created_at, false),
    updatedAt: timestamp(row.updated_at, false),
  };
}

export type EnqueueFreeJobInput = {
  ipHash: string;
  request: GenerateDocumentsRequest;
  userId?: string | null;
  jobId?: string;
  createdAt?: Date;
  config?: QueueConfig;
};

export type EnqueueFreeJobResult =
  | { accepted: true; job: GenerationJob }
  | { accepted: false; reason: "QUOTA_EXHAUSTED" };

export type EnqueuePaidJobInput = {
  userId: string;
  request: GenerateDocumentsRequest;
  amount?: number;
  jobId?: string;
  createdAt?: Date;
  config?: QueueConfig;
};

export type EnqueuePaidJobResult =
  | { accepted: true; job: GenerationJob }
  | { accepted: false; reason: "INSUFFICIENT_BALANCE" };

export type GenerationJobRepository = {
  enqueueFreeJob(input: EnqueueFreeJobInput): Promise<EnqueueFreeJobResult>;
  enqueuePaidJob(input: EnqueuePaidJobInput): Promise<EnqueuePaidJobResult>;
  getJob(id: string, userId?: string): Promise<GenerationJob | null>;
  claimJob(
    id: string,
    now: Date,
    config: QueueConfig,
  ): Promise<GenerationJob | null>;
  markSucceeded(id: string, result: GeneratedBundle, now: Date): Promise<boolean>;
  markRetryableFailure(
    id: string,
    errorCode: string,
    availableAt: Date,
    now: Date,
  ): Promise<boolean>;
  markTerminalFailure(
    id: string,
    status: "failed" | "timed_out",
    errorCode: string,
    now: Date,
  ): Promise<boolean>;
  recoverExpiredJob(id: string, now: Date): Promise<boolean>;
  refundJobTokens?(id: string): Promise<boolean>;
};

function assertIpHash(ipHash: string) {
  if (!/^[a-f0-9]{64}$/u.test(ipHash))
    throw new GenerationJobStorageError("INVALID_IP_HASH");
}

async function enqueueFreeJob(
  input: EnqueueFreeJobInput,
  query: Sql,
): Promise<EnqueueFreeJobResult> {
  assertIpHash(input.ipHash);
  const config = input.config ?? parseQueueConfig();
  const jobId = input.jobId ?? randomUUID();
  const createdAt = input.createdAt ?? new Date();
  const rows = (await query`
    WITH claim AS (
      INSERT INTO public.generation_quota_claims (ip_hash, created_at)
      VALUES (${input.ipHash}, ${createdAt.toISOString()})
      ON CONFLICT (ip_hash) DO NOTHING
      RETURNING ip_hash
    )
    INSERT INTO public.generation_jobs (
      id, user_id, status, input, attempt_count, max_attempts,
      available_at, created_at, updated_at
    )
    SELECT
      ${jobId}, ${input.userId ?? null}, 'queued',
      ${JSON.stringify(input.request)}::jsonb, 0, ${config.maxAttempts},
      ${createdAt.toISOString()}, ${createdAt.toISOString()}, ${createdAt.toISOString()}
    FROM claim
    RETURNING
      id, user_id, status, input, result, error_code, attempt_count, max_attempts,
      available_at, lease_expires_at, started_at, completed_at, created_at, updated_at
  `) as GenerationJobDatabaseRow[];

  if (!rows[0]) return { accepted: false, reason: "QUOTA_EXHAUSTED" };
  return { accepted: true, job: mapGenerationJobRow(rows[0]) };
}

async function enqueuePaidJob(
  input: EnqueuePaidJobInput,
  query: Sql,
): Promise<EnqueuePaidJobResult> {
  const amount = input.amount ?? 1;
  if (!Number.isSafeInteger(amount) || amount < 1)
    throw new GenerationQueueError("NOT_CONFIGURED", "Invalid token amount");
  const config = input.config ?? parseQueueConfig();
  const jobId = input.jobId ?? randomUUID();
  const createdAt = input.createdAt ?? new Date();
  const idempotencyKey = `generation:${jobId}`;
  const rows = (await query`
    WITH ensured AS (
      INSERT INTO public.token_accounts (user_id)
      VALUES (${input.userId})
      ON CONFLICT (user_id) DO NOTHING
      RETURNING user_id
    ), existing AS (
      SELECT user_id, delta
      FROM public.token_ledger
      WHERE idempotency_key = ${idempotencyKey}
      LIMIT 1
    ), eligible AS (
      SELECT account.user_id
      FROM public.token_accounts AS account
      WHERE account.user_id = ${input.userId}
        AND account.balance >= ${amount}
        AND NOT EXISTS (SELECT 1 FROM existing)
      FOR UPDATE
    ), debit AS (
      INSERT INTO public.token_ledger
        (id, user_id, kind, delta, idempotency_key, metadata)
      SELECT
        ${randomUUID()}, user_id, 'debit', ${-amount}, ${idempotencyKey},
        ${JSON.stringify({ generationJobId: jobId })}::jsonb
      FROM eligible
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING user_id
    )
    INSERT INTO public.generation_jobs (
      id, user_id, status, input, attempt_count, max_attempts,
      available_at, created_at, updated_at
    )
    SELECT
      ${jobId}, ${input.userId}, 'queued',
      ${JSON.stringify(input.request)}::jsonb, 0, ${config.maxAttempts},
      ${createdAt.toISOString()}, ${createdAt.toISOString()}, ${createdAt.toISOString()}
    FROM debit
    RETURNING
      id, user_id, status, input, result, error_code, attempt_count, max_attempts,
      available_at, lease_expires_at, started_at, completed_at, created_at, updated_at
  `) as GenerationJobDatabaseRow[];

  if (!rows[0]) return { accepted: false, reason: "INSUFFICIENT_BALANCE" };
  return { accepted: true, job: mapGenerationJobRow(rows[0]) };
}

export function createGenerationJobRepository(
  query: Sql = getSql(),
): GenerationJobRepository {
  const refundJobTokens = async (id: string) => {
    const result = await createTokenRepository(query).refundGeneration(id);
    return result.applied;
  };

  return {
    enqueueFreeJob: (input) => enqueueFreeJob(input, query),
    enqueuePaidJob: (input) => enqueuePaidJob(input, query),
    refundJobTokens,

    async getJob(id, userId) {
      const rows = (userId === undefined
        ? await query`
            SELECT
              id, user_id, status, input, result, error_code, attempt_count, max_attempts,
              available_at, lease_expires_at, started_at, completed_at, created_at, updated_at
            FROM public.generation_jobs
            WHERE id = ${id}
            LIMIT 1
          `
        : await query`
            SELECT
              id, user_id, status, input, result, error_code, attempt_count, max_attempts,
              available_at, lease_expires_at, started_at, completed_at, created_at, updated_at
            FROM public.generation_jobs
            WHERE id = ${id} AND user_id = ${userId}
            LIMIT 1
          `) as GenerationJobDatabaseRow[];
      return rows[0] ? mapGenerationJobRow(rows[0]) : null;
    },

    async claimJob(id, now, config) {
      const nowIso = now.toISOString();
      const leaseExpiresAt = new Date(now.getTime() + config.leaseMs).toISOString();
      const rateWindow = new Date(now.getTime() - 60_000).toISOString();
      const rows = (await query`
        WITH queue_lock AS (
          SELECT pg_advisory_xact_lock(741463207::bigint)
        ), candidate AS (
          SELECT job.id
          FROM public.generation_jobs AS job
          CROSS JOIN queue_lock
          WHERE job.id = ${id}
            AND job.attempt_count < job.max_attempts
            AND (
              (job.status = 'queued' AND job.available_at <= ${nowIso})
              OR (
                job.status = 'processing'
                AND job.lease_expires_at IS NOT NULL
                AND job.lease_expires_at <= ${nowIso}
              )
            )
            AND (
              SELECT count(*)
              FROM public.generation_jobs AS started
              WHERE started.started_at IS NOT NULL
                AND started.started_at > ${rateWindow}
            ) < ${config.ratePerMinute}
        )
        UPDATE public.generation_jobs AS job
        SET
          status = 'processing',
          attempt_count = job.attempt_count + 1,
          lease_expires_at = ${leaseExpiresAt},
          started_at = ${nowIso},
          completed_at = NULL,
          updated_at = ${nowIso}
        FROM candidate
        WHERE job.id = candidate.id
        RETURNING
          job.id, job.user_id, job.status, job.input, job.result, job.error_code,
          job.attempt_count, job.max_attempts, job.available_at, job.lease_expires_at,
          job.started_at, job.completed_at, job.created_at, job.updated_at
      `) as GenerationJobDatabaseRow[];
      return rows[0] ? mapGenerationJobRow(rows[0]) : null;
    },

    async markSucceeded(id, result, now) {
      const rows = (await query`
        UPDATE public.generation_jobs
        SET
          status = 'succeeded',
          result = ${JSON.stringify(result)}::jsonb,
          error_code = NULL,
          lease_expires_at = NULL,
          completed_at = ${now.toISOString()},
          updated_at = ${now.toISOString()}
        WHERE id = ${id} AND status = 'processing'
        RETURNING id
      `) as Array<{ id: string }>;
      return rows.length > 0;
    },

    async markRetryableFailure(id, errorCode, availableAt, now) {
      const rows = (await query`
        UPDATE public.generation_jobs
        SET
          status = 'queued',
          result = NULL,
          error_code = ${errorCode},
          lease_expires_at = NULL,
          available_at = ${availableAt.toISOString()},
          updated_at = ${now.toISOString()}
        WHERE id = ${id} AND status = 'processing'
        RETURNING id
      `) as Array<{ id: string }>;
      return rows.length > 0;
    },

    async markTerminalFailure(id, status, errorCode, now) {
      const rows = (await query`
        UPDATE public.generation_jobs
        SET
          status = ${status},
          result = NULL,
          error_code = ${errorCode},
          lease_expires_at = NULL,
          completed_at = ${now.toISOString()},
          updated_at = ${now.toISOString()}
        WHERE id = ${id} AND status = 'processing'
        RETURNING id
      `) as Array<{ id: string }>;
      if (rows.length > 0) await refundJobTokens(id);
      return rows.length > 0;
    },

    async recoverExpiredJob(id, now) {
      const rows = (await query`
        UPDATE public.generation_jobs
        SET
          status = 'timed_out',
          error_code = 'GENERATION_TIMED_OUT',
          lease_expires_at = NULL,
          completed_at = ${now.toISOString()},
          updated_at = ${now.toISOString()}
        WHERE id = ${id}
          AND status = 'processing'
          AND lease_expires_at IS NOT NULL
          AND lease_expires_at <= ${now.toISOString()}
          AND attempt_count >= max_attempts
        RETURNING id
      `) as Array<{ id: string }>;
      if (rows.length > 0) await refundJobTokens(id);
      return rows.length > 0;
    },
  };
}
