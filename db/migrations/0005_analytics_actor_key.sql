ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS actor_key text;

UPDATE analytics_events
SET actor_key = CASE
  WHEN user_id IS NOT NULL THEN 'user:' || user_id
  ELSE 'legacy:' || event_id
END
WHERE actor_key IS NULL;

ALTER TABLE analytics_events
  ALTER COLUMN actor_key SET NOT NULL;

CREATE INDEX IF NOT EXISTS analytics_events_actor_created_at_idx
  ON analytics_events (actor_key, created_at);

CREATE INDEX IF NOT EXISTS analytics_events_name_created_at_idx
  ON analytics_events (event_name, created_at);
