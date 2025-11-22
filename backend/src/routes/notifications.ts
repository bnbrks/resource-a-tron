import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(['ASSIGNMENT', 'DEADLINE', 'UTILIZATION_ALERT', 'SCHEDULE_CONFLICT', 'TIMESHEET_REMINDER', 'KPI_ACHIEVEMENT']),
  message: z.string().min(1),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { read } = req.query

    const where: any = {
      userId: req.user.id,
    }

    if (read !== undefined) {
      where.read = read === 'true'
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false,
      },
    })

    res.json({ count })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createNotificationSchema.parse(req.body)

    const notification = await prisma.notification.create({
      data,
    })

    res.status(201).json(notification)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const notification = await prisma.notification.update({
      where: {
        id: req.params.id,
        userId: req.user.id, // Ensure user can only mark their own notifications as read
      },
      data: {
        read: true,
      },
    })

    res.json(notification)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await prisma.notification.delete({
      where: {
        id: req.params.id,
        userId: req.user.id, // Ensure user can only delete their own notifications
      },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


