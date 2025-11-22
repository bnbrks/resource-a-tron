import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'
import { Decimal } from '@prisma/client/runtime/library'

const router = Router()

router.use(authenticate)

const createKPISchema = z.object({
  name: z.string().min(1),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  period: z.string(),
  teamId: z.string().optional(),
})

const updateKPISchema = z.object({
  name: z.string().min(1).optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  period: z.string().optional(),
  teamId: z.string().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { period, teamId } = req.query

    const where: any = {}
    if (period) where.period = period
    if (teamId) where.teamId = teamId

    const kpis = await prisma.kPI.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    res.json(kpis)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createKPISchema.parse(req.body)

    const kpi = await prisma.kPI.create({
      data: {
        name: data.name,
        targetValue: data.targetValue ? new Decimal(data.targetValue) : null,
        currentValue: data.currentValue ? new Decimal(data.currentValue) : null,
        period: data.period,
        teamId: data.teamId,
      },
    })

    res.status(201).json(kpi)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateKPISchema.parse(req.body)

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.targetValue !== undefined) updateData.targetValue = data.targetValue ? new Decimal(data.targetValue) : null
    if (data.currentValue !== undefined) updateData.currentValue = data.currentValue ? new Decimal(data.currentValue) : null
    if (data.period) updateData.period = data.period
    if (data.teamId !== undefined) updateData.teamId = data.teamId

    const kpi = await prisma.kPI.update({
      where: { id: req.params.id },
      data: updateData,
    })

    res.json(kpi)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.kPI.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Calculate utilization KPI
router.post('/calculate/utilization', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.body

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: userId || undefined,
        date: {
          gte: start,
          lte: end,
        },
        status: 'APPROVED',
      },
    })

    // Calculate total hours
    let totalHours = 0
    for (const entry of timeEntries) {
      totalHours += parseFloat(entry.hours.toString())
    }

    // Calculate available hours (assuming 40 hours/week)
    const weeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
    const availableHours = weeks * 40
    const utilization = availableHours > 0 ? (totalHours / availableHours) * 100 : 0

    res.json({
      userId,
      period: `${startDate} to ${endDate}`,
      totalHours,
      availableHours,
      utilization: Math.min(utilization, 100),
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


