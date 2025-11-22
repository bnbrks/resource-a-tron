import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

const createTeamRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  billingRate: z.number().positive(),
  costRate: z.number().positive(),
  effectiveFrom: z.string().datetime().optional(),
})

const updateTeamRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  billingRate: z.number().positive().optional(),
  costRate: z.number().positive().optional(),
  effectiveTo: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.teamRole.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    res.json(roles)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createTeamRoleSchema.parse(req.body)

    const role = await prisma.teamRole.create({
      data: {
        name: data.name,
        description: data.description,
        billingRate: data.billingRate,
        costRate: data.costRate,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      },
    })

    res.status(201).json(role)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateTeamRoleSchema.parse(req.body)

    const role = await prisma.teamRole.update({
      where: { id: req.params.id },
      data: {
        ...data,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      },
    })

    res.json(role)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.teamRole.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


