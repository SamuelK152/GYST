import FinanceEntry from '../models/FinanceEntry.js'

export const getFinanceEntries = async (req, res) => {
    const entries = await FinanceEntry.find().sort({ date: -1 })
    res.json(entries)
}

export const createFinanceEntry = async (req, res) => {
    const entry = await FinanceEntry.create(req.body)
    res.status(201).json(entry)
}

export const deleteFinanceEntry = async (req, res) => {
    await FinanceEntry.findByIdAndDelete(req.params.id)
    res.status(204).end()
}
