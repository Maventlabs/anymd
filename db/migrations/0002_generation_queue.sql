CREATE TABLE IF NOT EXISTS public.generation_quota_claims (
  ip_hash text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id text PRIMARY KEY,
  user_id text REFERENCES public.app_users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'timed_out')),
  input jsonb NOT NULL CHECK (jsonb_typeof(input) = 'object'),
  result jsonb CHECK (result IS NULL OR jsonb_typeof(result) = 'object'),
  error_code text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 2 CHECK (max_attempts BETWEEN 1 AND 5),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS generation_jobs_queue_idx
  ON public.generation_jobs (available_at, created_at)
  WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS generation_jobs_user_id_idx
  ON public.generation_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS generation_jobs_lease_idx
  ON public.generation_jobs (lease_expires_at)
  WHERE status = 'processing';
