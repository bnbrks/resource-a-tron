import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { suggestResources, estimateStartDate } from '../services/resourceSuggestionService';

const router = Router();

// Get resource suggestions for a project
router.post('/resources', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, startDate, endDate, requiredHoursPerWeek } = req.body;

    if (!projectId || !startDate || !endDate || !requiredHoursPerWeek) {
      return res.status(400).json({
        error: 'Project ID, start date, end date, and required hours per week are required',
      });
    }

    const suggestions = await suggestResources(
      projectId,
      new Date(startDate),
      new Date(endDate),
      parseFloat(requiredHoursPerWeek)
    );

    res.json(suggestions);
  } catch (error: any) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: error.message || 'Failed to get suggestions' });
  }
});

// Estimate start date for a project
router.post('/estimate-start-date', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, requiredHoursPerWeek, teamSize } = req.body;

    if (!projectId || !requiredHoursPerWeek || !teamSize) {
      return res.status(400).json({
        error: 'Project ID, required hours per week, and team size are required',
      });
    }

    const startDate = await estimateStartDate(
      projectId,
      parseFloat(requiredHoursPerWeek),
      parseInt(teamSize)
    );

    res.json({ startDate, canStartImmediately: startDate && startDate <= new Date() });
  } catch (error: any) {
    console.error('Error estimating start date:', error);
    res.status(500).json({ error: error.message || 'Failed to estimate start date' });
  }
});

export default router;

