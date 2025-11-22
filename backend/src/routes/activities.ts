import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { Decimal } from '@prisma/client/runtime/library'

const router = Router()

router.use(authenticate)

const createActivitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['PROJECT', 'INTERNAL', 'PTO', 'NON_BILLABLE']),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budgetHours: z.number().optional(),
  budgetCost: z.number().optional(),
  priority: z.number().optional(),
})

const updateActivitySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['PROJECT', 'INTERNAL', 'PTO', 'NON_BILLABLE']).optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budgetHours: z.number().optional(),
  budgetCost: z.number().optional(),
  priority: z.number().optional(),
})

const createActivityScopeSchema = z.object({
  teamRoleId: z.string(),
  allocatedHours: z.number().positive(),
  billingRate: z.number().optional(),
  costRate: z.number().optional(),
  phaseName: z.string().optional(),
  sequence: z.number().optional(),
})

// Calculate financials for activity
async function calculateActivityFinancials(activityId: string) {
  const scopes = await prisma.activityScope.findMany({
    where: { activityId },
    include: { teamRole: true },
  })

  let estimatedRevenue = new Decimal(0)
  let estimatedCost = new Decimal(0)

  for (const scope of scopes) {
    const billingRate = scope.billingRate || scope.teamRole.billingRate
    const costRate = scope.costRate || scope.teamRole.costRate
    const hours = scope.allocatedHours

    estimatedRevenue = estimatedRevenue.plus(new Decimal(billingRate).times(hours))
    estimatedCost = estimatedCost.plus(new Decimal(costRate).times(hours))
  }

  const estimatedMargin = estimatedRevenue.minus(estimatedCost)

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      estimatedRevenue,
      estimatedCost,
      estimatedMargin,
    },
  })

  return { estimatedRevenue, estimatedCost, estimatedMargin }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, startDate, endDate } = req.query

    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    if (startDate || endDate) {
      where.startDate = {}
      if (startDate) where.startDate.gte = new Date(startDate as string)
      if (endDate) where.startDate.lte = new Date(endDate as string)
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        scopes: {
          include: {
            teamRole: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(activities)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: {
        scopes: {
          include: {
            teamRole: true,
          },
          orderBy: { sequence: 'asc' },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        programs: {
          include: {
            program: true,
          },
        },
      },
    })

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' })
    }

    res.json(activity)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createActivitySchema.parse(req.body)

    const activity = await prisma.activity.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budgetHours: data.budgetHours ? new Decimal(data.budgetHours) : null,
        budgetCost: data.budgetCost ? new Decimal(data.budgetCost) : null,
        priority: data.priority || 0,
      },
    })

    res.status(201).json(activity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateActivitySchema.parse(req.body)

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.type) updateData.type = data.type
    if (data.description !== undefined) updateData.description = data.description
    if (data.status) updateData.status = data.status
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (data.budgetHours !== undefined) updateData.budgetHours = new Decimal(data.budgetHours)
    if (data.budgetCost !== undefined) updateData.budgetCost = new Decimal(data.budgetCost)
    if (data.priority !== undefined) updateData.priority = data.priority

    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: updateData,
    })

    res.json(activity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.activity.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Activity scoping routes
router.post('/:id/scopes', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createActivityScopeSchema.parse(req.body)

    // Get team role to get default rates if not provided
    const teamRole = await prisma.teamRole.findUnique({
      where: { id: data.teamRoleId },
    })

    if (!teamRole) {
      return res.status(404).json({ error: 'Team role not found' })
    }

    const scope = await prisma.activityScope.create({
      data: {
        activityId: req.params.id,
        teamRoleId: data.teamRoleId,
        allocatedHours: new Decimal(data.allocatedHours),
        billingRate: data.billingRate ? new Decimal(data.billingRate) : teamRole.billingRate,
        costRate: data.costRate ? new Decimal(data.costRate) : teamRole.costRate,
        phaseName: data.phaseName,
        sequence: data.sequence || 0,
      },
      include: {
        teamRole: true,
      },
    })

    // Recalculate financials
    await calculateActivityFinancials(req.params.id)

    res.status(201).json(scope)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id/scopes/:scopeId', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.activityScope.delete({
      where: { id: req.params.scopeId },
    })

    // Recalculate financials
    await calculateActivityFinancials(req.params.id)

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/recalculate-financials', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const financials = await calculateActivityFinancials(req.params.id)
    res.json(financials)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


