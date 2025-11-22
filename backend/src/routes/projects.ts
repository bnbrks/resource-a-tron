import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all projects
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const projects = await prisma.activity.findMany({
      where: {
        ...where,
        type: 'PROJECT',
      },
      include: {
        scopes: true,
        assignments: true,
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const project = await prisma.activity.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        scopes: true,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, client, status, startDate, endDate, budgetHours, requirements } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await prisma.activity.create({
      data: {
        name,
        description,
        type: 'PROJECT',
        status: status || 'PLANNED',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budgetHours: budgetHours ? parseFloat(budgetHours) : null,
      },
      include: {
        scopes: true,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, client, status, startDate, endDate, budgetHours } = req.body;

    const project = await prisma.activity.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(budgetHours !== undefined && { budgetHours: budgetHours ? parseFloat(budgetHours) : null }),
      },
    });

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.activity.delete({
      where: { id },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Add requirement to project
router.post('/:id/requirements', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { skillName, requiredLevel, priority } = req.body;

    if (!skillName || !requiredLevel) {
      return res.status(400).json({ error: 'Skill name and required level are required' });
    }

    // ActivityScope requires teamRoleId, so we'll need to find or create a team role first
    // For now, this is a simplified version - you may need to adjust based on your requirements
    const requirement = await prisma.activityScope.create({
      data: {
        activityId: id,
        teamRoleId: '', // This needs to be provided or fetched - simplified for now
        allocatedHours: 0,
        sequence: priority || 0,
      },
    });

    res.status(201).json(requirement);
  } catch (error) {
    console.error('Error adding requirement:', error);
    res.status(500).json({ error: 'Failed to add requirement' });
  }
});

export default router;

