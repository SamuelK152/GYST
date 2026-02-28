import mongoose from 'mongoose'

const GoalSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        startDate: { type: String },
        targetDate: { type: String, required: true },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        description: { type: String },
    },
    { timestamps: true },
)

export default mongoose.model('Goal', GoalSchema)
