CREATE TABLE IF NOT EXISTS api_rate_limit_buckets (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_rate_limit_buckets_updated_at_idx
  ON api_rate_limit_buckets (updated_at);

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id text PRIMARY KEY,
  event_name text NOT NULL,
  user_id text REFERENCES app_users(id) ON DELETE SET NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
  ON analytics_events (created_at);

CREATE TABLE IF NOT EXISTS generation_feedback (
  feedback_key text PRIMARY KEY,
  user_id text REFERENCES app_users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (comment IS NULL OR char_length(comment) <= 1000)
);

CREATE INDEX IF NOT EXISTS generation_feedback_created_at_idx
  ON generation_feedback (created_at);
