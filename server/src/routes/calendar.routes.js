import express from 'express';

import { requireAuth } from '../middleware/auth.js';
import WorkItem from '../models/WorkItem.js';
import Transaction from '../models/Transaction.js';
import JournalEntry from '../models/JournalEntry.js';

const router = express.Router();
router.use(requireAuth);

function buildCalendarGrid({ year, month = null, mode = 'month', eventsByDate = new Map() }) {
  let start;
  let end;

  if (mode === 'week') {
    start = new Date(Date.UTC(year, month || 0, 1));
    const dow = start.getUTCDay();
    start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() - dow));
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
  } else if (mode === 'year') {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year, 11, 31));
  } else {
    start = new Date(Date.UTC(year, month || 0, 1));
    const monthEnd = new Date(Date.UTC(year, (month || 0) + 1, 0));
    const startDow = start.getUTCDay();
    const endDow = monthEnd.getUTCDay();
    start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() - startDow));
    end = new Date(Date.UTC(monthEnd.getUTCFullYear(), monthEnd.getUTCMonth(), monthEnd.getUTCDate() + (6 - endDow)));
  }

  const days = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const events = eventsByDate.get(date) || { productivity: [], finance: [], journal: [] };
    days.push({
      date,
      dayOfWeek: cursor.getUTCDay(),
      dayOfMonth: cursor.getUTCDate(),
      month: cursor.getUTCMonth(),
      year: cursor.getUTCFullYear(),
      events,
      totals: {
        productivity: events.productivity.length,
        finance: events.finance.length,
        journal: events.journal.length
      }
    });
  }

  if (mode === 'year') {
    const months = Array.from({ length: 12 }, (_, idx) => {
      const monthDays = days.filter((d) => d.month === idx);
      return {
        month: idx,
        weeks: chunkWeeks(monthDays)
      };
    });
    return { mode, months };
  }

  return {
    mode,
    weeks: chunkWeeks(days)
  };
}

function chunkWeeks(days) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function parseSummaryRange(range, dateInput) {
  const allowed = new Set(['day', 'week', 'month', 'year']);
  const safeRange = allowed.has(range) ? range : 'day';

  let anchor = dateInput ? new Date(`${String(dateInput).slice(0, 10)}T00:00:00.000Z`) : new Date();
  if (!Number.isFinite(anchor.getTime())) anchor = new Date();

  const anchorUtc = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()));

  let start;
  let end;

  if (safeRange === 'week') {
    const dow = anchorUtc.getUTCDay();
    start = new Date(Date.UTC(anchorUtc.getUTCFullYear(), anchorUtc.getUTCMonth(), anchorUtc.getUTCDate() - dow));
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6, 23, 59, 59, 999));
  } else if (safeRange === 'month') {
    start = new Date(Date.UTC(anchorUtc.getUTCFullYear(), anchorUtc.getUTCMonth(), 1));
    end = new Date(Date.UTC(anchorUtc.getUTCFullYear(), anchorUtc.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  } else if (safeRange === 'year') {
    start = new Date(Date.UTC(anchorUtc.getUTCFullYear(), 0, 1));
    end = new Date(Date.UTC(anchorUtc.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
  } else {
    start = new Date(Date.UTC(anchorUtc.getUTCFullYear(), anchorUtc.getUTCMonth(), anchorUtc.getUTCDate()));
    end = new Date(Date.UTC(anchorUtc.getUTCFullYear(), anchorUtc.getUTCMonth(), anchorUtc.getUTCDate(), 23, 59, 59, 999));
  }

  return { safeRange, anchor: anchorUtc, start, end };
}

router.get('/', async (req, res) => {
  const { from, to, layers = 'productivity,finance,journal', mode = 'month', year, month } = req.query;
  const start = from ? new Date(String(from)) : new Date('1970-01-01T00:00:00.000Z');
  const end = to ? new Date(String(to)) : new Date('2999-12-31T23:59:59.999Z');

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return res.status(400).json({ error: 'Invalid from/to date' });
  }

  const layerSet = new Set(String(layers).split(',').map((x) => x.trim()));
  const payload = { productivity: [], finance: [], journal: [] };

  if (layerSet.has('productivity')) {
    payload.productivity = await WorkItem.find({
      userId: req.user._id,
      dueDate: { $gte: start, $lte: end }
    })
      .sort({ dueDate: 1 })
      .lean();
  }

  if (layerSet.has('finance')) {
    payload.finance = await Transaction.find({
      userId: req.user._id,
      occurredAt: { $gte: start, $lte: end }
    })
      .sort({ occurredAt: 1 })
      .lean();
  }

  if (layerSet.has('journal')) {
    payload.journal = await JournalEntry.find({ userId: req.user._id, createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: 1 })
      .lean();
  }

  const eventsByDate = new Map();

  function push(layer, date, item) {
    if (!eventsByDate.has(date)) eventsByDate.set(date, { productivity: [], finance: [], journal: [] });
    eventsByDate.get(date)[layer].push(item);
  }

  payload.productivity.forEach((item) => push('productivity', item.dueDate.toISOString().slice(0, 10), item));
  payload.finance.forEach((item) => push('finance', item.occurredAt.toISOString().slice(0, 10), item));
  payload.journal.forEach((item) => {
    const d = item.date || item.createdAt.toISOString().slice(0, 10);
    push('journal', d, item);
  });

  const now = new Date();
  const yearValue = Number(year) || now.getUTCFullYear();
  const monthValue = Number(month);

  const grid = buildCalendarGrid({
    year: yearValue,
    month: Number.isFinite(monthValue) ? monthValue : now.getUTCMonth(),
    mode: String(mode),
    eventsByDate
  });

  res.json({
    mode: grid.mode,
    layers: [...layerSet],
    raw: payload,
    grid
  });
});

router.get('/summary', async (req, res) => {
  const { range = 'day', date } = req.query;
  const { safeRange, start, end, anchor } = parseSummaryRange(String(range), date ? String(date) : null);

  const [tasks, transactions, journals] = await Promise.all([
    WorkItem.find({ userId: req.user._id, dueDate: { $gte: start, $lte: end } })
      .select('title status dueDate type')
      .sort({ dueDate: 1 })
      .lean(),
    Transaction.find({ userId: req.user._id, occurredAt: { $gte: start, $lte: end } })
      .select('type amount category occurredAt')
      .sort({ occurredAt: 1 })
      .lean(),
    JournalEntry.find({ userId: req.user._id, createdAt: { $gte: start, $lte: end } })
      .select('date createdAt content')
      .sort({ createdAt: 1 })
      .lean()
  ]);

  const taskStats = tasks.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === 'done') acc.done += 1;
      else if (item.status === 'in_progress') acc.inProgress += 1;
      else if (item.status === 'blocked') acc.blocked += 1;
      else acc.notStarted += 1;
      return acc;
    },
    { total: 0, done: 0, inProgress: 0, blocked: 0, notStarted: 0 }
  );

  const financeStats = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount || 0;
      else acc.expense += tx.amount || 0;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  financeStats.net = financeStats.income - financeStats.expense;

  const topCategories = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => {
      const key = tx.category || 'Uncategorized';
      acc.set(key, (acc.get(key) || 0) + (tx.amount || 0));
      return acc;
    }, new Map());

  const expenseByCategory = Array.from(topCategories.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  res.json({
    range: safeRange,
    anchorDate: anchor.toISOString().slice(0, 10),
    from: start.toISOString(),
    to: end.toISOString(),
    totals: {
      tasks: taskStats.total,
      journalEntries: journals.length,
      transactions: transactions.length,
      income: financeStats.income,
      expense: financeStats.expense,
      net: financeStats.net
    },
    tasks: {
      ...taskStats,
      completionRate: taskStats.total ? Math.round((taskStats.done / taskStats.total) * 100) : 0,
      upcoming: tasks.slice(0, 8)
    },
    finance: {
      ...financeStats,
      expenseByCategory
    },
    journal: {
      total: journals.length,
      latest: journals.slice(-5).reverse().map((entry) => ({
        date: entry.date || entry.createdAt.toISOString().slice(0, 10),
        preview: (entry.content || '').slice(0, 140)
      }))
    }
  });
});

export default router;
