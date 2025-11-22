import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { Decimal } from '@prisma/client/runtime/library'

const router = Router()

router.use(authenticate)

const createAssignmentSchema = z.object({
  userId: z.string(),
  activityId: z.string(),
  allocatedHours: z.number().positive(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  billingRate: z.number().optional(),
  costRate: z.number().optional(),
})

const updateAssignmentSchema = z.object({
  allocatedHours: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).optional(),
  billingRate: z.number().optional(),
  costRate: z.number().optional(),
})

// Get user's billing and cost rates
async function getUserRates(userId: string) {
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
    return { billingRate: null, costRate: null }
  }

  return {
    billingRate: userRole.teamRole.billingRate,
    costRate: userRole.teamRole.costRate,
  }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, activityId, status } = req.query

    const where: any = {}
    if (userId) where.userId = userId as string
    if (activityId) where.activityId = activityId as string
    if (status) where.status = status

    const assignments = await prisma.assignment.findMany({
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
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(assignments)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await prisma.assignment.findUnique({
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
      },
    })

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    res.json(assignment)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createAssignmentSchema.parse(req.body)

    // Get user rates if not provided
    let billingRate = data.billingRate ? new Decimal(data.billingRate) : null
    let costRate = data.costRate ? new Decimal(data.costRate) : null

    if (!billingRate || !costRate) {
      const rates = await getUserRates(data.userId)
      billingRate = rates.billingRate
      costRate = rates.costRate
    }

    const assignment = await prisma.assignment.create({
      data: {
        userId: data.userId,
        activityId: data.activityId,
        allocatedHours: new Decimal(data.allocatedHours),
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        billingRate,
        costRate,
        status: 'PENDING',
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

    res.status(201).json(assignment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateAssignmentSchema.parse(req.body)

    const updateData: any = {}
    if (data.allocatedHours !== undefined) updateData.allocatedHours = new Decimal(data.allocatedHours)
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (data.status) updateData.status = data.status
    if (data.billingRate !== undefined) updateData.billingRate = new Decimal(data.billingRate)
    if (data.costRate !== undefined) updateData.costRate = new Decimal(data.costRate)

    const assignment = await prisma.assignment.update({
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

    res.json(assignment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.assignment.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


