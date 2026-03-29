import mongoose from 'mongoose';

const dependencySchema = new mongoose.Schema(
  {
    blockedByItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem', required: true }
  },
  { _id: false }
);

const recurrenceSchema = new mongoose.Schema(
  {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    interval: { type: Number, default: 1 },
    weekdays: [{ type: Number, min: 0, max: 6 }],
    dayOfMonth: { type: Number, min: 1, max: 31 }
  },
  { _id: false }
);

const workItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['goal', 'project', 'milestone', 'task', 'subtask'],
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['not_started', 'in_progress', 'blocked', 'done'], default: 'not_started' },
    priority: { type: String, enum: ['none', 'low', 'med', 'high', 'very_high'], default: 'none' },
    dueDate: { type: Date },
    estimatedMinutes: { type: Number, min: 0 },
    notes: { type: String, default: '' },
    recurrence: recurrenceSchema,
    dependencies: [dependencySchema],
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem', index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem', index: true },
    parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkItem', index: true },
    targetDate: { type: Date },
    plannedDate: { type: String, index: true },
    progress: { type: Number, min: 0, max: 100, default: 0 }
  },
  { timestamps: true }
);

workItemSchema.index({ userId: 1, type: 1, status: 1 });
workItemSchema.index({ userId: 1, dueDate: 1 });

const WorkItem = mongoose.model('WorkItem', workItemSchema);
export default WorkItem;
