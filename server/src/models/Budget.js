import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cadence: { type: String, enum: ['weekly', 'monthly'], required: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, cadence: 1, startDate: 1, endDate: 1 });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
