import mongoose from 'mongoose'

const JournalEntrySchema = new mongoose.Schema(
    {
        date: { type: String, required: true, unique: true },
        content: { type: String, default: '' },
        mood: { type: String },
    },
    { timestamps: true },
)

export default mongoose.model('JournalEntry', JournalEntrySchema)
