export function computeNextRunDate({ frequency, interval = 1, fromDate }) {
  const date = new Date(fromDate);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid fromDate');

  const next = new Date(date);
  if (frequency === 'weekly') {
    next.setUTCDate(next.getUTCDate() + 7 * interval);
  } else if (frequency === 'biweekly') {
    next.setUTCDate(next.getUTCDate() + 14 * interval);
  } else if (frequency === 'monthly') {
    next.setUTCMonth(next.getUTCMonth() + interval);
  } else {
    throw new Error('Invalid frequency');
  }
  return next;
}

export function isDue(recurring, asOf = new Date()) {
  if (!recurring.active) return false;
  if (recurring.endDate && new Date(recurring.endDate) < asOf) return false;
  return new Date(recurring.nextRunDate) <= asOf;
}
