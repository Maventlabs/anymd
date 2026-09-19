import { randomUUID } from "node:crypto";
import { getSql, type Sql } from "./database";

export type TokenBalance = {
  userId: string;
  balance: number;
};

export type TokenMutationResult = {
  userId: string;
  balance: number;
  delta: number;
  applied: boolean;
};

export type GenerationRefundResult = {
  applied: boolean;
  userId: string | null;
  balance: number | null;
};

export class TokenLedgerError extends Error {
  constructor(
    public readonly code:
      | "INVALID_AMOUNT"
      | "INSUFFICIENT_BALANCE"
      | "IDEMPOTENCY_CONFLICT"
      | "INVALID_LEDGER_RESULT",
  ) {
    super(code);
    this.name = "TokenLedgerError";
  }
}

function assertAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000)
    throw new TokenLedgerError("INVALID_AMOUNT");
}

function parseMutationRow(row: Record<string, unknown>): TokenMutationResult {
  if (
    typeof row.user_id !== "string" ||
    typeof row.balance !== "number" ||
    !Number.isSafeInteger(row.balance) ||
    typeof row.delta !== "number" ||
    !Number.isSafeInteger(row.delta) ||
    typeof row.outcome !== "string"
  )
    throw new TokenLedgerError("INVALID_LEDGER_RESULT");
  return {
    userId: row.user_id,
    balance: row.balance,
    delta: row.delta,
    applied: row.outcome === "APPLIED",
  };
}

export function createTokenRepository(query: Sql = getSql()) {
  return {
    async getBalance(userId: string): Promise<TokenBalance> {
      const rows = (await query`
        WITH ensured AS (
          INSERT INTO public.token_accounts (user_id)
          VALUES (${userId})
          ON CONFLICT (user_id) DO NOTHING
          RETURNING user_id
        ), account_row AS (
          SELECT user_id, balance
          FROM public.token_accounts
          WHERE user_id = ${userId}
          UNION ALL
          SELECT user_id, 0 AS balance
          FROM ensured
        )
        SELECT user_id, balance
        FROM account_row
        LIMIT 1
      `) as Array<Record<string, unknown>>;
      const row = rows.at(-1);
      if (
        !row ||
        typeof row.user_id !== "string" ||
        typeof row.balance !== "number" ||
        !Number.isSafeInteger(row.balance)
      )
        throw new TokenLedgerError("INVALID_LEDGER_RESULT");
      return { userId: row.user_id, balance: row.balance };
    },

    async debit(
      userId: string,
      amount: number,
      idempotencyKey: string,
      metadata: Record<string, unknown> = {},
    ): Promise<TokenMutationResult> {
      assertAmount(amount);
      const rows = (await query`
        WITH ensured AS (
          INSERT INTO public.token_accounts (user_id)
          VALUES (${userId})
          ON CONFLICT (user_id) DO NOTHING
          RETURNING user_id
        ), existing AS (
          SELECT user_id, delta
          FROM public.token_ledger
          WHERE idempotency_key = ${idempotencyKey}
          LIMIT 1
        ), eligible AS (
          SELECT account.user_id, account.balance
          FROM public.token_accounts AS account
          WHERE account.user_id = ${userId}
            AND account.balance >= ${amount}
            AND NOT EXISTS (SELECT 1 FROM existing)
          FOR UPDATE
        ), inserted AS (
          INSERT INTO public.token_ledger
            (id, user_id, kind, delta, idempotency_key, metadata)
          SELECT ${randomUUID()}, user_id, 'debit', ${-amount}, ${idempotencyKey}, ${JSON.stringify(metadata)}::jsonb
          FROM eligible
          ON CONFLICT (idempotency_key) DO NOTHING
          RETURNING user_id, delta
        ), updated AS (
          UPDATE public.token_accounts AS account
          SET balance = account.balance + inserted.delta, updated_at = now()
          FROM inserted
          WHERE account.user_id = inserted.user_id
          RETURNING account.user_id, account.balance, inserted.delta
        ), account_balance AS (
          SELECT user_id, balance
          FROM public.token_accounts
          WHERE user_id = ${userId}
          UNION ALL
          SELECT user_id, 0 AS balance
          FROM ensured
        )
        SELECT account_balance.user_id, account_balance.balance,
          COALESCE(updated.delta, existing.delta, 0) AS delta,
          CASE
            WHEN EXISTS (SELECT 1 FROM updated) THEN 'APPLIED'
            WHEN EXISTS (SELECT 1 FROM existing) THEN 'DUPLICATE'
            ELSE 'INSUFFICIENT'
          END AS outcome
        FROM account_balance
        LEFT JOIN updated ON updated.user_id = account_balance.user_id
        LEFT JOIN existing ON existing.user_id = account_balance.user_id
      `) as Array<Record<string, unknown>>;
      const result = rows[0] ? parseMutationRow(rows[0]) : null;
      if (!result) throw new TokenLedgerError("INVALID_LEDGER_RESULT");
      if (!result.applied && result.delta === 0) {
        const existingRows = (await query`
          SELECT user_id, delta
          FROM public.token_ledger
          WHERE idempotency_key = ${idempotencyKey}
          LIMIT 1
        `) as Array<Record<string, unknown>>;
        const existing = existingRows[0];
        if (existing) {
          if (existing.user_id !== userId)
            throw new TokenLedgerError("IDEMPOTENCY_CONFLICT");
          const balance = await this.getBalance(userId);
          return {
            userId,
            balance: balance.balance,
            delta: typeof existing.delta === "number" ? existing.delta : 0,
            applied: false,
          };
        }
        throw new TokenLedgerError("INSUFFICIENT_BALANCE");
      }
      return result;
    },

    async creditPurchase(
      userId: string,
      amount: number,
      eventId: string,
      packageId: string,
      metadata: Record<string, unknown> = {},
    ): Promise<TokenMutationResult> {
      assertAmount(amount);
      const rows = (await query`
        WITH event_insert AS (
          INSERT INTO public.stripe_webhook_events (event_id, user_id, package_id)
          VALUES (${eventId}, ${userId}, ${packageId})
          ON CONFLICT (event_id) DO NOTHING
          RETURNING event_id
        ), inserted AS (
          INSERT INTO public.token_ledger
            (id, user_id, kind, delta, idempotency_key, metadata)
          SELECT ${randomUUID()}, ${userId}, 'purchase', ${amount}, ${`stripe:${eventId}`}, ${JSON.stringify(metadata)}::jsonb
          FROM event_insert
          RETURNING user_id, delta
        ), updated AS (
          INSERT INTO public.token_accounts (user_id, balance)
          SELECT inserted.user_id, inserted.delta
          FROM inserted
          ON CONFLICT (user_id) DO UPDATE
          SET balance = public.token_accounts.balance + EXCLUDED.balance,
              updated_at = now()
          RETURNING user_id, balance, ${amount} AS delta
        )
        SELECT user_id, balance, delta, 'APPLIED' AS outcome
        FROM updated
        UNION ALL
        SELECT account.user_id, account.balance, 0 AS delta, 'DUPLICATE' AS outcome
        FROM public.token_accounts AS account
        WHERE account.user_id = ${userId}
          AND NOT EXISTS (SELECT 1 FROM updated)
      `) as Array<Record<string, unknown>>;
      const row = rows[0];
      if (!row) throw new TokenLedgerError("INVALID_LEDGER_RESULT");
      return parseMutationRow(row);
    },

    async refund(
      userId: string,
      amount: number,
      idempotencyKey: string,
      metadata: Record<string, unknown> = {},
    ): Promise<TokenMutationResult> {
      assertAmount(amount);
      const rows = (await query`
        WITH inserted AS (
          INSERT INTO public.token_ledger
            (id, user_id, kind, delta, idempotency_key, metadata)
          SELECT ${randomUUID()}, ${userId}, 'refund', ${amount}, ${idempotencyKey}, ${JSON.stringify(metadata)}::jsonb
          ON CONFLICT (idempotency_key) DO NOTHING
          RETURNING user_id, delta
        ), updated AS (
          INSERT INTO public.token_accounts (user_id, balance)
          SELECT inserted.user_id, inserted.delta
          FROM inserted
          ON CONFLICT (user_id) DO UPDATE
          SET balance = public.token_accounts.balance + EXCLUDED.balance,
              updated_at = now()
          RETURNING user_id, balance, ${amount} AS delta
        )
        SELECT user_id, balance, delta, 'APPLIED' AS outcome FROM updated
        UNION ALL
        SELECT account.user_id, account.balance, 0 AS delta, 'DUPLICATE' AS outcome
        FROM public.token_accounts AS account
        WHERE account.user_id = ${userId}
          AND NOT EXISTS (SELECT 1 FROM updated)
      `) as Array<Record<string, unknown>>;
      const row = rows[0];
      if (!row) throw new TokenLedgerError("INVALID_LEDGER_RESULT");
      return parseMutationRow(row);
    },

    async refundGeneration(jobId: string): Promise<GenerationRefundResult> {
      const debitKey = `generation:${jobId}`;
      const rows = (await query`
        SELECT user_id, -delta AS amount
        FROM public.token_ledger
        WHERE kind = 'debit' AND idempotency_key = ${debitKey}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
      const debit = rows[0];
      if (
        !debit ||
        typeof debit.user_id !== "string" ||
        typeof debit.amount !== "number" ||
        !Number.isSafeInteger(debit.amount) ||
        debit.amount < 1
      )
        return { applied: false, userId: null, balance: null };

      const result = await this.refund(
        debit.user_id,
        debit.amount,
        `generation-refund:${jobId}`,
        { generationJobId: jobId },
      );
      return {
        applied: result.applied,
        userId: result.userId,
        balance: result.balance,
      };
    },
  };
}
