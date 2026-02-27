# Gyst

Gyst is a MERN stack productivity suite that combines task management, goal setting, daily journaling, and financial tracking with projections.

## GH Pages

https://samuelk152.github.io/GYST/

## Features

- Calendar-first daily planning
- To-do lists with completion tracking
- Goal tracking with target dates and progress
- Journal entries per day
- Financial tracking with income, expense, and projections

## Apps

- client: React + Vite UI
- server: Express + MongoDB API

## Getting Started

1. Install dependencies in both apps.
   - client: npm install
   - server: npm install
2. Create a .env file in the server folder using .env.example.
3. Start the server, then start the client.

## Deploying the Client to GitHub Pages

- A workflow is included at `.github/workflows/deploy-client-pages.yml`.
- In GitHub repo settings, open **Pages** and set **Source** to **GitHub Actions**.
- Push to `main` to trigger deployment.

## API Endpoints

- GET /api/health
- Tasks: /api/tasks
- Goals: /api/goals
- Journal: /api/journal
- Finance: /api/finance
