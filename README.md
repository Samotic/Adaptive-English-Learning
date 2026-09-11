# Adaptive English Learning

An adaptive English learning platform: students practise reading, writing, listening and speaking,
the system estimates their ability (IRT θ) after every answer and recommends modules at the right
level. Teachers track progress and review answers; admins manage users, privacy and the AI model.

**Stack:** React 18 + Vite · Node.js (Express) · MongoDB (Mongoose) · Google Gemini (optional)

## Quick start

Prerequisites: **Node.js 20+** and **MongoDB** (local install, `docker compose up -d`, or MongoDB Atlas).

```bash
npm install                                  # installs server and client (npm workspaces)
cp server/.env.example server/.env           # then set JWT_SECRET (and MONGODB_URI if not local)
npm run seed                                 # questions, modules, badges and demo accounts
npm run dev                                  # server on :4000, client on http://localhost:5173
```

Demo accounts created by `npm run seed` (only when the database has no users), all with password
`password123`: `student_demo`, `teacher_demo`, `admin_demo`.

## Scripts

| Command (root) | What it does |
|---|---|
| `npm run dev` | Server (auto-restart) and client dev server together |
| `npm test` | Server unit + API integration tests (needs MongoDB; uses a throwaway database) |
| `npm run build` | Production client build (`client/dist`) |
| `npm start` | Start the server |
| `npm run seed` | Load course content, badges and demo accounts |

More server scripts (`npm run <name> --workspace server`): `seed:all`, `seed:free-text`,
`seed:demo-users`, `reset` (**deletes all data**), `content:stats`, `debug:db`, `retrain`.

## Configuration

All server settings are documented in [`server/.env.example`](server/.env.example). The important ones:

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI`, `MONGODB_DB` | yes | Database connection (default database `english`) |
| `JWT_SECRET` | production | Signs login tokens. The server refuses to start in production without it |
| `CLIENT_ORIGIN`, `APP_URL` | deployed | CORS origin and links in emails |
| `GEMINI_API_KEY` | no | AI assistant, explanations and feedback (fallback text without it) |
| `GOOGLE_CLIENT_ID` | no | Enables "Continue with Google" |
| `SMTP_HOST` … | no | Email notifications and verification emails |

The client needs no configuration in development (Vite proxies `/api`). See `client/.env.example`
for hosting the client separately.

## Deployment

Single server: `npm run build`, then run the server with `NODE_ENV=production`, `SERVE_CLIENT=true`,
a strong `JWT_SECRET` and `TRUST_PROXY=1` when behind a proxy. The server then serves the client
build and the API from one origin.

Separate hosting: deploy `client/dist` to a static host with SPA fallback, build it with
`VITE_API_URL=https://your-api`, and set `CLIENT_ORIGIN` on the server to the client's URL.

## Project structure

```
client/                 React app
  src/api.js            API client (base URL, auth token, expired-session handling)
  src/pages/            Student, teacher and admin pages
  src/utils/            Offline answer queue / background sync, training data tracker
  public/sw.js          Service worker (offline app shell)
server/
  src/index.js          Startup (database, badges, retention jobs, HTTP server)
  src/app.js            Express app: security middleware and route mounting
  src/routes/           One router per feature area
  src/middleware/       Authentication/roles and error handling
  src/services/         Business logic (adaptive engine, grading, reports, GDPR, AI…)
  src/models/           Mongoose schemas
  scripts/              Seeding and maintenance scripts
  tests/                node:test unit and API tests
docs/                   Project reports (see note below)
mongo-init.js           Database init script (used by docker-compose)
```

## Feature status

Implemented and covered by tests where noted:

- **Adaptive learning** — IRT-style ability estimate updated after each answer, spaced repetition,
  learning path by level, initial path from diagnostic scores, regeneration by weak skills. *(tested)*
- **Assessment** — answers are graded on the server; answer keys are never sent to the browser.
  Objective answers, rule-based free-text grading against the answer key, speech transcripts.
  Low-confidence free-text grades go to a **teacher review queue**. *(tested)*
- **Teacher dashboard** — class overview with rule-based at-risk flags, CSV and PDF export,
  review queue. *(tested)*
- **Assignments & calendar**, **badges & leaderboard**, **support tickets**, **in-app notifications**
  (stored in MongoDB) with optional **email** via SMTP. *(tested)*
- **Privacy (GDPR/KVKK)** — data export, account deletion (anonymized audit trail), consent management;
  interaction data for model training is **opt-in** and retention jobs delete old data. *(tested)*
- **Security** — JWT with expiry, role-based access on every endpoint, rate-limited login, Helmet
  headers, input validation, audit logs.
- **Google sign-in** (ID tokens verified with Google), **offline support** (service worker +
  answers queued offline and synced later), **monitoring** dashboard, **ML Ops** (IRT difficulty
  recalibration from collected answers, versioning, deploy), **AI assistant** (Gemini).

Not implemented yet:

- UI translations — the interface is English only (lesson content supports translations).
- Classes/enrollment — teachers see all students.
- Password reset, SMS/push notifications, LMS integrations (`lmsService` is a placeholder that is not
  wired to any route), pronunciation/phonetic scoring, field-level encryption at rest.
- Automated test coverage for the React client.

> The reports in `docs/` were written during the project and some describe planned features as
> complete. This section reflects the code as it is.

## License

[MIT](LICENSE)
