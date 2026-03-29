import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true, index: true },
    date: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

habitLogSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

const HabitLog = mongoose.model('HabitLog', habitLogSchema);
export default HabitLog;
