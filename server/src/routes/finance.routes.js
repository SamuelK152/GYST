import express from 'express';
import mongoose from 'mongoose';

import { requireAuth } from '../middleware/auth.js';
import FinanceAccount from '../models/FinanceAccount.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { dateKey } from '../utils.js';
import {
  validateTransactionPayload,
  validateBudgetPayload,
  validateRecurringTransactionPayload,
  validateDebtPayload
} from '../lib/validation.js';
import { recordScoreOnce } from '../lib/score.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Debt from '../models/Debt.js';
import { computeNextRunDate, isDue } from '../lib/financeSchedule.js';

const router = express.Router();
router.use(requireAuth);

router.get('/accounts', async (req, res) => {
  const accounts = await FinanceAccount.find({ userId: req.user._id }).sort({ createdAt: 1 }).lean();
  res.json(accounts);
});

router.post('/accounts', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  const account = await FinanceAccount.create({
    userId: req.user._id,
    name,
    isDefault: false
  });
  res.status(201).json(account);
});

router.patch('/accounts/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid account id' });
  }

  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  const account = await FinanceAccount.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { name },
    { new: true }
  );
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json(account);
});

router.get('/transactions', async (req, res) => {
  const { from, to, type } = req.query;
  const filter = { userId: req.user._id };
  if (type) {
    if (!['income', 'expense'].includes(String(type))) return res.status(400).json({ error: 'type invalid' });
    filter.type = String(type);
  }
  if (from || to) {
    filter.occurredAt = {};
    if (from) {
      const fromDate = new Date(String(from));
      if (!Number.isFinite(fromDate.getTime())) return res.status(400).json({ error: 'from invalid date' });
      filter.occurredAt.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(String(to));
      if (!Number.isFinite(toDate.getTime())) return res.status(400).json({ error: 'to invalid date' });
      filter.occurredAt.$lte = toDate;
    }
  }

  const rows = await Transaction.find(filter).sort({ occurredAt: -1 }).lean();
  res.json(rows);
});

router.post('/transactions', async (req, res) => {
  const { errors, data } = validateTransactionPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (!mongoose.Types.ObjectId.isValid(data.accountId)) {
    return res.status(400).json({ error: 'Invalid accountId' });
  }

  const account = await FinanceAccount.findOne({ _id: data.accountId, userId: req.user._id }).lean();
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const tx = await Transaction.create({
    ...data,
    occurredAt: data.occurredAt || new Date(),
    userId: req.user._id
  });
  res.status(201).json(tx);
});

router.patch('/transactions/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }

  const { errors, data } = validateTransactionPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (!mongoose.Types.ObjectId.isValid(data.accountId)) {
    return res.status(400).json({ error: 'Invalid accountId' });
  }

  const account = await FinanceAccount.findOne({ _id: data.accountId, userId: req.user._id }).lean();
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const tx = await Transaction.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, data, { new: true });
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  res.json(tx);
});

router.delete('/transactions/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid transaction id' });
  }
  const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) return res.status(404).json({ error: 'Transaction not found' });
  res.status(204).send();
});

router.get('/budgets', async (req, res) => {
  const budgets = await Budget.find({ userId: req.user._id }).sort({ startDate: -1 }).lean();
  res.json(budgets);
});

router.post('/budgets', async (req, res) => {
  const { errors, data } = validateBudgetPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const budget = await Budget.create({ ...data, userId: req.user._id });
  res.status(201).json(budget);
});

router.patch('/budgets/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid budget id' });

  const { errors, data } = validateBudgetPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const budget = await Budget.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, data, { new: true });
  if (!budget) return res.status(404).json({ error: 'Budget not found' });
  res.json(budget);
});

router.delete('/budgets/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid budget id' });

  const deleted = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) return res.status(404).json({ error: 'Budget not found' });
  res.status(204).send();
});

router.get('/recurring', async (req, res) => {
  const rows = await RecurringTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(rows);
});

router.post('/recurring', async (req, res) => {
  const { errors, data } = validateRecurringTransactionPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (!mongoose.Types.ObjectId.isValid(data.accountId)) return res.status(400).json({ error: 'Invalid accountId' });

  const account = await FinanceAccount.findOne({ _id: data.accountId, userId: req.user._id }).lean();
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const recurring = await RecurringTransaction.create({ ...data, userId: req.user._id });
  res.status(201).json(recurring);
});

router.patch('/recurring/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid recurring id' });

  const { errors, data } = validateRecurringTransactionPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const updated = await RecurringTransaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    data,
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: 'Recurring transaction not found' });
  res.json(updated);
});

router.delete('/recurring/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid recurring id' });
  const deleted = await RecurringTransaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) return res.status(404).json({ error: 'Recurring transaction not found' });
  res.status(204).send();
});

router.post('/recurring/run-due', async (req, res) => {
  const now = new Date();
  const recurringRows = await RecurringTransaction.find({ userId: req.user._id, active: true }).lean();
  const dueRows = recurringRows.filter((row) => isDue(row, now));

  const created = [];

  for (const row of dueRows) {
    const tx = await Transaction.create({
      userId: req.user._id,
      accountId: row.accountId,
      type: row.type,
      amount: row.amount,
      category: row.category,
      occurredAt: row.nextRunDate,
      notes: `[Recurring] ${row.name}`,
      linkedItemType: row.type,
      linkedItemId: row.linkedDebtId || null
    });

    created.push(tx);

    const nextRunDate = computeNextRunDate({
      frequency: row.frequency,
      interval: row.interval,
      fromDate: row.nextRunDate
    });

    await RecurringTransaction.updateOne(
      { _id: row._id, userId: req.user._id },
      { $set: { nextRunDate } }
    );

    if (row.linkedDebtId && mongoose.Types.ObjectId.isValid(String(row.linkedDebtId)) && row.type === 'expense') {
      const debt = await Debt.findOne({ _id: row.linkedDebtId, userId: req.user._id });
      if (debt) {
        debt.currentBalance = Math.max(0, debt.currentBalance - row.amount);
        debt.payments.push({
          date: tx.occurredAt,
          amount: row.amount,
          principal: row.amount,
          interest: 0,
          note: `Auto from recurring: ${row.name}`
        });
        if (debt.currentBalance <= 0) debt.status = 'paid_off';
        await debt.save();
      }
    }
  }

  res.json({ createdCount: created.length, created });
});

router.get('/debts', async (req, res) => {
  const debts = await Debt.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(debts);
});

router.post('/debts', async (req, res) => {
  const { errors, data } = validateDebtPayload(req.body || {}, { partial: false });
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const debt = await Debt.create({
    userId: req.user._id,
    ...data,
    currentBalance: data.currentBalance ?? data.originalAmount,
    payments: []
  });
  res.status(201).json(debt);
});

router.patch('/debts/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid debt id' });

  const { errors, data } = validateDebtPayload(req.body || {}, { partial: true });
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const debt = await Debt.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, data, { new: true });
  if (!debt) return res.status(404).json({ error: 'Debt not found' });
  res.json(debt);
});

router.delete('/debts/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid debt id' });

  const deleted = await Debt.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) return res.status(404).json({ error: 'Debt not found' });

  await RecurringTransaction.updateMany(
    { userId: req.user._id, linkedDebtId: req.params.id },
    { $set: { linkedDebtId: null } }
  );

  res.status(204).send();
});

router.post('/debts/:id/payments', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid debt id' });

  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'amount must be > 0' });

  const principal = Number(req.body?.principal || amount);
  const interest = Number(req.body?.interest || 0);
  const date = req.body?.date ? new Date(req.body.date) : new Date();

  if (!Number.isFinite(date.getTime())) return res.status(400).json({ error: 'Invalid date' });

  const debt = await Debt.findOne({ _id: req.params.id, userId: req.user._id });
  if (!debt) return res.status(404).json({ error: 'Debt not found' });

  debt.currentBalance = Math.max(0, debt.currentBalance - principal);
  debt.payments.push({ date, amount, principal, interest, note: String(req.body?.note || '') });
  if (debt.currentBalance <= 0) debt.status = 'paid_off';
  await debt.save();

  res.json(debt);
});

router.get('/analytics/summary', async (req, res) => {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const [txs, budgets] = await Promise.all([
    Transaction.find({ userId: req.user._id, occurredAt: { $gte: monthStart, $lte: monthEnd } }).lean(),
    Budget.find({ userId: req.user._id, cadence: 'monthly', startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } }).lean()
  ]);

  const income = txs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = txs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const byCategoryMap = new Map();
  txs.filter((t) => t.type === 'expense').forEach((t) => {
    byCategoryMap.set(t.category, (byCategoryMap.get(t.category) || 0) + t.amount);
  });
  const spendByCategory = Array.from(byCategoryMap.entries()).map(([category, amount]) => ({ category, amount }));

  const monthlyBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const monthlyProgress = now.getUTCDate() / new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate();
  const burnRate = monthlyBudget > 0 ? Number((expenses / Math.max(1, monthlyBudget * monthlyProgress)).toFixed(2)) : 0;
  const savingsRate = income > 0 ? Number((((income - expenses) / income) * 100).toFixed(2)) : 0;

  const monthlyTrendPromises = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    monthlyTrendPromises.push(
      Transaction.find({ userId: req.user._id, occurredAt: { $gte: start, $lte: end } }).lean().then((rangeTx) => ({
        month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
        income: rangeTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: rangeTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      }))
    );
  }
  const monthlyTrend = await Promise.all(monthlyTrendPromises);

  if (monthlyBudget > 0 && expenses <= monthlyBudget) {
    await recordScoreOnce({
      userId: req.user._id,
      type: 'budget_adherence',
      date: dateKey(),
      metadata: { expenses, monthlyBudget }
    });
  }

  res.json({
    income,
    expenses,
    monthlyBudget,
    burnRate,
    savingsRate,
    spendByCategory,
    monthlyTrend
  });
});

export default router;
