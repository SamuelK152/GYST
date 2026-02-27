# Gyst Client

React + Vite frontend for the Gyst MERN productivity suite.

## Features

- Calendar view with daily task list
- Goal tracking with progress sliders
- Daily journal entries
- Financial tracking and projections

## Scripts

- Install dependencies: npm install
- Start dev server: npm run dev
- Build for production: npm run build

## Deploy to GitHub Pages

This project deploys with GitHub Actions using the workflow at `.github/workflows/deploy-client-pages.yml`.

One-time setup in your GitHub repo:

1. Open **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

Then push to the `main` branch to trigger deployment.

## Environment

The client expects the API to be available at http://localhost:5000 by default.
