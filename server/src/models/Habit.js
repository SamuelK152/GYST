import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetType: { type: String, enum: ['count', 'boolean', 'minutes', 'amount'], default: 'count' },
    targetValue: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Habit = mongoose.model('Habit', habitSchema);
export default Habit;
