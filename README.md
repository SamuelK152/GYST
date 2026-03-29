# Life OS (MERN)

Personal management app for goals, projects, tasks, finances, habits, journal, and analytics.

## Stack
- MongoDB + Mongoose
- Express API
- React + Vite frontend

## Quick start
```bash
cd life-os-mern
npm install
npm run dev
```

## Env
Create `server/.env`:
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/life_os
JWT_SECRET=change_me
CLIENT_ORIGIN=http://localhost:5173
```

Client expects API at `http://localhost:4000/api`.

## V1 modules
- Local auth (username/password)
- Goals / Projects / Tasks / Subtasks / Milestones
- Daily score events
- Habits
- Finance accounts + transactions + budgets + charts
- Freeform journal with entity linking
- Home summary dashboard
