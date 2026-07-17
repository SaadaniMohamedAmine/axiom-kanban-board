import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function MyTasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const t = await getTranslations("myTasksPage");
  const tDashboard = await getTranslations("dashboard");

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id, workspace: { archivedAt: null, deletedAt: null } },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const tasks = await prisma.task.findMany({
    where: {
      board: { workspaceId: { in: workspaceIds } },
      assignees: { some: { userId: session.user.id } },
      column: { name: { not: "Done" } },
    },
    include: {
      board: { select: { name: true, workspace: { select: { slug: true, name: true } } } },
      column: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sort undated tasks to the end without relying on DB-specific NULLS
  // ordering syntax — dueDate ascending, nulls last.
  const sortedTasks = [...tasks].sort((a, b) => {
    const aTime = a.dueDate ? a.dueDate.getTime() : Infinity;
    const bTime = b.dueDate ? b.dueDate.getTime() : Infinity;
    return aTime - bTime;
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const grouped = new Map<string, typeof sortedTasks>();
  for (const task of sortedTasks) {
    const key = task.board.workspace.name;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(task);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-h1 text-on-surface">{t("title")}</h1>
        <p className="text-[13px] text-on-surface-variant mt-1">{t("subtitle")}</p>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="border border-dashed border-outline-variant/40 rounded-xl p-8 text-center text-on-surface-variant">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([workspaceName, workspaceTasks]) => (
            <section key={workspaceName}>
              <h2 className="text-h3 text-on-surface mb-3">{workspaceName}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workspaceTasks.map((task) => {
                  const isOverdue = task.dueDate ? task.dueDate < today : false;
                  const isDueToday = task.dueDate ? task.dueDate >= today && task.dueDate < tomorrow : false;

                  return (
                    <Link
                      key={task.id}
                      href={`/${task.board.workspace.slug}/boards/${task.boardId}?task=${task.id}`}
                      className="flex items-center justify-between gap-3 p-4 bg-surface-container border border-outline-variant/50 rounded-xl hover:border-primary/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-body-md text-on-surface font-medium truncate">{task.title}</p>
                        <p className="text-label-md text-on-surface-variant truncate">
                          {task.board.name} · {task.column.name}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold shrink-0 px-2.5 py-1 rounded-full ${
                          isOverdue
                            ? "bg-error/15 text-error"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {isOverdue
                          ? tDashboard("overdue")
                          : isDueToday
                            ? tDashboard("dueToday")
                            : task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : t("noDueDate")}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
