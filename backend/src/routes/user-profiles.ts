import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

const updateProfileSchema = z.object({
  availability: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
})

router.get('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: req.params.userId },
    })

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    res.json(profile)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.id !== req.params.userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const data = updateProfileSchema.parse(req.body)

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.params.userId },
      update: data,
      create: {
        userId: req.params.userId,
        ...data,
      },
    })

    res.json(profile)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


