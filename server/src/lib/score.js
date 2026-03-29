import ScoreEvent from '../models/ScoreEvent.js';
import { dateKey, SCORE_VALUES } from '../utils.js';

const DUPLICATE_RULES = {
  goal_complete: (meta) => ({ 'metadata.itemId': meta.itemId }),
  project_complete: (meta) => ({ 'metadata.itemId': meta.itemId }),
  task_complete: (meta) => ({ 'metadata.itemId': meta.itemId }),
  habit_complete: (meta) => ({ 'metadata.habitId': meta.habitId }),
  budget_adherence: () => ({}),
  journal_complete: () => ({})
};

export async function recordScoreOnce({ userId, type, date = dateKey(), metadata = {} }) {
  const points = SCORE_VALUES[type];
  if (points === undefined) return null;

  const duplicateFilterFn = DUPLICATE_RULES[type] || (() => ({}));
  const duplicateFilter = duplicateFilterFn(metadata);

  const existing = await ScoreEvent.findOne({ userId, date, type, ...duplicateFilter }).lean();
  if (existing) return existing;

  return ScoreEvent.create({ userId, date, type, points, metadata });
}

export async function aggregateScore({ userId, from }) {
  const filter = { userId };
  if (from) filter.createdAt = { $gte: from };

  const events = await ScoreEvent.find(filter).lean();
  return events.reduce(
    (acc, event) => {
      acc.total += event.points;
      acc.breakdown[event.type] = (acc.breakdown[event.type] || 0) + event.points;
      return acc;
    },
    { total: 0, breakdown: {}, events }
  );
}
