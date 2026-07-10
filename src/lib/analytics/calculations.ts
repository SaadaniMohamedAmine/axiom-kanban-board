import type { Sprint, Task } from "@prisma/client";

interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
}

interface VelocityPoint {
  sprint: string;
  points: number;
}

function getDaysBetween(a: Date, b: Date): number {
  return Math.max(
    1,
    Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function calculateBurndown(
  sprint: Sprint,
  tasks: (Task & { completedAt?: Date | null })[]
): BurndownPoint[] {
  const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
  const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.estimate ?? 1), 0);

  if (totalPoints === 0) return [];

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const today = new Date();
  const effectiveEnd = today < end ? today : end;

  const totalDays = getDaysBetween(start, end);
  const data: BurndownPoint[] = [];
  let remaining = totalPoints;

  const d = new Date(start);
  let dayIndex = 0;

  while (d <= effectiveEnd) {
    const dayStr = d.toISOString().slice(0, 10);

    const completedOnDay = sprintTasks.filter((t) => {
      if (!t.completedAt) return false;
      return t.completedAt.toISOString().slice(0, 10) === dayStr;
    });

    remaining = Math.max(
      0,
      remaining - completedOnDay.reduce((s, t) => s + (t.estimate ?? 1), 0)
    );

    const ideal = Math.max(
      0,
      totalPoints - (totalPoints / totalDays) * dayIndex
    );

    data.push({
      date: d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
      remaining,
      ideal: Math.round(ideal * 10) / 10,
    });

    d.setDate(d.getDate() + 1);
    dayIndex++;
  }

  return data;
}

export function calculateVelocity(
  sprints: (Sprint & { tasks: Task[] })[]
): VelocityPoint[] {
  return sprints
    .filter((s) => s.status === "COMPLETED")
    .slice(-6)
    .map((s) => ({
      sprint: s.name,
      points: s.tasks
        .filter((t) => t.sprintId === s.id)
        .reduce((sum, t) => sum + (t.estimate ?? 1), 0),
    }));
}
