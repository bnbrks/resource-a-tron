import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all users
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        skills: true,
        developmentAreas: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        skills: true,
        developmentAreas: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, developmentAreas } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow users to update themselves, or admins/managers to update anyone
    if (req.userId !== id && req.userRole !== 'ADMIN' && req.userRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role && (req.userRole === 'ADMIN' || req.userRole === 'MANAGER')) {
      updateData.role = role;
    }
    if (developmentAreas !== undefined) updateData.developmentAreas = developmentAreas;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        skills: true,
        developmentAreas: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Add skill to user
router.post('/:id/skills', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { skillName, proficiencyLevel, certified } = req.body;

    if (!skillName || !proficiencyLevel) {
      return res.status(400).json({ error: 'Skill name and proficiency level are required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only allow users to update themselves, or admins/managers to update anyone
    if (req.userId !== id && req.userRole !== 'ADMIN' && req.userRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const skill = await prisma.userSkill.upsert({
      where: {
        userId_skillName: {
          userId: id,
          skillName,
        },
      },
      update: {
        proficiencyLevel,
        certified: certified || false,
      },
      create: {
        userId: id,
        skillName,
        proficiencyLevel,
        certified: certified || false,
      },
    });

    res.json(skill);
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ error: 'Failed to add skill' });
  }
});

// Remove skill from user
router.delete('/:id/skills/:skillName', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id, skillName } = req.params;

    // Only allow users to update themselves, or admins/managers to update anyone
    if (req.userId !== id && req.userRole !== 'ADMIN' && req.userRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await prisma.userSkill.delete({
      where: {
        userId_skillName: {
          userId: id,
          skillName,
        },
      },
    });

    res.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Error removing skill:', error);
    res.status(500).json({ error: 'Failed to remove skill' });
  }
});

export default router;

