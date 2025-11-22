import { prisma } from '../lib/prisma.js'
import { Decimal } from '@prisma/client/runtime/library'

interface RecommendationCriteria {
  activityId: string
  requiredSkills?: string[]
  requiredTeamRole?: string
  startDate?: Date
  endDate?: Date
  allocatedHours?: number
  excludeUserIds?: string[]
}

interface UserRecommendation {
  userId: string
  userName: string
  userEmail: string
  score: number
  reasons: string[]
  currentUtilization: number
  skillsMatch: number
  availability: number
  teamRole?: string
  billingRate?: Decimal
  costRate?: Decimal
}

export async function recommendResources(criteria: RecommendationCriteria): Promise<UserRecommendation[]> {
  const {
    activityId,
    requiredSkills = [],
    requiredTeamRole,
    startDate,
    endDate,
    allocatedHours,
    excludeUserIds = [],
  } = criteria

  // Get activity details
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      scopes: {
        include: {
          teamRole: true,
        },
      },
    },
  })

  if (!activity) {
    throw new Error('Activity not found')
  }

  // Get all users with their skills and current team roles
  const users = await prisma.user.findMany({
    where: {
      id: {
        notIn: excludeUserIds,
      },
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      teamRoles: {
        where: {
          isCurrent: true,
        },
        include: {
          teamRole: true,
        },
      },
      assignments: {
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          OR: [
            {
              startDate: {
                lte: endDate || undefined,
              },
              endDate: {
                gte: startDate || undefined,
              },
            },
            {
              startDate: null,
              endDate: null,
            },
          ],
        },
      },
      timeEntries: {
        where: {
          date: {
            gte: startDate || undefined,
            lte: endDate || undefined,
          },
          status: {
            in: ['DRAFT', 'SUBMITTED', 'APPROVED'],
          },
        },
      },
    },
  })

  const recommendations: UserRecommendation[] = []

  for (const user of users) {
    const currentRole = user.teamRoles[0]?.teamRole

    // Filter by team role if specified
    if (requiredTeamRole && currentRole?.name !== requiredTeamRole) {
      continue
    }

    // Calculate skills match score
    const userSkillNames = user.skills.map((us: { skill: { name: string } }) => us.skill.name.toLowerCase())
    const requiredSkillNames = requiredSkills.map((s: string) => s.toLowerCase())
    const matchedSkills = requiredSkillNames.filter((rs: string) =>
      userSkillNames.some((us: string) => us.includes(rs) || rs.includes(us))
    )
    const skillsMatch = requiredSkills.length > 0
      ? matchedSkills.length / requiredSkills.length
      : 0.5 // Default score if no skills required

    // Calculate current utilization
    let totalAllocatedHours = 0
    for (const assignment of user.assignments) {
      totalAllocatedHours += parseFloat(assignment.allocatedHours.toString())
    }

    let totalLoggedHours = 0
    for (const entry of user.timeEntries) {
      totalLoggedHours += parseFloat(entry.hours.toString())
    }

    // Assume 40 hours per week standard
    const weeksInPeriod = startDate && endDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      : 1
    const availableHours = weeksInPeriod * 40
    const currentUtilization = availableHours > 0
      ? (totalAllocatedHours + totalLoggedHours) / availableHours
      : 0

    // Calculate availability score (lower utilization = higher availability)
    const availability = Math.max(0, 1 - currentUtilization)

    // Check if user has capacity for this assignment
    const requestedHours = allocatedHours || 0
    const remainingCapacity = Math.max(0, availableHours - totalAllocatedHours - totalLoggedHours)
    const hasCapacity = remainingCapacity >= requestedHours

    if (!hasCapacity && requestedHours > 0) {
      continue // Skip users without capacity
    }

    // Calculate overall score
    // Weight: skills 40%, availability 30%, utilization 30%
    const score =
      skillsMatch * 0.4 +
      availability * 0.3 +
      (1 - Math.min(currentUtilization, 1)) * 0.3

    const reasons: string[] = []
    if (skillsMatch >= 0.8) {
      reasons.push('Strong skills match')
    } else if (skillsMatch >= 0.5) {
      reasons.push('Partial skills match')
    }
    if (availability >= 0.7) {
      reasons.push('High availability')
    } else if (availability >= 0.4) {
      reasons.push('Moderate availability')
    }
    if (currentUtilization < 0.7) {
      reasons.push('Good utilization level')
    }

    recommendations.push({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      score,
      reasons,
      currentUtilization: Math.min(currentUtilization, 1),
      skillsMatch,
      availability,
      teamRole: currentRole?.name,
      billingRate: currentRole?.billingRate,
      costRate: currentRole?.costRate,
    })
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score)

  return recommendations
}


