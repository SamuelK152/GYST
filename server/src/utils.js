export function dateKey(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toISOString().slice(0, 10);
}

export function getRangeKey(date, mode = 'day') {
  const d = new Date(date);
  if (mode === 'week') {
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day;
    const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
    return dateKey(weekStart);
  }
  if (mode === 'month') {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return dateKey(d);
}

export const SCORE_VALUES = {
  goal_complete: 100,
  project_complete: 50,
  task_complete: 20,
  habit_complete: 10,
  budget_adherence: 25,
  journal_complete: 10
};
