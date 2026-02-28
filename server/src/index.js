import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import connectDB from './config/db.js'
import tasksRoutes from './routes/tasksRoutes.js'
import goalsRoutes from './routes/goalsRoutes.js'
import journalRoutes from './routes/journalRoutes.js'
import financeRoutes from './routes/financeRoutes.js'

const app = express()

const parseOrigin = (value) => {
    const trimmed = value.trim()
    if (!trimmed) return null

    try {
        return new URL(trimmed).origin
    } catch {
        return trimmed.replace(/\/+$/, '')
    }
}

const allowedOrigins = new Set(
    (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map(parseOrigin)
        .filter(Boolean),
)

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.has(origin)) {
                callback(null, true)
                return
            }
            callback(new Error(`Origin not allowed by CORS: ${origin}`))
        },
    }),
)
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() })
})

app.use('/api/tasks', tasksRoutes)
app.use('/api/goals', goalsRoutes)
app.use('/api/journal', journalRoutes)
app.use('/api/finance', financeRoutes)

const startServer = async () => {
    const port = process.env.PORT || 5000
    await connectDB(process.env.MONGODB_URI)
    app.listen(port, () => {
        console.log(`Server running on port ${port}`)
    })
}

startServer()
