import mongoose from 'mongoose';

const recurringTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceAccount', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly'], required: true },
    interval: { type: Number, min: 1, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    nextRunDate: { type: Date, required: true, index: true },
    autoCreate: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    linkedDebtId: { type: mongoose.Schema.Types.ObjectId, ref: 'Debt', default: null }
  },
  { timestamps: true }
);

recurringTransactionSchema.index({ userId: 1, active: 1, nextRunDate: 1 });

const RecurringTransaction = mongoose.model('RecurringTransaction', recurringTransactionSchema);
export default RecurringTransaction;
