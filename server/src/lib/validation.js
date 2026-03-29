export const WORK_TYPES = ['goal', 'project', 'milestone', 'task', 'subtask'];
export const WORK_STATUSES = ['not_started', 'in_progress', 'blocked', 'done'];
export const PRIORITY_VALUES = ['none', 'low', 'med', 'high', 'very_high'];

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isValidISODate(value) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime());
}

export function normalizeObjectIdString(value) {
  if (!isNonEmptyString(value)) return null;
  return value.trim();
}

export function validateWorkItemPayload(payload, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || payload.type !== undefined) {
    if (!WORK_TYPES.includes(payload.type)) {
      errors.push('type must be one of: goal, project, milestone, task, subtask');
    } else {
      data.type = payload.type;
    }
  }

  if (!partial || payload.title !== undefined) {
    if (!isNonEmptyString(payload.title)) {
      errors.push('title is required');
    } else {
      data.title = payload.title.trim();
    }
  }

  if (payload.description !== undefined) data.description = String(payload.description || '').trim();

  if (!partial || payload.status !== undefined) {
    if (payload.status !== undefined && !WORK_STATUSES.includes(payload.status)) {
      errors.push('status must be one of: not_started, in_progress, blocked, done');
    } else if (payload.status !== undefined) {
      data.status = payload.status;
    }
  }

  if (!partial || payload.priority !== undefined) {
    if (payload.priority !== undefined && !PRIORITY_VALUES.includes(payload.priority)) {
      errors.push('priority must be one of: none, low, med, high, very_high');
    } else if (payload.priority !== undefined) {
      data.priority = payload.priority;
    }
  }

  if (payload.dueDate !== undefined) {
    if (payload.dueDate && !isValidISODate(payload.dueDate)) errors.push('dueDate must be a valid date');
    else data.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }

  if (payload.estimatedMinutes !== undefined) {
    const value = parseNumber(payload.estimatedMinutes);
    if (value !== null && value < 0) errors.push('estimatedMinutes must be >= 0');
    else data.estimatedMinutes = value;
  }

  if (payload.notes !== undefined) data.notes = String(payload.notes || '');
  if (payload.progress !== undefined) {
    const progress = parseNumber(payload.progress);
    if (progress === null || progress < 0 || progress > 100) errors.push('progress must be between 0 and 100');
    else data.progress = progress;
  }

  ['goalId', 'projectId', 'parentTaskId'].forEach((key) => {
    if (payload[key] !== undefined) data[key] = normalizeObjectIdString(payload[key]);
  });

  if (payload.plannedDate !== undefined) {
    const plannedDate = String(payload.plannedDate || '').trim();
    if (plannedDate && !/^\d{4}-\d{2}-\d{2}$/.test(plannedDate)) {
      errors.push('plannedDate must be YYYY-MM-DD');
    } else {
      data.plannedDate = plannedDate || null;
    }
  }

  if (payload.dependencies !== undefined) {
    if (!Array.isArray(payload.dependencies)) {
      errors.push('dependencies must be an array');
    } else {
      const deps = payload.dependencies
        .map((d) => normalizeObjectIdString(d?.blockedByItemId))
        .filter(Boolean)
        .map((blockedByItemId) => ({ blockedByItemId }));
      data.dependencies = deps;
    }
  }

  if (payload.recurrence !== undefined) {
    const recurrence = payload.recurrence || null;
    if (recurrence === null) {
      data.recurrence = null;
    } else {
      const allowedFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
      if (!allowedFrequencies.includes(recurrence.frequency)) {
        errors.push('recurrence.frequency must be daily|weekly|monthly|yearly');
      } else {
        const interval = parseNumber(recurrence.interval);
        if (interval === null || interval < 1) errors.push('recurrence.interval must be >= 1');
        else {
          data.recurrence = {
            frequency: recurrence.frequency,
            interval
          };
        }
      }
    }
  }

  return { errors, data };
}

export function validateHabitPayload(payload) {
  const errors = [];
  const data = {};

  if (!isNonEmptyString(payload.name)) errors.push('name is required');
  else data.name = payload.name.trim();

  const targetType = payload.targetType || 'count';
  if (!['count', 'boolean', 'minutes', 'amount'].includes(targetType)) {
    errors.push('targetType must be count|boolean|minutes|amount');
  } else {
    data.targetType = targetType;
  }

  const targetValue = parseNumber(payload.targetValue);
  if (targetValue === null || targetValue < 1) errors.push('targetValue must be >= 1');
  else data.targetValue = targetValue;

  if (payload.active !== undefined) data.active = Boolean(payload.active);

  return { errors, data };
}

export function validateTransactionPayload(payload) {
  const errors = [];
  const data = {};

  if (!isNonEmptyString(payload.accountId)) errors.push('accountId is required');
  else data.accountId = payload.accountId.trim();

  if (!['income', 'expense'].includes(payload.type)) errors.push('type must be income|expense');
  else data.type = payload.type;

  const amount = parseNumber(payload.amount);
  if (amount === null || amount < 0) errors.push('amount must be >= 0');
  else data.amount = amount;

  if (!isNonEmptyString(payload.category)) errors.push('category is required');
  else data.category = payload.category.trim();

  if (payload.occurredAt !== undefined) {
    if (!isValidISODate(payload.occurredAt)) errors.push('occurredAt must be valid date');
    else data.occurredAt = new Date(payload.occurredAt);
  }

  data.notes = String(payload.notes || '');

  if (payload.linkedItemType !== undefined) data.linkedItemType = payload.linkedItemType;
  if (payload.linkedItemId !== undefined) data.linkedItemId = payload.linkedItemId;

  return { errors, data };
}

export function validateRecurringTransactionPayload(payload) {
  const errors = [];
  const data = {};

  if (!isNonEmptyString(payload.accountId)) errors.push('accountId is required');
  else data.accountId = payload.accountId.trim();

  if (!isNonEmptyString(payload.name)) errors.push('name is required');
  else data.name = payload.name.trim();

  if (!['income', 'expense'].includes(payload.type)) errors.push('type must be income|expense');
  else data.type = payload.type;

  const amount = parseNumber(payload.amount);
  if (amount === null || amount < 0) errors.push('amount must be >= 0');
  else data.amount = amount;

  if (!isNonEmptyString(payload.category)) errors.push('category is required');
  else data.category = payload.category.trim();

  if (!['weekly', 'biweekly', 'monthly'].includes(payload.frequency)) errors.push('frequency must be weekly|biweekly|monthly');
  else data.frequency = payload.frequency;

  const interval = parseNumber(payload.interval ?? 1);
  if (interval === null || interval < 1) errors.push('interval must be >= 1');
  else data.interval = interval;

  if (!isValidISODate(payload.startDate)) errors.push('startDate must be valid date');
  else {
    data.startDate = new Date(payload.startDate);
    data.nextRunDate = new Date(payload.startDate);
  }

  if (payload.endDate !== undefined && payload.endDate !== null && payload.endDate !== '') {
    if (!isValidISODate(payload.endDate)) errors.push('endDate must be valid date');
    else data.endDate = new Date(payload.endDate);
  } else {
    data.endDate = null;
  }

  data.autoCreate = Boolean(payload.autoCreate);
  data.active = payload.active === undefined ? true : Boolean(payload.active);
  data.notes = String(payload.notes || '');
  data.linkedDebtId = payload.linkedDebtId || null;

  return { errors, data };
}

export function validateDebtPayload(payload, { partial = false } = {}) {
  const errors = [];
  const data = {};

  function assignString(key, required = false) {
    if (payload[key] === undefined) return;
    if (!isNonEmptyString(payload[key]) && required) errors.push(`${key} is required`);
    else data[key] = String(payload[key] || '').trim();
  }

  if (!partial || payload.name !== undefined) assignString('name', true);
  if (payload.lender !== undefined) data.lender = String(payload.lender || '').trim();

  ['originalAmount', 'currentBalance', 'apr', 'minimumPayment'].forEach((field) => {
    if (payload[field] !== undefined) {
      const value = parseNumber(payload[field]);
      if (value === null || value < 0) errors.push(`${field} must be >= 0`);
      else data[field] = value;
    }
  });

  if (payload.dueDay !== undefined) {
    const dueDay = parseNumber(payload.dueDay);
    if (dueDay === null || dueDay < 1 || dueDay > 31) errors.push('dueDay must be 1..31');
    else data.dueDay = dueDay;
  }

  ['startDate', 'targetPayoffDate'].forEach((field) => {
    if (payload[field] !== undefined) {
      if (payload[field] === null || payload[field] === '') data[field] = null;
      else if (!isValidISODate(payload[field])) errors.push(`${field} must be valid date`);
      else data[field] = new Date(payload[field]);
    }
  });

  if (payload.status !== undefined) {
    if (!['active', 'paid_off'].includes(payload.status)) errors.push('status must be active|paid_off');
    else data.status = payload.status;
  }

  if (payload.notes !== undefined) data.notes = String(payload.notes || '');

  return { errors, data };
}

export function validateBudgetPayload(payload) {
  const errors = [];
  const data = {};

  if (!['weekly', 'monthly'].includes(payload.cadence)) errors.push('cadence must be weekly|monthly');
  else data.cadence = payload.cadence;

  if (!isNonEmptyString(payload.category)) errors.push('category is required');
  else data.category = payload.category.trim();

  const amount = parseNumber(payload.amount);
  if (amount === null || amount < 0) errors.push('amount must be >= 0');
  else data.amount = amount;

  if (!isValidISODate(payload.startDate)) errors.push('startDate must be valid date');
  else data.startDate = new Date(payload.startDate);

  if (!isValidISODate(payload.endDate)) errors.push('endDate must be valid date');
  else data.endDate = new Date(payload.endDate);

  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    errors.push('startDate must be <= endDate');
  }

  return { errors, data };
}

export function validateJournalPayload(payload) {
  const errors = [];
  const data = {};

  const date = String(payload.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('date must be YYYY-MM-DD');
  else data.date = date;

  if (!isNonEmptyString(payload.content)) errors.push('content is required');
  else data.content = payload.content.trim();

  if (payload.links !== undefined) {
    if (!Array.isArray(payload.links)) {
      errors.push('links must be an array');
    } else {
      const allowed = ['goal', 'project', 'task', 'income', 'expense'];
      const links = [];
      payload.links.forEach((link, idx) => {
        if (!allowed.includes(link?.itemType)) errors.push(`links[${idx}].itemType invalid`);
        if (!isNonEmptyString(link?.itemId)) errors.push(`links[${idx}].itemId required`);
        if (allowed.includes(link?.itemType) && isNonEmptyString(link?.itemId)) {
          links.push({ itemType: link.itemType, itemId: String(link.itemId).trim() });
        }
      });
      data.links = links;
    }
  }

  return { errors, data };
}
