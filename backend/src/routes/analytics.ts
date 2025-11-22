import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { calculateUserUtilization, calculateTeamUtilization, getActivitySummary } from '../services/utilizationService.js';

const router = Router();

// Get user utilization
router.get('/utilization/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const utilization = await calculateUserUtilization(
      userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(utilization);
  } catch (error) {
    console.error('Error calculating utilization:', error);
    res.status(500).json({ error: 'Failed to calculate utilization' });
  }
});

// Get team utilization
router.get('/utilization/team', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const utilization = await calculateTeamUtilization(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(utilization);
  } catch (error) {
    console.error('Error calculating team utilization:', error);
    res.status(500).json({ error: 'Failed to calculate team utilization' });
  }
});

// Get activity summary
router.get('/activity', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const defaultEndDate = endDate ? new Date(endDate as string) : new Date();
    const defaultStartDate = startDate
      ? new Date(startDate as string)
      : new Date(defaultEndDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const summary = await getActivitySummary(defaultStartDate, defaultEndDate);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ error: 'Failed to fetch activity summary' });
  }
});

export default router;

