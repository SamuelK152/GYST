import { Router } from 'express'
import {
    createFinanceEntry,
    deleteFinanceEntry,
    getFinanceEntries,
    updateFinanceEntry,
} from '../controllers/financeController.js'

const router = Router()

router.get('/', getFinanceEntries)
router.post('/', createFinanceEntry)
router.patch('/:id', updateFinanceEntry)
router.delete('/:id', deleteFinanceEntry)

export default router
