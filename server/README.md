# Gyst Server

Express + MongoDB backend for the Gyst MERN productivity suite.

## Features

- REST API for tasks, goals, journal entries, and finance entries
- MongoDB data models for each domain
- CORS configured for the client origin

## Scripts

- Install dependencies: npm install
- Start dev server: npm run dev
- Start production server: npm start

## Environment

Copy .env.example to .env and update values as needed.

Required variables:

- PORT
- MONGODB_URI
- CLIENT_ORIGIN

`CLIENT_ORIGIN` can be a comma-separated list so local and production frontends both work.
Example: `http://localhost:5173,https://<github-username>.github.io/<repo-name>`

Quick setup:

1. `cp .env.example .env` (or create `.env` manually on Windows).
2. Set `MONGODB_URI` in `.env`.
3. Run `npm install`.
4. Run `npm run dev` from the `server` folder.

If you see `EADDRINUSE` on port `5000`, either stop the process already using that port or change `PORT` in `.env`.

## Routes

- GET /api/health
- GET /api/tasks
- POST /api/tasks
- PATCH /api/tasks/:id
- DELETE /api/tasks/:id

- GET /api/goals
- POST /api/goals
- PATCH /api/goals/:id
- DELETE /api/goals/:id

- GET /api/journal
- POST /api/journal

- GET /api/finance
- POST /api/finance
- DELETE /api/finance/:id
