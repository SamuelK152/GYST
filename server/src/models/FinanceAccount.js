import mongoose from 'mongoose';

const financeAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const FinanceAccount = mongoose.model('FinanceAccount', financeAccountSchema);
export default FinanceAccount;
