-- GameVault schema
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL CHECK (length(trim(name)) > 0),
  email          TEXT NOT NULL,
  password_hash  TEXT,          -- NULL for accounts that only use Google sign-in
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Google sign-in. Added separately so existing databases pick it up.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id);

-- Only a SHA-256 hash of each reset token is stored, never the token itself.
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash  TEXT PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets (user_id);

CREATE TABLE IF NOT EXISTS games (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL CHECK (length(trim(title)) > 0),
  platform    TEXT,
  genre       TEXT,
  status      TEXT NOT NULL DEFAULT 'backlog'
              CHECK (status IN ('backlog', 'playing', 'completed', 'dropped')),
  favorite    BOOLEAN NOT NULL DEFAULT FALSE,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  cover_url   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hours played (REAL so the driver returns a JS number, not a string).
ALTER TABLE games ADD COLUMN IF NOT EXISTS hours_played REAL
  CHECK (hours_played >= 0 AND hours_played <= 100000);

-- Each game belongs to a user. Added separately so existing databases pick it up.
ALTER TABLE games ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS games_user_idx ON games (user_id);
CREATE INDEX IF NOT EXISTS games_status_idx ON games (status);
CREATE INDEX IF NOT EXISTS games_title_lower_idx ON games (lower(title));

-- Play sessions: a timer per game. ended_at IS NULL means the session is still running.
CREATE TABLE IF NOT EXISTS play_sessions (
  id                SERIAL PRIMARY KEY,
  user_id           INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  game_id           INT NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at          TIMESTAMPTZ,
  duration_minutes  INT CHECK (duration_minutes >= 0),
  note              TEXT,
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS play_sessions_user_idx ON play_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS play_sessions_game_idx ON play_sessions (game_id, started_at DESC);

-- At most one running session per user.
CREATE UNIQUE INDEX IF NOT EXISTS play_sessions_one_active_idx ON play_sessions (user_id) WHERE ended_at IS NULL;

-- Achievements a user has unlocked. Definitions live in src/achievements.js.
-- The primary key (user_id first) also serves as the index for the user_id foreign key.
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id      INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, code)
);

-- Link that opens the game itself (steam://rungameid/..., an Android intent, a launcher link...).
ALTER TABLE games ADD COLUMN IF NOT EXISTS launch_url TEXT;

-- Wishlist: games you want but don't have yet. Re-created so the list of statuses can grow.
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_status_check;
ALTER TABLE games ADD CONSTRAINT games_status_check
  CHECK (status IN ('backlog', 'playing', 'completed', 'dropped', 'wishlist'));

-- Onboarding and preferences.
-- Existing accounts count as onboarded (DEFAULT true when the column is added);
-- accounts created afterwards start at false and see the welcome flow.
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ALTER COLUMN onboarding_completed SET DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_platforms TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_genres TEXT[] NOT NULL DEFAULT '{}';
