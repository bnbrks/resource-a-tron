import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const createScheduleSchema = z.object({
  userId: z.string(),
  activityId: z.string(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
})

const updateScheduleSchema = z.object({
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, activityId, startDate, endDate, status } = req.query

    const where: any = {}
    if (userId) where.userId = userId as string
    if (activityId) where.activityId = activityId as string
    if (status) where.status = status
    if (startDate || endDate) {
      where.scheduledStart = {}
      if (startDate) where.scheduledStart.gte = new Date(startDate as string)
      if (endDate) where.scheduledEnd = { lte: new Date(endDate as string) }
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { scheduledStart: 'asc' },
    })

    res.json(schedules)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createScheduleSchema.parse(req.body)

    // Check for conflicts
    const conflicts = await prisma.schedule.findMany({
      where: {
        userId: data.userId,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
        OR: [
          {
            scheduledStart: {
              lte: new Date(data.scheduledEnd),
            },
            scheduledEnd: {
              gte: new Date(data.scheduledStart),
            },
          },
        ],
      },
    })

    const schedule = await prisma.schedule.create({
      data: {
        userId: data.userId,
        activityId: data.activityId,
        scheduledStart: new Date(data.scheduledStart),
        scheduledEnd: new Date(data.scheduledEnd),
        status: 'SCHEDULED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    res.status(201).json({
      schedule,
      conflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateScheduleSchema.parse(req.body)

    const updateData: any = {}
    if (data.scheduledStart) updateData.scheduledStart = new Date(data.scheduledStart)
    if (data.scheduledEnd) updateData.scheduledEnd = new Date(data.scheduledEnd)
    if (data.status) updateData.status = data.status

    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    res.json(schedule)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.schedule.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


