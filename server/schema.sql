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
    UNIQUE(user_id, challenge_id)
);
