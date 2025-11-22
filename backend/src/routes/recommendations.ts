import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { recommendResources } from '../services/recommendation'

const router = Router()

router.use(authenticate)

const recommendationSchema = z.object({
  activityId: z.string(),
  requiredSkills: z.array(z.string()).optional(),
  requiredTeamRole: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  allocatedHours: z.number().positive().optional(),
  excludeUserIds: z.array(z.string()).optional(),
})

router.post('/', authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const data = recommendationSchema.parse(req.body)

    const recommendations = await recommendResources({
      activityId: data.activityId,
      requiredSkills: data.requiredSkills,
      requiredTeamRole: data.requiredTeamRole,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      allocatedHours: data.allocatedHours,
      excludeUserIds: data.excludeUserIds,
    })

    res.json(recommendations)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router


