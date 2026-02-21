import JournalEntry from '../models/JournalEntry.js'

export const getJournalEntries = async (req, res) => {
    const entries = await JournalEntry.find().sort({ date: -1 })
    res.json(entries)
}

export const upsertJournalEntry = async (req, res) => {
    const { date, content, mood } = req.body
    const entry = await JournalEntry.findOneAndUpdate(
        { date },
        { date, content, mood },
        { upsert: true, new: true },
    )
    res.json(entry)
}
