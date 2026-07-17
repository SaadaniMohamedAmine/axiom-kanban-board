import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

// Same priority accent/badge system as the board's TaskCard
// (src/components/board/task-card.tsx) — duplicated rather than
// imported since that file is a client component with drag-and-drop
// wiring this server page has no use for.
const priorityStyles = {
  URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
  HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  LOW: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const priorityAccent = {
  URGENT: "from-red-500 to-red-400",
  HIGH: "from-red-500 to-orange-400",
  MEDIUM: "from-yellow-500 to-amber-400",
  LOW: "from-emerald-500 to-emerald-400",
};

export default async function AllTasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const t = await getTranslations("allTasksPage");
  const tDashboard = await getTranslations("dashboard");

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id, workspace: { archivedAt: null, deletedAt: null } },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const tasks = await prisma.task.findMany({
    where: {
      board: { workspaceId: { in: workspaceIds } },
      column: { name: { not: "Done" } },
      archivedAt: null,
    },
    include: {
      board: { select: { name: true, workspace: { select: { slug: true, name: true } } } },
      column: { select: { name: true } },
      assignees: { include: { user: { select: { id: true, name: true } } } },
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaceTasks.map((task) => {
                  const isOverdue = task.dueDate ? task.dueDate < today : false;
                  const isDueToday = task.dueDate ? task.dueDate >= today && task.dueDate < tomorrow : false;

                  return (
                    <Link
                      key={task.id}
                      href={`/${task.board.workspace.slug}/boards/${task.boardId}?task=${task.id}`}
                      className="gradient-border group relative flex flex-col p-4 overflow-hidden hover:shadow-glow transition-shadow"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${priorityAccent[task.priority]}`} />

                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityStyles[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant/40">{task.code}</span>
                      </div>

                      <h3 className="text-sm font-semibold text-on-surface leading-snug mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {task.title}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant/70 truncate mb-4">
                        {task.board.name} · {task.column.name}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex -space-x-1.5">
                          {task.assignees.map((a) => (
                            <span
                              key={a.id}
                              title={a.user.name}
                              className="w-6 h-6 rounded-full bg-primary/20 border-2 border-surface-container flex items-center justify-center text-[10px] font-bold text-primary shrink-0"
                            >
                              {a.user.name.slice(0, 2).toUpperCase()}
                            </span>
                          ))}
                        </div>

                        {task.dueDate ? (
                          <span
                            className={`text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-full ${
                              isOverdue ? "bg-error/15 text-error" : "text-on-surface-variant/60"
                            }`}
                          >
                            {isOverdue ? tDashboard("overdue") : isDueToday ? tDashboard("dueToday") : new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant/40">{t("noDueDate")}</span>
                        )}
                      </div>
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
