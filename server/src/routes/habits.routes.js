import express from 'express';
import mongoose from 'mongoose';

import { requireAuth } from '../middleware/auth.js';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { dateKey } from '../utils.js';
import { validateHabitPayload, parseNumber } from '../lib/validation.js';
import { recordScoreOnce } from '../lib/score.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(habits);
});

router.post('/', async (req, res) => {
  const { errors, data } = validateHabitPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const habit = await Habit.create({ ...data, userId: req.user._id });
  res.status(201).json(habit);
});

router.patch('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid habit id' });
  }

  const payload = { ...req.body };
  const updates = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || payload.name.trim() === '') {
      return res.status(400).json({ error: 'name must be non-empty' });
    }
    updates.name = payload.name.trim();
  }

  if (payload.targetType !== undefined) {
    if (!['count', 'boolean', 'minutes', 'amount'].includes(payload.targetType)) {
      return res.status(400).json({ error: 'targetType invalid' });
    }
    updates.targetType = payload.targetType;
  }

  if (payload.targetValue !== undefined) {
    const targetValue = parseNumber(payload.targetValue);
    if (targetValue === null || targetValue < 1) return res.status(400).json({ error: 'targetValue must be >= 1' });
    updates.targetValue = targetValue;
  }

  if (payload.active !== undefined) updates.active = Boolean(payload.active);

  const habit = await Habit.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, updates, { new: true });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  res.json(habit);
});

router.post('/:id/log', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid habit id' });
  }

  const date = req.body?.date ? String(req.body.date) : dateKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }

  const value = parseNumber(req.body?.value);
  if (value === null || value < 0) return res.status(400).json({ error: 'value must be >= 0' });

  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const completed = Number(value) >= Number(habit.targetValue);

  const log = await HabitLog.findOneAndUpdate(
    { userId: req.user._id, habitId: habit._id, date },
    { value: Number(value), completed },
    { new: true, upsert: true }
  );

  if (completed) {
    await recordScoreOnce({
      userId: req.user._id,
      type: 'habit_complete',
      date,
      metadata: { habitId: habit._id, habitName: habit.name }
    });
  }

  res.json(log);
});

router.get('/logs/:date', async (req, res) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  const logs = await HabitLog.find({ userId: req.user._id, date: req.params.date }).lean();
  res.json(logs);
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid habit id' });
  }

  const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  await HabitLog.deleteMany({ userId: req.user._id, habitId: req.params.id });
  res.status(204).send();
});

export default router;
