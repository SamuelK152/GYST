import express from 'express';

import { requireAuth } from '../middleware/auth.js';
import WorkItem from '../models/WorkItem.js';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import JournalEntry from '../models/JournalEntry.js';
import { dateKey } from '../utils.js';
import { aggregateScore } from '../lib/score.js';

const router = express.Router();
router.use(requireAuth);

router.get('/home', async (req, res) => {
  const today = dateKey();
  const start = new Date(`${today}T00:00:00.000Z`);
  const end = new Date(`${today}T23:59:59.999Z`);

  const [todaysTasks, goals, habits, habitLogs, budgets, todayExpenses, todayJournal, overdueTasks, schedule] =
    await Promise.all([
      WorkItem.find({ userId: req.user._id, type: { $in: ['task', 'subtask'] }, dueDate: { $gte: start, $lte: end } }).lean(),
      WorkItem.find({ userId: req.user._id, type: 'goal' }).sort({ updatedAt: -1 }).limit(5).lean(),
      Habit.find({ userId: req.user._id, active: true }).lean(),
      HabitLog.find({ userId: req.user._id, date: today }).lean(),
      Budget.find({ userId: req.user._id, cadence: { $in: ['weekly', 'monthly'] } }).lean(),
      Transaction.find({ userId: req.user._id, type: 'expense', occurredAt: { $gte: start, $lte: end } }).lean(),
      JournalEntry.find({ userId: req.user._id, date: today }).lean(),
      WorkItem.find({ userId: req.user._id, type: { $in: ['task', 'subtask'] }, status: { $ne: 'done' }, dueDate: { $lt: start } }).lean(),
      WorkItem.find({ userId: req.user._id, type: { $in: ['task', 'subtask'] }, dueDate: { $gte: start, $lte: end } })
        .sort({ dueDate: 1 })
        .lean()
    ]);

  const todayScore = await aggregateScore({ userId: req.user._id, from: start });

  const habitsWithProgress = habits.map((habit) => {
    const log = habitLogs.find((l) => String(l.habitId) === String(habit._id));
    const value = log?.value || 0;
    const completed = value >= habit.targetValue;
    return {
      ...habit,
      value,
      completed,
      streak: completed ? 1 : 0
    };
  });

  const budgetTodaySpent = todayExpenses.reduce((sum, tx) => sum + tx.amount, 0);

  const alerts = [];
  if (overdueTasks.length > 0) alerts.push({ type: 'overdue_tasks', count: overdueTasks.length, severity: 'high' });
  if (budgetTodaySpent > 0) alerts.push({ type: 'budget_alert', amount: budgetTodaySpent, severity: 'med' });
  if (todaysTasks.length === 0) alerts.push({ type: 'daily_plan', message: 'No tasks planned for today', severity: 'low' });

  res.json({
    today,
    summary: {
      schedule,
      tasks: todaysTasks,
      topGoals: goals,
      habits: habitsWithProgress,
      budgetSnapshot: {
        budgets,
        spentToday: budgetTodaySpent
      },
      journalCompleted: todayJournal.length > 0,
      todayScore: { total: todayScore.total, byType: todayScore.breakdown }
    },
    quickLinks: [
      { key: 'new_task', label: 'Add Task' },
      { key: 'log_expense', label: 'Log Expense' },
      { key: 'new_journal', label: 'New Journal Entry' },
      { key: 'daily_plan', label: 'Plan Day' }
    ],
    alerts
  });
});

router.get('/scores', async (req, res) => {
  const { range = 'daily' } = req.query;
  const now = new Date();

  let start;
  if (range === 'weekly') {
    const day = now.getUTCDay();
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day));
  } else if (range === 'monthly') {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  } else {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  const result = await aggregateScore({ userId: req.user._id, from: start });
  res.json({ range, total: result.total, breakdown: result.breakdown, events: result.events });
});

export default router;
