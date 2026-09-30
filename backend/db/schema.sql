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
