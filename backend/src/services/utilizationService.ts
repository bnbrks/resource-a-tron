import prisma from '../prisma';

export interface UtilizationData {
  userId: string;
  userName: string;
  period: string;
  allocatedHours: number;
  actualHours: number;
  utilizationPercent: number;
  capacityHours: number;
}

export async function calculateUserUtilization(
  userId: string,
  startDate: Date,
  endDate: Date,
  standardHoursPerWeek: number = 40
): Promise<UtilizationData> {
  // Get allocations
  const allocations = await prisma.assignment.findMany({
    where: {
      userId,
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
  });

  // Get time entries
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Calculate weeks in period
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = daysDiff / 7;
  const capacityHours = weeks * standardHoursPerWeek;

  // Calculate allocated hours (sum of weekly allocations)
  let allocatedHours = 0;
  allocations.forEach((allocation: { startDate: Date; endDate: Date | null; allocatedHours: number }) => {
    const allocStart = new Date(Math.max(allocation.startDate.getTime(), startDate.getTime()));
    const allocEnd = allocation.endDate
      ? new Date(Math.min(allocation.endDate.getTime(), endDate.getTime()))
      : endDate;
    
    const allocDays = Math.ceil((allocEnd.getTime() - allocStart.getTime()) / (1000 * 60 * 60 * 24));
    const allocWeeks = allocDays / 7;
    allocatedHours += allocWeeks * allocation.allocatedHours;
  });

  // Calculate actual hours
  const actualHours = timeEntries.reduce((sum: number, entry: { hours: any }) => {
    const hours = typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours.toString());
    return sum + hours;
  }, 0);

  // Calculate utilization
  const utilizationPercent = capacityHours > 0 ? (actualHours / capacityHours) * 100 : 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return {
    userId,
    userName: user?.name || '',
    period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    allocatedHours,
    actualHours,
    utilizationPercent,
    capacityHours,
  };
}

export async function calculateTeamUtilization(
  startDate: Date,
  endDate: Date,
  standardHoursPerWeek: number = 40
): Promise<UtilizationData[]> {
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  const results = await Promise.all(
    users.map((user: { id: string }) => calculateUserUtilization(user.id, startDate, endDate, standardHoursPerWeek))
  );

  return results;
}

export async function getActivitySummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  totalTimeEntries: number;
  totalHours: number;
  uniqueUsers: number;
}> {
  const [projects, activeProjects, tasks, timeEntries, users] = await Promise.all([
    prisma.activity.count({
      where: {
        type: 'PROJECT',
        createdAt: { lte: endDate },
      },
    }),
    prisma.activity.count({
      where: {
        type: 'PROJECT',
        status: 'ACTIVE',
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
    }),
    prisma.activity.count({
      where: {
        type: { in: ['PROJECT', 'INTERNAL'] },
        createdAt: { lte: endDate },
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        hours: true,
        userId: true,
      },
    }),
    prisma.user.count(),
  ]);

  const totalHours = timeEntries.reduce((sum: number, entry: { hours: any; userId: string }) => {
    const hours = typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours.toString());
    return sum + hours;
  }, 0);
  const uniqueUsers = new Set(timeEntries.map((e: { hours: any; userId: string }) => e.userId)).size;

  return {
    totalProjects: projects,
    activeProjects,
    totalTasks: tasks,
    totalTimeEntries: timeEntries.length,
    totalHours,
    uniqueUsers,
  };
}

