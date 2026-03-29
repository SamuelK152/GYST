import express from 'express';
import mongoose from 'mongoose';

import { requireAuth } from '../middleware/auth.js';
import WorkItem from '../models/WorkItem.js';
import { dateKey } from '../utils.js';
import { recordScoreOnce } from '../lib/score.js';
import { validateWorkItemPayload } from '../lib/validation.js';

const router = express.Router();
router.use(requireAuth);

function canHaveRecurrence(type) {
  return type === 'task' || type === 'subtask';
}

function completionTypeFor(itemType) {
  if (itemType === 'goal') return 'goal_complete';
  if (itemType === 'project') return 'project_complete';
  if (itemType === 'task' || itemType === 'subtask') return 'task_complete';
  return null;
}

function sanitizeDependenciesForSelf(dependencies, selfId) {
  if (!Array.isArray(dependencies)) return [];
  return dependencies.filter((dep) => String(dep.blockedByItemId) !== String(selfId));
}

async function decorateWithDependencyState(userId, rows) {
  const allDependencyIds = [
    ...new Set(
      rows
        .flatMap((item) => item.dependencies || [])
        .map((dep) => String(dep.blockedByItemId || ''))
        .filter(Boolean)
    )
  ];

  const dependencyItems = await WorkItem.find({ userId, _id: { $in: allDependencyIds } })
    .select('_id title status type')
    .lean();
  const depMap = new Map(dependencyItems.map((item) => [String(item._id), item]));

  return rows.map((item) => {
    const blockers = (item.dependencies || [])
      .map((dep) => depMap.get(String(dep.blockedByItemId)))
      .filter(Boolean);

    const unresolvedBlockers = blockers.filter((b) => b.status !== 'done');

    return {
      ...item,
      dependencyState: {
        total: blockers.length,
        unresolved: unresolvedBlockers.length,
        blocked: unresolvedBlockers.length > 0,
        blockers: unresolvedBlockers.map((b) => ({
          id: b._id,
          title: b.title,
          status: b.status,
          type: b.type
        }))
      }
    };
  });
}

router.get('/items', async (req, res) => {
  const { type, status, plannedDate } = req.query;
  const filter = { userId: req.user._id };
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (plannedDate) filter.plannedDate = String(plannedDate);

  const rows = await WorkItem.find(filter).sort({ createdAt: -1 }).lean();
  const decorated = await decorateWithDependencyState(req.user._id, rows);
  res.json(decorated);
});

router.get('/dependency-candidates', async (req, res) => {
  const { itemId } = req.query;
  const filter = { userId: req.user._id };
  if (itemId && mongoose.Types.ObjectId.isValid(String(itemId))) {
    filter._id = { $ne: String(itemId) };
  }

  const rows = await WorkItem.find(filter).select('_id title type status').sort({ updatedAt: -1 }).limit(300).lean();
  res.json(rows);
});

router.post('/items', async (req, res) => {
  const { errors, data } = validateWorkItemPayload(req.body || {}, { partial: false });
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (!canHaveRecurrence(data.type)) {
    data.recurrence = undefined;
  }

  const item = await WorkItem.create({ ...data, userId: req.user._id });
  res.status(201).json(item);
});

router.patch('/items/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }

  const existing = await WorkItem.findOne({ _id: req.params.id, userId: req.user._id });
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const { errors, data } = validateWorkItemPayload(req.body || {}, { partial: true });
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (!canHaveRecurrence(existing.type)) {
    delete data.recurrence;
  }

  if (data.dependencies) {
    data.dependencies = sanitizeDependenciesForSelf(data.dependencies, existing._id);
  }

  const previousStatus = existing.status;
  Object.assign(existing, data);
  await existing.save();

  const scoreType = completionTypeFor(existing.type);
  if (previousStatus !== 'done' && existing.status === 'done' && scoreType) {
    await recordScoreOnce({
      userId: req.user._id,
      type: scoreType,
      date: dateKey(),
      metadata: { itemId: existing._id, title: existing.title }
    });
  }

  const children = await WorkItem.find({
    userId: req.user._id,
    $or: [{ goalId: existing._id }, { projectId: existing._id }, { parentTaskId: existing._id }]
  })
    .select('_id status type')
    .lean();

  const hasChildren = children.length > 0;
  const allChildrenDone = hasChildren && children.every((c) => c.status === 'done');

  res.json({
    item: existing,
    completionPrompt: allChildrenDone
      ? { show: true, message: `All child items are done. Mark \"${existing.title}\" complete?` }
      : { show: false }
  });
});

router.patch('/items/:id/plan', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }
  const plannedDate = String(req.body?.plannedDate || '').trim();
  if (plannedDate && !/^\d{4}-\d{2}-\d{2}$/.test(plannedDate)) {
    return res.status(400).json({ error: 'plannedDate must be YYYY-MM-DD' });
  }

  const item = await WorkItem.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { plannedDate: plannedDate || null },
    { new: true }
  );
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

router.delete('/items/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid item id' });
  }
  const deleted = await WorkItem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!deleted) return res.status(404).json({ error: 'Item not found' });
  res.status(204).send();
});

router.get('/board', async (req, res) => {
  const tasks = await WorkItem.find({ userId: req.user._id, type: { $in: ['task', 'subtask'] } })
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const decorated = await decorateWithDependencyState(req.user._id, tasks);

  const columns = {
    not_started: decorated.filter((t) => t.status === 'not_started'),
    in_progress: decorated.filter((t) => t.status === 'in_progress'),
    blocked: decorated.filter((t) => t.status === 'blocked'),
    done: decorated.filter((t) => t.status === 'done')
  };

  res.json(columns);
});

export default router;
