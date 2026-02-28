import mongoose from 'mongoose'

const FinanceEntrySchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['income', 'expense'], required: true },
        amount: { type: Number },
        anticipatedAmount: { type: Number, default: 0 },
        actualAmount: { type: Number, default: 0 },
        category: { type: String, required: true },
        date: { type: String, required: true },
        notes: { type: String },
        description: { type: String },
        recurrence: {
            type: {
                type: String,
                enum: [
                    'once',
                    'daily',
                    'weekly',
                    'monthly',
                    'yearly',
                    'every-x-days',
                    'every-x-weeks',
                    'every-x-months',
                ],
                default: 'once',
            },
            interval: { type: Number, min: 1 },
        },
        exceptions: [{ type: String }],
    },
    { timestamps: true },
)

export default mongoose.model('FinanceEntry', FinanceEntrySchema)
