import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { timeAgo } from "@/lib/time-ago";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id, workspace: { archivedAt: null, deletedAt: null } },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true, boards: true } },
        },
      },
    },
    orderBy: { workspace: { name: "asc" } },
  });

  if (memberships.length === 0) redirect("/workspaces/new");

  const workspaceIds = memberships.map((m) => m.workspaceId);
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [myTasks, activeSprints, aiSuggestionsThisWeek, recentAuditLogs, recentActivityEvents] = await Promise.all([
    prisma.task.findMany({
      where: {
        board: { workspaceId: { in: workspaceIds } },
        dueDate: { lt: endOfToday },
        assignees: { some: { userId: session.user.id } },
        column: { name: { not: "Done" } },
      },
      include: {
        board: { select: { name: true, workspace: { select: { slug: true } } } },
        column: { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
    prisma.sprint.findMany({
      where: { board: { workspaceId: { in: workspaceIds } }, status: "ACTIVE" },
      include: { board: { select: { name: true, workspaceId: true, workspace: { select: { slug: true } } } } },
      take: 10,
    }),
    prisma.auditLog.count({
      where: { workspaceId: { in: workspaceIds }, action: "AI_SUGGESTION_APPLIED", createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.auditLog.findMany({
      where: { workspaceId: { in: workspaceIds }, actorId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, action: true, targetLabel: true, workspaceId: true, createdAt: true },
    }),
    prisma.activityEvent.findMany({
      where: { actorId: session.user.id, task: { board: { workspaceId: { in: workspaceIds } } } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            boardId: true,
            board: { select: { name: true, workspace: { select: { slug: true } } } },
          },
        },
      },
    }),
  ]);

  const aiRequestsToday = memberships.reduce((sum, m) => sum + m.workspace.aiRequestsToday, 0);

  const locale = (await getLocale()) as "fr" | "en";
  const t = await getTranslations("dashboard");
  const tSettings = await getTranslations("settings");
  const tAi = await getTranslations("ai");
  const tNav = await getTranslations("nav");
  const tActions = await getTranslations("auditActions");

  const todayLabel = now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });

  function describeActivityEvent(type: string, payload: unknown, taskTitle: string): string {
    const p = (payload ?? {}) as Record<string, unknown>;
    switch (type) {
      case "STATUS_CHANGE":
        return p.field === "column" ? `Moved ${taskTitle}` : `Updated ${p.field} on ${taskTitle}`;
      case "ASSIGNED":
        return `Updated assignees on ${taskTitle}`;
      case "COMMENTED":
        return `Commented on ${taskTitle}`;
      default:
        return `Updated ${taskTitle}`;
    }
  }

  const recentActivityFeed = [
    ...recentAuditLogs.map((log) => {
      const workspace = memberships.find((m) => m.workspaceId === log.workspaceId)?.workspace;
      return {
        id: `audit-${log.id}`,
        createdAt: log.createdAt,
        label: log.targetLabel ? `${tActions(log.action)}: ${log.targetLabel}` : tActions(log.action),
        subLabel: workspace?.name,
        href: workspace ? `/${workspace.slug}` : "/workspaces",
      };
    }),
    ...recentActivityEvents.map((ev) => ({
      id: `activity-${ev.id}`,
      createdAt: ev.createdAt,
      label: describeActivityEvent(ev.type, ev.payload, ev.task.title),
      subLabel: ev.task.board.name,
      href: `/${ev.task.board.workspace.slug}/boards/${ev.task.boardId}?task=${ev.task.id}`,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div>
        <p className="text-[13px] text-on-surface-variant capitalize">{todayLabel}</p>
        <h1 className="text-h1 text-on-surface mt-1">{t("greeting", { name: session.user.name })}</h1>
      </div>

      <section>
        <h2 className="text-h2 text-on-surface mb-1">{t("needsAttention")}</h2>
        <p className="text-[13px] text-on-surface-variant mb-4">{t("needsAttentionDesc")}</p>
        {myTasks.length === 0 ? (
          <div className="border border-dashed border-outline-variant/40 rounded-xl p-8 text-center text-on-surface-variant">
            {t("nothingDueToday")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myTasks.map((task) => {
              const isOverdue = task.dueDate! < new Date(now.getFullYear(), now.getMonth(), now.getDate());
              return (
                <Link
                  key={task.id}
                  href={`/${task.board.workspace.slug}/boards/${task.boardId}?task=${task.id}`}
                  className="flex items-center justify-between gap-3 p-4 bg-surface-container border border-outline-variant/50 rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-body-md text-on-surface font-medium truncate">{task.title}</p>
                    <p className="text-label-md text-on-surface-variant truncate">{task.board.name} · {task.column.name}</p>
                  </div>
                  <span className={`text-[11px] font-semibold shrink-0 px-2.5 py-1 rounded-full ${isOverdue ? "bg-error/15 text-error" : "bg-surface-container-high text-on-surface-variant"}`}>
                    {isOverdue ? t("overdue") : t("dueToday")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6] shrink-0">
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              </svg>
            </div>
            <h2 className="text-h3 text-primary">{tAi("name")}</h2>
          </div>
          <div className="gradient-border flex-1">
            <div className="p-6 space-y-4">
              <div>
                <div className="text-3xl font-semibold text-[#8B5CF6]">{aiRequestsToday}</div>
                <div className="text-[12px] text-on-surface-variant mt-0.5">{t("aiRequestsToday")}</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-[#22D3EE]">{aiSuggestionsThisWeek}</div>
                <div className="text-[12px] text-on-surface-variant mt-0.5">{t("suggestionsAppliedWeek")}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col">
          <h2 className="text-h3 text-on-surface mb-4 shrink-0">{t("yourWorkspaces")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {memberships.map((m) => {
              const sprint = activeSprints.find((s) => s.board.workspaceId === m.workspaceId);
              return (
                <Link
                  key={m.workspace.id}
                  href={`/${m.workspace.slug}`}
                  className="flex flex-col p-5 bg-surface-container border border-outline-variant/50 rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] shrink-0">
                      {m.workspace.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-md text-on-surface font-semibold truncate">{m.workspace.name}</p>
                      <p className="text-[12px] text-on-surface-variant truncate">
                        {m.workspace._count.boards} {tNav("boards").toLowerCase()} · {tNav("membersCount", { count: m.workspace._count.members })}
                      </p>
                    </div>
                  </div>
                  <div className="text-[12px] text-on-surface-variant/70 border-t border-outline-variant/20 pt-2.5 mt-auto">
                    {sprint ? `${t("activeSprint")}: ${sprint.name}` : t("noActiveSprint")}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-h3 text-on-surface mb-1">{t("recentActivity")}</h2>
        <p className="text-[13px] text-on-surface-variant mb-4">Your recent actions across every workspace</p>
        {recentActivityFeed.length === 0 ? (
          <div className="border border-dashed border-outline-variant/40 rounded-xl p-8 text-center text-on-surface-variant">
            {tSettings("nothingHereYet")}
          </div>
        ) : (
          <div className="gradient-border">
            {recentActivityFeed.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between gap-3 p-4 border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-container-high/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-on-surface leading-snug truncate">{item.label}</p>
                  {item.subLabel && <p className="text-[12px] text-on-surface-variant/70 truncate">{item.subLabel}</p>}
                </div>
                <span className="text-[10px] text-on-surface-variant/50 whitespace-nowrap shrink-0">{timeAgo(item.createdAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
