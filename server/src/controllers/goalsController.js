import Goal from '../models/Goal.js'

export const getGoals = async (req, res) => {
    const goals = await Goal.find().sort({ targetDate: 1 })
    res.json(goals)
}

export const createGoal = async (req, res) => {
    const goal = await Goal.create(req.body)
    res.status(201).json(goal)
}

export const updateGoal = async (req, res) => {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    })
    res.json(goal)
}

export const deleteGoal = async (req, res) => {
    await Goal.findByIdAndDelete(req.params.id)
    res.status(204).end()
}
