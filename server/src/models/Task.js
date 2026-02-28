import mongoose from 'mongoose'

const TaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String },
        completed: { type: Boolean, default: false },
        notes: { type: String },
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

export default mongoose.model('Task', TaskSchema)
