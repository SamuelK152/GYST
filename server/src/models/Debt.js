import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    principal: { type: Number, min: 0, default: 0 },
    interest: { type: Number, min: 0, default: 0 },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const debtSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    lender: { type: String, default: '' },
    originalAmount: { type: Number, required: true, min: 0 },
    currentBalance: { type: Number, required: true, min: 0 },
    apr: { type: Number, min: 0, default: 0 },
    minimumPayment: { type: Number, min: 0, default: 0 },
    dueDay: { type: Number, min: 1, max: 31, default: 1 },
    startDate: { type: Date, default: null },
    targetPayoffDate: { type: Date, default: null },
    status: { type: String, enum: ['active', 'paid_off'], default: 'active' },
    notes: { type: String, default: '' },
    payments: [paymentSchema]
  },
  { timestamps: true }
);

const Debt = mongoose.model('Debt', debtSchema);
export default Debt;
