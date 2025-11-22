import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

const createUserSkillSchema = z.object({
  userId: z.string(),
  skillId: z.string(),
  proficiencyLevel: z.number().min(1).max(5).optional(),
  certified: z.boolean().optional(),
})

const updateUserSkillSchema = z.object({
  proficiencyLevel: z.number().min(1).max(5).optional(),
  certified: z.boolean().optional(),
})

router.get('/user/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: req.params.userId },
      include: {
        skill: true,
      },
    })

    res.json(userSkills)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSkillSchema.parse(req.body)

    const userSkill = await prisma.userSkill.create({
      data: {
        userId: data.userId,
        skillId: data.skillId,
        proficiencyLevel: data.proficiencyLevel || 1,
        certified: data.certified || false,
      },
      include: {
        skill: true,
      },
    })

    res.status(201).json(userSkill)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateUserSkillSchema.parse(req.body)

    const userSkill = await prisma.userSkill.update({
      where: { id: req.params.id },
      data,
      include: {
        skill: true,
      },
    })

    res.json(userSkill)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.userSkill.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


