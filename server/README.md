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
