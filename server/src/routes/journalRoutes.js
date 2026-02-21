import { Router } from 'express'
import {
    getJournalEntries,
    upsertJournalEntry,
} from '../controllers/journalController.js'

const router = Router()

router.get('/', getJournalEntries)
router.post('/', upsertJournalEntry)

export default router
