import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const createUserTeamRoleSchema = z.object({
  userId: z.string(),
  teamRoleId: z.string(),
  effectiveFrom: z.string().datetime().optional(),
})

const updateUserTeamRoleSchema = z.object({
  effectiveTo: z.string().datetime().optional(),
  isCurrent: z.boolean().optional(),
})

router.get('/user/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userRoles = await prisma.userTeamRole.findMany({
      where: { userId: req.params.userId },
      include: {
        teamRole: true,
      },
      orderBy: { effectiveFrom: 'desc' },
    })

    res.json(userRoles)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserTeamRoleSchema.parse(req.body)

    // Set previous roles to not current
    await prisma.userTeamRole.updateMany({
      where: {
        userId: data.userId,
        isCurrent: true,
      },
      data: {
        isCurrent: false,
        effectiveTo: new Date(),
      },
    })

    const userRole = await prisma.userTeamRole.create({
      data: {
        userId: data.userId,
        teamRoleId: data.teamRoleId,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        isCurrent: true,
      },
      include: {
        teamRole: true,
      },
    })

    res.status(201).json(userRole)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateUserTeamRoleSchema.parse(req.body)

    const userRole = await prisma.userTeamRole.update({
      where: { id: req.params.id },
      data: {
        ...data,
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      },
      include: {
        teamRole: true,
      },
    })

    res.json(userRole)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


