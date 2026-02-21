import mongoose from 'mongoose'

const FinanceEntrySchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['income', 'expense'], required: true },
        amount: { type: Number, required: true },
        category: { type: String, required: true },
        date: { type: String, required: true },
        notes: { type: String },
    },
    { timestamps: true },
)

export default mongoose.model('FinanceEntry', FinanceEntrySchema)
