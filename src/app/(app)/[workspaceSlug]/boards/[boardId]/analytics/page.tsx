import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BurndownChart } from "@/components/analytics/burndown-chart";
import { VelocityChart } from "@/components/analytics/velocity-chart";
import { SprintHealthSummary } from "@/components/analytics/sprint-health-summary";
import { AnalyticsEmptyState } from "@/components/analytics/analytics-empty-state";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import { WorkloadBalance } from "@/components/analytics/workload-balance";
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

  const t = await getTranslations("analytics");
  const tNav = await getTranslations("nav");

  const sprints = await prisma.sprint.findMany({
    where: { boardId },
    include: {
      tasks: true,
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
          assignees: { include: { user: { select: { id: true, name: true } } } },
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

  const BLOCKED_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;
  const blockedTasks = activeSprint
    ? tasksWithActivity.filter((t) => {
        if (t.columnId === doneColumnId) return false;
        const lastActivityAt = t.activity[0]?.createdAt ?? t.createdAt;
        return now.getTime() - new Date(lastActivityAt).getTime() >= BLOCKED_THRESHOLD_MS;
      }).length
    : 0;

  const completionRate = tasksWithActivity.length > 0
    ? Math.round((completedTasks / tasksWithActivity.length) * 100)
    : 0;

  const velocityAvg = velocityData.length > 0
    ? Math.round(velocityData.reduce((sum, d) => sum + d.points, 0) / velocityData.length)
    : 0;

  const lastBurndownPoint = burndownData[burndownData.length - 1];
  const schedulePaceDelta = lastBurndownPoint
    ? Math.round(lastBurndownPoint.ideal - lastBurndownPoint.remaining)
    : 0;

  const workloadMap = new Map<string, { userId: string; name: string; points: number; tasks: number }>();
  for (const task of tasksWithActivity) {
    if (task.columnId === doneColumnId) continue;
    for (const assignee of task.assignees) {
      const existing = workloadMap.get(assignee.userId) ?? {
        userId: assignee.userId,
        name: assignee.user.name,
        points: 0,
        tasks: 0,
      };
      existing.points += task.estimate ?? 1;
      existing.tasks += 1;
      workloadMap.set(assignee.userId, existing);
    }
  }
  const workloadEntries = [...workloadMap.values()].sort((a, b) => b.points - a.points);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
            {board.name}
          </div>
          <h1 className="text-2xl font-semibold text-on-surface">{tNav("analytics")}</h1>
        </div>
        {activeSprint && lastBurndownPoint && (
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[13px] text-on-surface ${
              schedulePaceDelta > 0
                ? "border-tertiary/30 bg-tertiary/5"
                : schedulePaceDelta < 0
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-outline-variant/30 bg-surface-container"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                schedulePaceDelta > 0 ? "bg-tertiary" : schedulePaceDelta < 0 ? "bg-amber-500" : "bg-on-surface-variant"
              }`}
            />
            {schedulePaceDelta > 0
              ? t("pointsAheadOfSchedule", { points: schedulePaceDelta })
              : schedulePaceDelta < 0
              ? t("pointsBehindSchedule", { points: Math.abs(schedulePaceDelta) })
              : t("onPace")}
          </div>
        )}
      </div>

      {!activeSprint && velocityData.length === 0 ? (
        <AnalyticsEmptyState />
      ) : (
        <div className="space-y-6">
          {activeSprint && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <AnalyticsStatCard
                label={t("completionRate")}
                value={`${completionRate}%`}
                icon={
                  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                    <line x1="18" x2="18" y1="20" y2="10" /><line x1="12" x2="12" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="14" />
                  </svg>
                }
              />
              <AnalyticsStatCard
                label={t("velocity")}
                value={String(velocityAvg)}
                sub={t("storyPoints")}
                icon={
                  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                }
              />
              <AnalyticsStatCard
                label={t("activeBlockers")}
                value={String(blockedTasks)}
                tone={blockedTasks > 0 ? "error" : "default"}
                icon={
                  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" /><path d="M12 17h.01" />
                  </svg>
                }
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-outline-variant/20 bg-surface-container p-6">
              {activeSprint ? (
                <BurndownChart data={burndownData} sprintName={activeSprint.name} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[13px] text-on-surface-variant/50">
                  {t("noActiveSprint")}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <WorkloadBalance entries={workloadEntries} />
            </div>
          </div>

          {activeSprint && (
            <SprintHealthSummary
              sprintId={activeSprint.id}
              sprintName={activeSprint.name}
              overdueTasks={overdueTasks}
              blockedTasks={blockedTasks}
              totalTasks={tasksWithActivity.length}
              completedTasks={completedTasks}
            />
          )}

          <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6">
            <VelocityChart data={velocityData} />
          </div>
        </div>
      )}
    </div>
  );
}
