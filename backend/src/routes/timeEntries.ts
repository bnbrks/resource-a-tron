import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all time entries
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, taskId, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) {
      where.userId = userId as string;
    }
    if (taskId) {
      where.taskId = taskId as string;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
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
      orderBy: {
        date: 'desc',
      },
    });

    res.json(timeEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// Get time entry by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        user: true,
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    res.json(timeEntry);
  } catch (error) {
    console.error('Error fetching time entry:', error);
    res.status(500).json({ error: 'Failed to fetch time entry' });
  }
});

// Create time entry
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, date, hours, description } = req.body;
    const userId = req.userId!;

    if (!taskId || !date || !hours) {
      return res.status(400).json({ error: 'Task ID, date, and hours are required' });
    }

    if (hours <= 0) {
      return res.status(400).json({ error: 'Hours must be greater than 0' });
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate date is within task dates if they exist
    const entryDate = new Date(date);
    if (task.startDate && entryDate < new Date(task.startDate)) {
      return res.status(400).json({ error: 'Date is before task start date' });
    }
    if (task.endDate && entryDate > new Date(task.endDate)) {
      return res.status(400).json({ error: 'Date is after task end date' });
    }

    // Check for existing entry on same date for same user/task
    const existing = await prisma.timeEntry.findUnique({
      where: {
        userId_taskId_date: {
          userId,
          taskId,
          date: entryDate,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Time entry already exists for this date' });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        taskId,
        date: entryDate,
        hours: parseFloat(hours),
        description,
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

    res.status(201).json(timeEntry);
  } catch (error: any) {
    console.error('Error creating time entry:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Time entry already exists for this date' });
    }
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// Update time entry
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, hours, description } = req.body;
    const userId = req.userId!;

    // Check if entry exists and belongs to user (or user is admin/manager)
    const existing = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        task: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    if (existing.userId !== userId && req.userRole !== 'ADMIN' && req.userRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Validate hours
    if (hours !== undefined && hours <= 0) {
      return res.status(400).json({ error: 'Hours must be greater than 0' });
    }

    // Validate date if changed
    if (date) {
      const entryDate = new Date(date);
      if (existing.task.startDate && entryDate < new Date(existing.task.startDate)) {
        return res.status(400).json({ error: 'Date is before task start date' });
      }
      if (existing.task.endDate && entryDate > new Date(existing.task.endDate)) {
        return res.status(400).json({ error: 'Date is after task end date' });
      }
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(hours !== undefined && { hours: parseFloat(hours) }),
        ...(description !== undefined && { description }),
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

    res.json(timeEntry);
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// Delete time entry
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if entry exists and belongs to user (or user is admin/manager)
    const existing = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    if (existing.userId !== userId && req.userRole !== 'ADMIN' && req.userRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.timeEntry.delete({
      where: { id },
    });

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// Get time summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, taskId, projectId, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) {
      where.userId = userId as string;
    }
    if (taskId) {
      where.taskId = taskId as string;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    if (projectId) {
      const tasks = await prisma.task.findMany({
        where: { projectId: projectId as string },
        select: { id: true },
      });
      where.taskId = { in: tasks.map(t => t.id) };
    }

    const summary = await prisma.timeEntry.groupBy({
      by: ['taskId'],
      where,
      _sum: {
        hours: true,
      },
      _count: {
        id: true,
      },
    });

    // Get task details
    const taskIds = summary.map(s => s.taskId);
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const result = summary.map(s => {
      const task = tasks.find(t => t.id === s.taskId);
      return {
        taskId: s.taskId,
        task: task ? {
          id: task.id,
          name: task.name,
          project: task.project,
        } : null,
        totalHours: s._sum.hours || 0,
        entryCount: s._count.id,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching time summary:', error);
    res.status(500).json({ error: 'Failed to fetch time summary' });
  }
});

export default router;

