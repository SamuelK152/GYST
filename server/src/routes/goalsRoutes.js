import { Router } from 'express'
import {
    createGoal,
    deleteGoal,
    getGoals,
    updateGoal,
} from '../controllers/goalsController.js'

const router = Router()

router.get('/', getGoals)
router.post('/', createGoal)
router.patch('/:id', updateGoal)
router.delete('/:id', deleteGoal)

export default router
