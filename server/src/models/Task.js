import mongoose from 'mongoose'

const TaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String },
        completed: { type: Boolean, default: false },
        notes: { type: String },
    },
    { timestamps: true },
)

export default mongoose.model('Task', TaskSchema)
