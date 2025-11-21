import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all allocations
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, taskId, projectId, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) {
      where.userId = userId as string;
    }
    if (taskId) {
      where.taskId = taskId as string;
    }
    if (projectId) {
      where.projectId = projectId as string;
    }
    if (startDate || endDate) {
      where.OR = [];
      if (startDate) {
        where.OR.push({
          endDate: { gte: new Date(startDate as string) },
        });
        where.OR.push({
          endDate: null,
        });
      }
      if (endDate) {
        where.OR.push({
          startDate: { lte: new Date(endDate as string) },
        });
      }
    }

    const allocations = await prisma.allocation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    res.json(allocations);
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: 'Failed to fetch allocations' });
  }
});

// Get allocation by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.allocation.findUnique({
      where: { id },
      include: {
        user: true,
        task: {
          include: {
            project: true,
          },
        },
        project: true,
      },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    res.json(allocation);
  } catch (error) {
    console.error('Error fetching allocation:', error);
    res.status(500).json({ error: 'Failed to fetch allocation' });
  }
});

// Create allocation
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, taskId, allocatedHours, startDate, endDate } = req.body;

    if (!userId || !taskId || !allocatedHours || !startDate) {
      return res.status(400).json({ error: 'User ID, task ID, allocated hours, and start date are required' });
    }

    if (allocatedHours <= 0) {
      return res.status(400).json({ error: 'Allocated hours must be greater than 0' });
    }

    // Check if user and task exist
    const [user, task] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.task.findUnique({ where: { id: taskId }, include: { project: true } }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check for overlapping allocations
    const overlapping = await prisma.allocation.findFirst({
      where: {
        userId,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              {
                OR: [
                  { endDate: { gte: new Date(startDate) } },
                  { endDate: null },
                ],
              },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate ? new Date(endDate) : new Date('2099-12-31') } },
              {
                OR: [
                  { endDate: { gte: endDate ? new Date(endDate) : new Date('2099-12-31') } },
                  { endDate: null },
                ],
              },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({ error: 'User already has an overlapping allocation' });
    }

    const allocation = await prisma.allocation.create({
      data: {
        userId,
        taskId,
        projectId: task.projectId || null,
        allocatedHours: parseFloat(allocatedHours),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(allocation);
  } catch (error) {
    console.error('Error creating allocation:', error);
    res.status(500).json({ error: 'Failed to create allocation' });
  }
});

// Update allocation
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { allocatedHours, startDate, endDate } = req.body;

    const allocation = await prisma.allocation.findUnique({
      where: { id },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    if (allocatedHours !== undefined && allocatedHours <= 0) {
      return res.status(400).json({ error: 'Allocated hours must be greater than 0' });
    }

    const updated = await prisma.allocation.update({
      where: { id },
      data: {
        ...(allocatedHours !== undefined && { allocatedHours: parseFloat(allocatedHours) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating allocation:', error);
    res.status(500).json({ error: 'Failed to update allocation' });
  }
});

// Delete allocation
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.allocation.delete({
      where: { id },
    });

    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    console.error('Error deleting allocation:', error);
    res.status(500).json({ error: 'Failed to delete allocation' });
  }
});

export default router;

