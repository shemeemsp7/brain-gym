# CLAUDE.md

Brain Gym ("Logic Ascendarium") — a gamified platform for training programming logic. Users solve AI-generated challenges in pseudocode, get LLM-graded feedback, and earn karate belts. Next.js (Pages Router) + PostgreSQL + NextAuth, LLM calls routed through a Portkey gateway.

## Commands

```bash
npm run dev     # dev server on :3000 (needs .env.local and a local Postgres)
npm run build   # production build (also type/lint checks)
npm run lint    # ESLint (next/core-web-vitals; no-console warns)
```

No test suite yet. Verify changes with `npm run build` + `npm run lint` at minimum.

Local setup: copy `.env.local.example` → `.env.local`, create the DB (`createdb ascendarium`), apply `server/schema.sql`.

## Architecture

**Frontend** — `pages/index.js` renders `components/App.jsx`, which does view switching via state (no router pages per view). Views: GamePage (challenge play), LeaderboardPage, ReviewChallenges, AdminPage, Login/RegisterPage. MUI + plain CSS in `styles/`. All backend calls go through `src/challenge/apiService.js`.

**API routes** (`pages/api/`) — all business logic lives here:
- `challenge.js` / `clarify.js` / `feedback.js` — LLM-backed. Flow: build prompt from a template → `chatCompletion()` → parse JSON response. The user identity in prompts comes from the **session** (`req.user`), never from the request body.
- `user-challenge.js` — saves an attempt: upserts the challenge row (deduped by whitespace-normalized prompt + difficulty), upserts `user_challenges`, then recomputes and persists the belt.
- `leaderboard.js` — computes belts/scores for all users in JS; `?all=true` is admin-only.
- `auth/register.js` — credentials signup. Role is always `'user'` (never accept role from the client); id via `crypto.randomUUID()`.
- `auth/[...nextauth].js` — NextAuth with Credentials + Google + GitHub providers, JWT sessions. Social logins are upserted into `users` in the `signIn` event.

**Key modules:**
- `lib/auth.js` — `withAuth(handler, {enforceUserId})` wrapper. Attaches `req.user`/`req.session`. With `enforceUserId`, **every** user id present in body/query must match the session user (admin may override). Headers are deliberately ignored for authorization — keep it that way.
- `src/belt.js` — single source of truth for belt thresholds (`computeBelt`, `getBeltStats`, `getBeltForUser`). Belt rules are documented in `BELT_RULES.md`. Never duplicate the threshold ladder elsewhere.
- `src/rateLimit.js` — in-memory fixed-window limiter (`withRateLimit`). Applied: register 5/min, login 10/min, LLM routes 20/min. Single-replica only; swap for Redis/gateway if scaling out.
- `src/llmClient.js` — `chatCompletion(prompt)` via Portkey (`PORTKEY_BASE_URL`, `PORTKEY_MODEL`).
- `src/challenge/prompts.js` — renders `src/challenge/prompt-templates/*.txt` ({{placeholders}}). Templates are read from `process.cwd()` at runtime — they must ship in the Docker image (the Dockerfile copies them explicitly).
- `src/config.js` — the only config module (client-safe `NEXT_PUBLIC_*` values + server-only DB/Portkey values).
- `db.js` — pg Pool; `query(text, params)`.

**Data model** (`server/schema.sql`, mirrored in `kubernets/postgres-init-job.yaml` — keep both in sync): `users` (TEXT id, role, belt cache), `challenges` (prompt bank), `user_challenges` (attempts; UNIQUE(user_id, challenge_id); evaluation strings like `'correct'`, `'partially correct'` drive belt stats).

## Conventions & guardrails

- **Prompt templates treat all user input as untrusted** — challenge/solution/question text is fenced and the model is instructed to ignore embedded instructions. Preserve this pattern in any new template.
- **Never return `err.message` to clients.** Log server-side (`console.error`), respond with a generic message.
- **Debug logging** goes through the `DEBUG === "true"` gate and must never include password hashes, tokens, or full DB rows.
- **Secrets are never committed**: `.env.local` is gitignored; k8s pull/app secrets are created out-of-band (`.gitignore` blocks `kubernets/*secret*.yaml`; `deploy.sh` checks and instructs). `.env.local.example` must contain placeholders only.
- All SQL uses parameterized queries (`$1, $2, …`) — no string interpolation, ever.
- `PROJECT_REVIEW.md` and `doc/` hold internal notes/ideas; `PROJECT_REVIEW.md` is deliberately gitignored.

## Deployment

Multi-stage `Dockerfile` (node:22-alpine, non-root, healthcheck on `/api/health`). Kubernetes manifests in `kubernets/` (note the folder-name typo is intentional/legacy) with Istio gateway/virtualservice; `kubernets/deploy.sh` orders the apply steps. Domains in manifests are `example.com` placeholders — parameterize before real deploys. CI: `.github/workflows/docker-build.yml` builds/pushes the image (push trigger currently disabled; PR + manual dispatch).

## graphify (knowledge graph)

This project has a pre-built knowledge graph at `graphify-out/` (god nodes, community structure, cross-file relationships). **The user will never mention graphify — you decide when to use it.** Treat it as your first search tool for understanding-type work, the same way you'd instinctively reach for grep.

**Reach for the graph on your own whenever the task involves understanding structure or relationships** — any of these shapes, regardless of how the user words it:
- "How does X work?" / "Where is Y handled?" / "What happens when…?" → `graphify query "<their question>"`
- "What uses/calls/depends on X?" / "If I change X, what breaks?" → `graphify query`, or `graphify path "<A>" "<B>"` when two endpoints are named
- "What is X?" / explain a module or concept → `graphify explain "<concept>"`
- Onboarding-style or architecture-wide questions → `graphify-out/GRAPH_REPORT.md`
- Before a refactor touching multiple files → query the blast radius first

These return a scoped subgraph — usually far cheaper and more complete than grep + reading files one by one. Fall back to grep/Read when the graph result is too thin, and for tasks where the graph adds nothing (writing new isolated code, editing a single known file, running commands, fixing an error whose location is already in the message).

Housekeeping:
- If `graphify-out/graph.json` is missing, just use normal search — don't rebuild unless asked.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
