# Brain Gym (Logic Ascendarium)

Brain Gym is a gamified platform for training programming logic. Solve unique, AI-generated challenges in pseudocode, review AI-written solutions for hidden bugs, earn karate belts, climb the leaderboard, and get instant, actionable feedback — no syntax memorization required.

---

## Features

- **Two challenge modes**
  - **💪 Lift** — solve an AI-generated logic challenge from scratch (Easy / Medium / Advanced).
  - **🐛 Spot** — the "AI Code Review Gym": review an AI-written candidate solution, approve it or flag its bugs with a concrete triggering input, and get graded on both your verdict and the quality of your findings.
- **Belt progression system** (White → Black) based on challenge difficulty and quality — see [BELT_RULES.md](BELT_RULES.md).
- **Global leaderboard**, per-difficulty stats, and a daily streak counter.
- **Instant, logic-focused feedback** on every solution, plus a clarity rating for each challenge.
- **Resume and review** past attempts, with personal notes.
- **"Train Honest" integrity system** — Brain Gym can't stop a determined cheater, so instead of hard blocks it nudges: pasting a large chunk of text into the answer box, or submitting an answer that reads as suspiciously AI-polished, triggers a gym-voiced check-in ("whose reps are these?") that the user can simply confirm past. Every flagged action is still allowed to proceed — the goal is to make honesty feel like the point of being here, not to police anyone.
- **Sign in** with email/password, Google, or GitHub (via NextAuth).

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL

### 1. Clone the repository

```bash
git clone git@github.com:shemeemsp7/brain-gym.git
cd brain-gym
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.local.example` to `.env.local` and fill in your database, NextAuth, and Portkey (LLM gateway) credentials:

```bash
cp .env.local.example .env.local
```

### 4. Set up the database

```bash
createdb ascendarium
psql -d ascendarium -f server/schema.sql
```

### 5. Start the development server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

Other useful commands:

```bash
npm run build   # production build (also runs type/lint checks)
npm run lint    # ESLint
```

---

## Belt Progression Rules

Belt thresholds are documented in [BELT_RULES.md](BELT_RULES.md) and implemented in `src/belt.js` — that file is the single source of truth, so the ladder isn't duplicated here.

---

## Project Structure

- `pages/` — Next.js pages and API routes (`pages/api/`: challenge, feedback, clarify, user-challenge, leaderboard, auth, etc.)
- `components/` — React UI components (GamePage, ReviewChallenges, LeaderboardPage, AdminPage, LoginPage, etc.)
- `src/` — shared logic: belt rules, streak calculation, rate limiting, LLM client, prompt templates, integrity messages
- `server/schema.sql` — PostgreSQL schema
- `kubernets/` — Kubernetes manifests and deployment scripts
- `BELT_RULES.md` — belt rules (detailed)
- `.env.local.example` — environment variable template (copy to `.env.local`, never commit the real file)

---

## Development Notes

- All challenge, belt, and leaderboard logic lives in `pages/api/` and `src/`.
- Markdown rendering (challenge prompts, feedback) uses `react-markdown`.
- No test suite yet — verify changes with `npm run build` and `npm run lint` at minimum.

---

## Contributing

1. Fork the repo and create your branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a pull request on GitHub

---

## Contact

For questions, suggestions, or support, open an issue on this repository.
