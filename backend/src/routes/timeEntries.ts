import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all time entries
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, activityId, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) {
      where.userId = userId as string;
    }
    if (activityId) {
      where.activityId = activityId as string;
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
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
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
        activity: true,
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
    const { activityId, date, hours, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!activityId || !date || !hours) {
      return res.status(400).json({ error: 'Activity ID, date, and hours are required' });
    }

    if (hours <= 0) {
      return res.status(400).json({ error: 'Hours must be greater than 0' });
    }

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Validate date is within activity dates if they exist
    const entryDate = new Date(date);
    if (activity.startDate && entryDate < new Date(activity.startDate)) {
      return res.status(400).json({ error: 'Date is before activity start date' });
    }
    if (activity.endDate && entryDate > new Date(activity.endDate)) {
      return res.status(400).json({ error: 'Date is after activity end date' });
    }

    // Check for existing entry on same date for same user/activity
    const existing = await prisma.timeEntry.findFirst({
      where: {
        userId,
        activityId,
        date: entryDate,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Time entry already exists for this date' });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        activityId,
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
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if entry exists and belongs to user (or user is admin/manager)
    const existing = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        activity: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    const userRole = req.user?.role;
    if (existing.userId !== userId && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Validate hours
    if (hours !== undefined && hours <= 0) {
      return res.status(400).json({ error: 'Hours must be greater than 0' });
    }

    // Validate date if changed
    if (date) {
      const entryDate = new Date(date);
      if (existing.activity.startDate && entryDate < new Date(existing.activity.startDate)) {
        return res.status(400).json({ error: 'Date is before activity start date' });
      }
      if (existing.activity.endDate && entryDate > new Date(existing.activity.endDate)) {
        return res.status(400).json({ error: 'Date is after activity end date' });
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
        activity: {
          select: {
            id: true,
            name: true,
            type: true,
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if entry exists and belongs to user (or user is admin/manager)
    const existing = await prisma.timeEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    const userRole = req.user?.role;
    if (existing.userId !== userId && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
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
    const { userId, activityId, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) {
      where.userId = userId as string;
    }
    if (activityId) {
      where.activityId = activityId as string;
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

    const summary = await prisma.timeEntry.groupBy({
      by: ['activityId'],
      where,
      _sum: {
        hours: true,
      },
      _count: {
        id: true,
      },
    });

    // Get activity details
    const activityIds = summary.map((s: { activityId: string }) => s.activityId);
    const activities = await prisma.activity.findMany({
      where: { id: { in: activityIds } },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    const result = summary.map((s: { activityId: string; _sum: { hours: any }; _count: { id: number } }) => {
      const activity = activities.find((a: { id: string; name: string; type: string }) => a.id === s.activityId);
      const hoursValue = s._sum.hours;
      const hours = hoursValue ? (typeof hoursValue === 'number' ? hoursValue : parseFloat(hoursValue.toString())) : 0;
      return {
        activityId: s.activityId,
        activity: activity ? {
          id: activity.id,
          name: activity.name,
          type: activity.type,
        } : null,
        totalHours: hours,
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

