CREATE TABLE IF NOT EXISTS public.token_accounts (
  user_id text PRIMARY KEY REFERENCES public.app_users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.token_ledger (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('purchase', 'debit', 'refund', 'adjustment')),
  delta integer NOT NULL CHECK (delta <> 0),
  idempotency_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS token_ledger_user_created_idx
  ON public.token_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  package_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
