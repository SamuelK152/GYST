import { Router } from 'express'
import {
    createFinanceEntry,
    deleteFinanceEntry,
    getFinanceEntries,
} from '../controllers/financeController.js'

const router = Router()

router.get('/', getFinanceEntries)
router.post('/', createFinanceEntry)
router.delete('/:id', deleteFinanceEntry)

export default router
