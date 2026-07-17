# Logic Ascendarium

Logic Ascendarium is a gamified platform for mastering programming logic and algorithmic thinking. Solve unique, AI-generated challenges, earn karate belts, climb the global leaderboard, and get instant, actionable feedback—no syntax memorization required!

---

## Features

- **AI-generated programming challenges** (Easy, Medium, Advanced)
- **Belt progression system** (White → Black) based on challenge quality and difficulty
- **Global leaderboard** (weighted by belt, score, and challenge quality)
- **Instant, logic-focused feedback** on every solution
- **Resume and review** past challenges
- **Personal notes** for each challenge
- **Modern, responsive UI** (React, Next.js, MUI)

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL

### 1. Clone the repository

```bash
git clone <your-gitlab-repo-url>
cd brain-gym
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.local.example` to `.env.local` and set your database credentials:

```
DATABASE_URL=postgres://username:password@localhost:5432/ascendarium
```

### 4. Set up the database

- Create the database:
  ```bash
  createdb ascendarium
  ```
- Run the schema:
  ```bash
  psql -d ascendarium -f ../server/schema.sql
  ```

### 5. Start the development server

```bash
npm run dev
```

- The app will be available at [http://localhost:3000](http://localhost:3000)

---

## Belt Progression Rules

A challenge is considered **completed** for badge purposes only if its `evaluation` is `"correct"` or `"partially correct"` (as determined by AI feedback).

| Belt   | Total Completed | Medium | Advanced | Notes |
|--------|----------------|--------|----------|-------|
| White  | 0              | 0      | 0        | Default for all users |
| Yellow | 1–4            | 0      | 0        | Any difficulty |
| Orange | 5–9            | 0      | 0        | Any difficulty |
| Green  | 10–19          | 2      | 0        | At least 2 Medium |
| Blue   | 20–29          | 5      | 0        | At least 5 Medium |
| Purple | 30–39          | 10     | 2        | At least 10 Medium, 2 Advanced |
| Brown  | 40–49          | 15     | 5        | At least 15 Medium, 5 Advanced |
| Black  | 50+            | 20     | 10       | At least 20 Medium, 10 Advanced |

- Only challenges marked as **correct** or **partially correct** count towards belt progression.
- Medium and Advanced challenges must also be correct or partially correct.

---

## Project Structure

- `backend/` - Next.js API, React components, backend logic
- `backend/pages/api/` - API endpoints (challenge, feedback, leaderboard, user, etc.)
- `backend/components/` - React UI components
- `backend/server/schema.sql` - Database schema
- `backend/BELT_RULES.md` - Belt rules (detailed)
- `backend/.env.local` - Environment variables (not committed)
- `backend/.gitignore` - Ignore node_modules, .next, env files, etc.

---

## Development Notes

- All challenge logic, belt logic, and leaderboard logic are in the backend.
- The UI is fully responsive and works on desktop and mobile.
- For markdown rendering, the app uses `react-markdown`.

---

## Contributing

1. Fork the repo and create your branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Create a merge request on GitLab

---

## License

MIT

---

## Contact

For questions, suggestions, or support, open an issue or contact @shemeem.peerumuhammed on GitLab.



# Docker Build & Push Instructions

To build and push the Docker image for this backend:

1. Login to Docker:
   ```sh
   docker login
   ```

2. Build the Docker image:
   ```sh
   docker build -t shemeemsp7/brain-gym:latest .
   ```

3. Push the image to Docker Hub:
   ```sh
   docker push shemeemsp7/brain-gym:latest
   ```

---