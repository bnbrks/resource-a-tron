import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

router.use(authenticate)

const createProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const updateProgramSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const programs = await prisma.program.findMany({
      include: {
        activities: {
          include: {
            activity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(programs)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id },
      include: {
        activities: {
          include: {
            activity: {
              include: {
                scopes: {
                  include: {
                    teamRole: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!program) {
      return res.status(404).json({ error: 'Program not found' })
    }

    res.json(program)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createProgramSchema.parse(req.body)

    const program = await prisma.program.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    res.status(201).json(program)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProgramSchema.parse(req.body)

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    const program = await prisma.program.update({
      where: { id: req.params.id },
      data: updateData,
    })

    res.json(program)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.program.delete({
      where: { id: req.params.id },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/activities/:activityId', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const activityProgram = await prisma.activityProgram.create({
      data: {
        programId: req.params.id,
        activityId: req.params.activityId,
      },
      include: {
        activity: true,
      },
    })

    res.status(201).json(activityProgram)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id/activities/:activityId', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.activityProgram.delete({
      where: {
        activityId_programId: {
          activityId: req.params.activityId,
          programId: req.params.id,
        },
      },
    })

    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


