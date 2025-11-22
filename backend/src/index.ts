import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { runMigrations } from './utils/migrate.js'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import skillRoutes from './routes/skills'
import userSkillRoutes from './routes/user-skills'
import teamRoleRoutes from './routes/team-roles'
import userTeamRoleRoutes from './routes/user-team-roles'
import userProfileRoutes from './routes/user-profiles'
import activityRoutes from './routes/activities'
import programRoutes from './routes/programs'
import timeEntryRoutes from './routes/time-entries'
import assignmentRoutes from './routes/assignments'
import recommendationRoutes from './routes/recommendations'
import scheduleRoutes from './routes/schedules'
import kpiRoutes from './routes/kpis'
import notificationRoutes from './routes/notifications'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json())

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Resource-A-Tron API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/user-skills', userSkillRoutes)
app.use('/api/team-roles', teamRoleRoutes)
app.use('/api/user-team-roles', userTeamRoleRoutes)
app.use('/api/user-profiles', userProfileRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/programs', programRoutes)
app.use('/api/time-entries', timeEntryRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/recommendations', recommendationRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/kpis', kpiRoutes)
app.use('/api/notifications', notificationRoutes)

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist')
  app.use(express.static(frontendPath))
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'))
    }
  })
}

// Run migrations on startup in production (optional)
if (process.env.NODE_ENV === 'production' && process.env.RUN_MIGRATIONS === 'true') {
  runMigrations().finally(() => {
    startServer()
  })
} else {
  startServer()
}

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

