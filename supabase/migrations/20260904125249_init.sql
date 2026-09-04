CREATE TABLE IF NOT EXISTS reflections (
  user_id TEXT NOT NULL,
  reflection_id TEXT NOT NULL,
  value_name TEXT NOT NULL,
  note TEXT NOT NULL,
  practice_title TEXT NOT NULL,
  reflection_date TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, reflection_id)
);

CREATE INDEX IF NOT EXISTS reflections_user_date_idx
ON reflections (user_id, reflection_date DESC);

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id TEXT,
  anonymous_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_created_idx
ON analytics_events (event_name, created_at DESC);

CREATE TABLE IF NOT EXISTS feedback_submissions (
  feedback_id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  anonymous_id TEXT,
  user_email TEXT,
  message TEXT NOT NULL,
  pathname TEXT,
  current_view TEXT,
  palette_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_submissions_created_idx
ON feedback_submissions (created_at DESC);
