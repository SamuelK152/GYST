import express from 'express';
import mongoose from 'mongoose';

import { requireAuth } from '../middleware/auth.js';
import JournalEntry from '../models/JournalEntry.js';
import { validateJournalPayload } from '../lib/validation.js';
import { recordScoreOnce } from '../lib/score.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { date } = req.query;
  const filter = { userId: req.user._id };
  if (date) {
    const normalizedDate = String(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }
    filter.date = normalizedDate;
  }

  const entries = await JournalEntry.find(filter).sort({ date: -1, createdAt: -1 }).lean();
  res.json(entries);
});

router.post('/', async (req, res) => {
  const { errors, data } = validateJournalPayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  const entry = await JournalEntry.create({
    userId: req.user._id,
    date: data.date,
    content: data.content,
    links: data.links || []
  });

  await recordScoreOnce({
    userId: req.user._id,
    type: 'journal_complete',
    date: data.date,
    metadata: { entryId: entry._id }
  });

  res.status(201).json(entry);
});

router.patch('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid entry id' });
  }

  const updates = {};
  if (req.body.date !== undefined) {
    const date = String(req.body.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    updates.date = date;
  }

  if (req.body.content !== undefined) {
    if (typeof req.body.content !== 'string' || req.body.content.trim() === '') {
      return res.status(400).json({ error: 'content must be non-empty string' });
    }
    updates.content = req.body.content.trim();
  }

  if (req.body.links !== undefined) {
    if (!Array.isArray(req.body.links)) return res.status(400).json({ error: 'links must be array' });
    updates.links = req.body.links;
  }

  const entry = await JournalEntry.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, updates, {
    new: true
  });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
});

router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid entry id' });
  }

  const deleted = await JournalEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) return res.status(404).json({ error: 'Entry not found' });
  res.status(204).send();
});

export default router;
