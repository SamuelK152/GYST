import mongoose from 'mongoose';

const scoreEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['goal_complete', 'project_complete', 'task_complete', 'habit_complete', 'budget_adherence', 'journal_complete'],
      required: true
    },
    points: { type: Number, required: true },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

scoreEventSchema.index({ userId: 1, date: 1, type: 1 });

const ScoreEvent = mongoose.model('ScoreEvent', scoreEventSchema);
export default ScoreEvent;
