import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import workRoutes from './routes/work.routes.js';
import habitsRoutes from './routes/habits.routes.js';
import financeRoutes from './routes/finance.routes.js';
import journalRoutes from './routes/journal.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import calendarRoutes from './routes/calendar.routes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'life-os-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/work', workRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/calendar', calendarRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
