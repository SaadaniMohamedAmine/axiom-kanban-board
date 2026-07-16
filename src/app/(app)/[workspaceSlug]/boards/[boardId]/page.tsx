import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { BoardViewWithModal } from "./board-view-with-modal";
import { CreateTaskModal } from "./create-task-modal";
import { SprintPanel } from "@/components/sprint/sprint-panel";
import { SprintHealthSummary } from "@/components/analytics/sprint-health-summary";
import { BlockedTasksList } from "@/components/board/blocked-tasks-list";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; boardId: string }>;
}) {
  const { workspaceSlug, boardId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    notFound();
  }

  const canEdit = workspace.members[0].role !== "VIEWER";

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              assignees: true,
              labels: true,
              comments: true,
              activity: true,
            },
          },
        },
      },
      sprints: {
        orderBy: { startDate: "desc" },
      },
      labels: {
        orderBy: { name: "asc" },
      },
      workspace: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!board || board.workspaceId !== workspace.id) {
    notFound();
  }

  const taskCounts = await prisma.taskAssignee.groupBy({
    by: ["userId"],
    where: {
      task: {
        boardId,
      },
    },
    _count: { taskId: true },
  });

  const boardMembers = board.workspace.members.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
    taskCount: taskCounts.find((t) => t.userId === m.user.id)?._count.taskId ?? 0,
  }));

  const allTasks = board.columns.flatMap((col) => col.tasks);

  const activeSprint = board.sprints.find((s) => s.status === "ACTIVE");
  const doneColumnId = board.columns[board.columns.length - 1]?.id;
  const sprintTasks = activeSprint ? allTasks.filter((t) => t.sprintId === activeSprint.id) : [];

  const now = new Date();
  const BLOCKED_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

  const completedTasks = sprintTasks.filter((t) => t.columnId === doneColumnId).length;

  const overdueTasks = sprintTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.columnId !== doneColumnId
  ).length;

  const blockedTasks = sprintTasks.filter((t) => {
    if (t.columnId === doneColumnId) return false;
    const statusChanges = t.activity
      .filter((a) => a.type === "STATUS_CHANGE")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const lastActivityAt = statusChanges[0]?.createdAt ?? t.createdAt;
    return now.getTime() - new Date(lastActivityAt).getTime() >= BLOCKED_THRESHOLD_MS;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 border-b border-outline-variant">
        <h1 className="text-h2 text-on-surface">{board.name}</h1>
      </div>
      <div className="flex-1 overflow-hidden flex">
        <div id="board-columns" className="flex-1 flex flex-col overflow-hidden">
          <BoardViewWithModal
            board={board}
            columns={board.columns}
            canEdit={canEdit}
            currentUser={{ id: session.user.id, name: session.user.name, image: session.user.image ?? null }}
            boardMembers={boardMembers}
          />
          {canEdit && <CreateTaskModal boardId={board.id} columns={board.columns} labels={board.labels} />}
        </div>
        {board.template === "SCRUM" && (
          <aside className="w-96 border-l border-outline-variant overflow-y-auto p-4 space-y-4">
            {activeSprint && (
              <>
                <SprintHealthSummary
                  sprintId={activeSprint.id}
                  sprintName={activeSprint.name}
                  overdueTasks={overdueTasks}
                  blockedTasks={blockedTasks.length}
                  totalTasks={sprintTasks.length}
                  completedTasks={completedTasks}
                />
                <BlockedTasksList
                  tasks={blockedTasks.map((t) => ({ id: t.id, code: t.code, title: t.title }))}
                />
              </>
            )}
            <SprintPanel boardId={board.id} sprints={board.sprints} tasks={allTasks} />
          </aside>
        )}
      </div>
    </div>
  );
}
