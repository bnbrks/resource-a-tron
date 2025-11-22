import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { Decimal } from '@prisma/client/runtime/library'

const router = Router()

router.use(authenticate)

const createTimeEntrySchema = z.object({
  activityId: z.string(),
  date: z.string().datetime(),
  hours: z.number().positive(),
  description: z.string().optional(),
})

const updateTimeEntrySchema = z.object({
  activityId: z.string().optional(),
  date: z.string().datetime().optional(),
  hours: z.number().positive().optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
})

// Calculate billing and cost amounts for time entry
async function calculateTimeEntryAmounts(
  userId: string,
  activityId: string,
  hours: Decimal
) {
  // Get user's current team role
  const userRole = await prisma.userTeamRole.findFirst({
    where: {
      userId,
      isCurrent: true,
    },
    include: {
      teamRole: true,
    },
  })

  if (!userRole) {
    return { billingRate: null, costRate: null, billableAmount: null, costAmount: null }
  }

  const billingRate = userRole.teamRole.billingRate
  const costRate = userRole.teamRole.costRate
  const billableAmount = new Decimal(billingRate).times(hours)
  const costAmount = new Decimal(costRate).times(hours)

  return { billingRate, costRate, billableAmount, costAmount }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, activityId, startDate, endDate, status } = req.query

    const where: any = {}
    if (userId) where.userId = userId as string
    if (activityId) where.activityId = activityId as string
    if (status) where.status = status
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate as string)
      if (endDate) where.date.lte = new Date(endDate as string)
    }

    // If not admin/manager, only show own entries
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MANAGER') {
      where.userId = req.user?.id
    }

    const timeEntries = await prisma.timeEntry.findMany({
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
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    res.json(timeEntries)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        activity: true,
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' })
    }

    // Check permissions
    if (
      req.user?.role !== 'ADMIN' &&
      req.user?.role !== 'MANAGER' &&
      timeEntry.userId !== req.user?.id
    ) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    res.json(timeEntry)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const data = createTimeEntrySchema.parse(req.body)

    const hours = new Decimal(data.hours)
    const amounts = await calculateTimeEntryAmounts(req.user.id, data.activityId, hours)

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        activityId: data.activityId,
        date: new Date(data.date),
        hours,
        description: data.description,
        billingRate: amounts.billingRate,
        costRate: amounts.costRate,
        billableAmount: amounts.billableAmount,
        costAmount: amounts.costAmount,
        status: 'DRAFT',
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    res.status(201).json(timeEntry)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
    })

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' })
    }

    // Check permissions
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'MANAGER' &&
      timeEntry.userId !== req.user.id
    ) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Only allow status changes if approved/rejected by manager/admin
    if (req.body.status && ['APPROVED', 'REJECTED'].includes(req.body.status)) {
      if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
        return res.status(403).json({ error: 'Only managers can approve/reject' })
      }
    }

    const data = updateTimeEntrySchema.parse(req.body)

    const updateData: any = {}
    if (data.activityId) updateData.activityId = data.activityId
    if (data.date) updateData.date = new Date(data.date)
    if (data.hours !== undefined) {
      updateData.hours = new Decimal(data.hours)
      // Recalculate amounts if hours changed
      const amounts = await calculateTimeEntryAmounts(
        timeEntry.userId,
        data.activityId || timeEntry.activityId,
        new Decimal(data.hours)
      )
      updateData.billingRate = amounts.billingRate
      updateData.costRate = amounts.costRate
      updateData.billableAmount = amounts.billableAmount
      updateData.costAmount = amounts.costAmount
    }
    if (data.description !== undefined) updateData.description = data.description
    if (data.status) {
      updateData.status = data.status
      if (data.status === 'APPROVED' || data.status === 'REJECTED') {
        updateData.approvedById = req.user.id
      }
    }

    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    res.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/submit', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
    })

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' })
    }

    if (timeEntry.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: { status: 'SUBMITTED' },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/approve', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvedById: req.user.id,
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/reject', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updated = await prisma.timeEntry.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        approvedById: req.user.id,
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id: req.params.id },
    })

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' })
    }

    // Check permissions
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'MANAGER' &&
      timeEntry.userId !== req.user.id
    ) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Only allow deletion of draft entries
    if (timeEntry.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only delete draft entries' })
    }

    await prisma.timeEntry.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


