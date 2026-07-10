import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { BurndownChart } from "@/components/analytics/burndown-chart";
import { VelocityChart } from "@/components/analytics/velocity-chart";
import { SprintHealthSummary } from "@/components/analytics/sprint-health-summary";
import { AnalyticsEmptyState } from "@/components/analytics/analytics-empty-state";
import { calculateBurndown, calculateVelocity } from "@/lib/analytics/calculations";

interface Props {
  params: Promise<{ workspaceSlug: string; boardId: string }>;
}

export default async function AnalyticsPage({ params }: Props) {
  const { workspaceSlug, boardId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      workspace: {
        slug: workspaceSlug,
        members: { some: { userId: session.user.id } },
      },
    },
    include: { workspace: true },
  });

  if (!board) notFound();

  const sprints = await prisma.sprint.findMany({
    where: { boardId },
    include: {
      tasks: {
        select: { id: true, estimate: true, sprintId: true, dueDate: true, columnId: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");

  const tasksWithActivity = activeSprint
    ? await prisma.task.findMany({
        where: { sprintId: activeSprint.id },
        include: {
          activity: {
            where: { type: "STATUS_CHANGE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      })
    : [];

  const lastColumns = await prisma.column.findMany({
    where: { boardId },
    orderBy: { order: "desc" },
    take: 1,
  });
  const doneColumnId = lastColumns[0]?.id;

  const tasksForBurndown = tasksWithActivity.map((t) => ({
    ...t,
    completedAt:
      t.columnId === doneColumnId && t.activity[0]
        ? t.activity[0].createdAt
        : null,
  }));

  const burndownData = activeSprint
    ? calculateBurndown(activeSprint, tasksForBurndown)
    : [];

  const velocityData = calculateVelocity(
    sprints.map((s) => ({ ...s, tasks: s.tasks }))
  );

  const now = new Date();
  const overdueTasks = activeSprint
    ? tasksWithActivity.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < now &&
          t.columnId !== doneColumnId
      ).length
    : 0;

  const completedTasks = activeSprint
    ? tasksWithActivity.filter((t) => t.columnId === doneColumnId).length
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          {board.name}
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Analytics</h1>
      </div>

      {!activeSprint && velocityData.length === 0 ? (
        <AnalyticsEmptyState />
      ) : (
        <div className="space-y-8">
          {activeSprint && (
            <SprintHealthSummary
              boardId={boardId}
              sprintId={activeSprint.id}
              sprintName={activeSprint.name}
              overdueTasks={overdueTasks}
              blockedTasks={0}
              totalTasks={tasksWithActivity.length}
              completedTasks={completedTasks}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6">
              {activeSprint ? (
                <BurndownChart data={burndownData} sprintName={activeSprint.name} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[13px] text-on-surface-variant/50">
                  No active sprint.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6">
              <VelocityChart data={velocityData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
