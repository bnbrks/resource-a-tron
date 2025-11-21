import prisma from '../prisma';
import { checkAllocationConflict } from './allocationService';

export interface ResourceSuggestion {
  userId: string;
  userName: string;
  confidenceScore: number;
  reasons: string[];
  availableFrom?: Date;
  skillsMatch: number;
  currentUtilization: number;
}

export interface ProjectRequirement {
  skillName: string;
  requiredLevel: string;
  priority: number;
}

export async function suggestResources(
  projectId: string,
  startDate: Date,
  endDate: Date,
  requiredHoursPerWeek: number
): Promise<ResourceSuggestion[]> {
  // Get project requirements
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      requirements: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Get all users
  const users = await prisma.user.findMany({
    include: {
      skills: true,
      allocations: {
        where: {
          OR: [
            {
              AND: [
                { startDate: { lte: endDate } },
                {
                  OR: [
                    { endDate: { gte: startDate } },
                    { endDate: null },
                  ],
                },
              ],
            },
          ],
        },
      },
      timeEntries: {
        where: {
          date: {
            gte: new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            lte: new Date(),
          },
        },
      },
    },
  });

  const suggestions: ResourceSuggestion[] = [];

  for (const user of users) {
    const suggestion = await evaluateUserForProject(
      user,
      project.requirements,
      startDate,
      endDate,
      requiredHoursPerWeek
    );

    if (suggestion.confidenceScore > 0) {
      suggestions.push(suggestion);
    }
  }

  // Sort by confidence score
  return suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

async function evaluateUserForProject(
  user: any,
  requirements: any[],
  startDate: Date,
  endDate: Date,
  requiredHoursPerWeek: number
): Promise<ResourceSuggestion> {
  const reasons: string[] = [];
  let confidenceScore = 0;
  let skillsMatch = 0;
  let availableFrom: Date | undefined;

  // Check skills match
  const userSkills = new Map(
    user.skills.map((s: any) => [s.skillName, s.proficiencyLevel])
  );

  let matchedRequirements = 0;
  let totalPriority = 0;

  for (const req of requirements) {
    totalPriority += req.priority || 1;
    const userSkillLevel = userSkills.get(req.skillName);
    
    if (userSkillLevel) {
      const requiredLevelStr = typeof req.requiredLevel === 'string' ? req.requiredLevel : String(req.requiredLevel);
      const levelMatch = compareSkillLevels(userSkillLevel, requiredLevelStr);
      if (levelMatch >= 0) {
        matchedRequirements += req.priority || 1;
        reasons.push(`Has ${req.skillName} at ${userSkillLevel} level`);
      } else {
        reasons.push(`Missing ${req.skillName} (has ${userSkillLevel}, needs ${req.requiredLevel})`);
      }
    } else {
      reasons.push(`Missing skill: ${req.skillName}`);
    }
  }

  skillsMatch = totalPriority > 0 ? (matchedRequirements / totalPriority) * 100 : 0;
  confidenceScore += skillsMatch * 0.4; // 40% weight for skills

  // Check availability
  const hasConflict = await checkAllocationConflict(user.id, startDate, endDate);
  
  if (!hasConflict) {
    availableFrom = startDate;
    confidenceScore += 50; // 50% weight for availability
    reasons.push('Available for the entire period');
  } else {
    // Find next available date
    const conflicts = await prisma.allocation.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              {
                OR: [
                  { endDate: { gte: startDate } },
                  { endDate: null },
                ],
              },
            ],
          },
        ],
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    if (conflicts.length > 0) {
      const lastConflict = conflicts[conflicts.length - 1];
      availableFrom = lastConflict.endDate
        ? new Date(lastConflict.endDate.getTime() + 24 * 60 * 60 * 1000)
        : undefined;
      
      if (availableFrom && availableFrom <= endDate) {
        confidenceScore += 30;
        reasons.push(`Available from ${availableFrom.toISOString().split('T')[0]}`);
      } else {
        reasons.push('Not available during this period');
      }
    }
  }

  // Check current utilization
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = daysDiff / 7;
  const capacityHours = weeks * 40; // Standard 40 hours/week

  const allocatedHours = user.allocations.reduce((sum: number, alloc: any) => {
    const allocStart = new Date(Math.max(alloc.startDate.getTime(), startDate.getTime()));
    const allocEnd = alloc.endDate
      ? new Date(Math.min(alloc.endDate.getTime(), endDate.getTime()))
      : endDate;
    const allocDays = Math.ceil((allocEnd.getTime() - allocStart.getTime()) / (1000 * 60 * 60 * 24));
    const allocWeeks = allocDays / 7;
    return sum + allocWeeks * alloc.allocatedHours;
  }, 0);

  const currentUtilization = capacityHours > 0 ? (allocatedHours / capacityHours) * 100 : 0;
  
  // Prefer users with lower utilization
  if (currentUtilization < 80) {
    confidenceScore += 10;
    reasons.push(`Low utilization (${currentUtilization.toFixed(1)}%)`);
  } else if (currentUtilization > 100) {
    confidenceScore -= 20;
    reasons.push(`Over-allocated (${currentUtilization.toFixed(1)}%)`);
  }

  return {
    userId: user.id,
    userName: user.name,
    confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
    reasons,
    availableFrom,
    skillsMatch,
    currentUtilization,
  };
}

function compareSkillLevels(userLevel: string, requiredLevel: string): number {
  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  const userIndex = levels.indexOf(userLevel);
  const requiredIndex = levels.indexOf(requiredLevel);
  
  if (userIndex === -1 || requiredIndex === -1) return -1;
  
  return userIndex - requiredIndex; // Positive if user has higher level
}

export async function estimateStartDate(
  projectId: string,
  requiredHoursPerWeek: number,
  teamSize: number
): Promise<Date | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      requirements: true,
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  // Get suggestions
  const tentativeEndDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  const suggestions = await suggestResources(
    projectId,
    new Date(),
    tentativeEndDate,
    requiredHoursPerWeek
  );

  // Filter available resources
  const available = suggestions.filter(s => s.availableFrom && s.availableFrom <= new Date());
  
  if (available.length >= teamSize) {
    return new Date(); // Can start immediately
  }

  // Find the earliest date when enough resources are available
  const allAvailableDates = suggestions
    .filter(s => s.availableFrom)
    .map(s => s.availableFrom!)
    .sort((a, b) => a.getTime() - b.getTime());

  if (allAvailableDates.length >= teamSize) {
    return allAvailableDates[teamSize - 1];
  }

  return null; // Not enough resources available
}

