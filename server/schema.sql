-- Users table (already exists)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'user',
    provider TEXT, -- 'credentials', 'google', 'github'
    provider_account_id TEXT,
    image TEXT,
    belt VARCHAR(32) DEFAULT 'white'
);

-- Challenges table (stores challenge prompts)
CREATE TABLE IF NOT EXISTS challenges (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    time_limit INTEGER NOT NULL DEFAULT 60,
    type TEXT NOT NULL DEFAULT 'solve',
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Challenges table (stores user attempts, solution, feedback, evaluation, notes, and remaining_time)
CREATE TABLE IF NOT EXISTS user_challenges (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id TEXT REFERENCES users(id),
    challenge_id BIGINT REFERENCES challenges(id),
    solution TEXT NOT NULL,
    feedback TEXT,
    evaluation TEXT, -- e.g. "correct", "partially correct", "incorrect", "brute force", etc.
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('completed', 'not_completed', 'in_progress')),
    submitted_at TIMESTAMP DEFAULT NOW(),
    remaining_time INTEGER,
    time_taken INTEGER,
    clarity_rating SMALLINT CHECK (clarity_rating BETWEEN 1 AND 5),
    integrity_flags JSONB NOT NULL DEFAULT '[]',
    UNIQUE(user_id, challenge_id)
);

-- Idempotent migrations for databases created before these columns existed.
ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS clarity_rating SMALLINT CHECK (clarity_rating BETWEEN 1 AND 5);
ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS integrity_flags JSONB NOT NULL DEFAULT '[]';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'solve';

-- challenges.type (see doc/AI_CODE_REVIEW_GYM.md): the challenge mode. Values
-- are validated at the API layer (pages/api/challenge.js, user-challenge.js),
-- not by a CHECK constraint, so new modes don't need a migration to unlock.
COMMENT ON COLUMN challenges.type IS
  'Challenge mode: "solve" (default, free-form answer) | "review" (AI Code Review Gym — user reviews a candidate solution). See doc/AI_CODE_REVIEW_GYM.md.';

-- integrity_flags shape (see doc/ANTI_CHEAT_DESIGN.md — "Train Honest"):
-- an append-only JSON array of { flag, at, ...extras }, written by
-- pages/api/user-challenge.js's sanitizeIntegrityEvents(). Never affects
-- scoring/belt; reporting/ledger use only.
--   flag = "paste_confirmed"      extras: { chars: number }
--   flag = "ai_suspect_confirmed" extras: { aiLikelihood: "low"|"medium"|"high", cps: number }
--   flag = "ai_suspect_discarded" extras: { aiLikelihood: "low"|"medium"|"high", cps: number }
-- `at` is always server-stamped (never client-supplied) to prevent forging.
COMMENT ON COLUMN user_challenges.integrity_flags IS
  'Append-only "Train Honest" integrity ledger. Array of {flag, at, ...extras}. flag in (paste_confirmed, ai_suspect_confirmed, ai_suspect_discarded). Never affects scoring/belt — reporting only. See doc/ANTI_CHEAT_DESIGN.md.';
