import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceAccount', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    occurredAt: { type: Date, required: true, index: true },
    notes: { type: String, default: '' },
    linkedItemType: { type: String, enum: ['goal', 'project', 'task', 'income', 'expense', null], default: null },
    linkedItemId: { type: mongoose.Schema.Types.ObjectId, default: null }
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, occurredAt: 1, type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
