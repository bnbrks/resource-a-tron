import prisma from '../prisma';

export interface CapacityInfo {
  userId: string;
  userName: string;
  week: string;
  allocatedHours: number;
  availableHours: number;
  utilizationPercent: number;
}

export async function getUserCapacity(
  userId: string,
  startDate: Date,
  endDate: Date,
  standardHoursPerWeek: number = 40
): Promise<CapacityInfo[]> {
  const allocations = await prisma.allocation.findMany({
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

  // Group by week
  const weekMap = new Map<string, CapacityInfo>();

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      weekMap.set(weekKey, {
        userId,
        userName: user?.name || '',
        week: weekKey,
        allocatedHours: 0,
        availableHours: standardHoursPerWeek,
        utilizationPercent: 0,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate allocated hours per week
  allocations.forEach((allocation: { startDate: Date; endDate: Date | null; allocatedHours: number }) => {
    const allocStart = new Date(allocation.startDate);
    const allocEnd = allocation.endDate ? new Date(allocation.endDate) : endDate;

    const current = new Date(allocStart);
    while (current <= allocEnd && current <= endDate) {
      const weekStart = new Date(current);
      weekStart.setDate(current.getDate() - current.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0];

      const info = weekMap.get(weekKey);
      if (info) {
        info.allocatedHours += allocation.allocatedHours;
      }

      current.setDate(current.getDate() + 1);
    }
  });

  // Calculate utilization
  weekMap.forEach((info) => {
    info.utilizationPercent = (info.allocatedHours / info.availableHours) * 100;
  });

  return Array.from(weekMap.values());
}

export async function checkAllocationConflict(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const conflict = await prisma.allocation.findFirst({
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

  return !!conflict;
}

