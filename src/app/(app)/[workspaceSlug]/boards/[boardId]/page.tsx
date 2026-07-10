import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BoardViewWithModal } from "./board-view-with-modal";
import { CreateTaskForm } from "./create-task-form";
import { SprintPanel } from "@/components/sprint/sprint-panel";

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
    redirect("/");
  }

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
    },
  });

  if (!board || board.workspaceId !== workspace.id) {
    redirect(`/${workspaceSlug}`);
  }

  const allTasks = board.columns.flatMap((col) => col.tasks);

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 border-b border-outline-variant">
        <h1 className="text-h2 text-on-surface">{board.name}</h1>
      </div>
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col overflow-hidden">
          <BoardViewWithModal board={board} columns={board.columns} />
          <CreateTaskForm boardId={board.id} columns={board.columns} />
        </div>
        {board.template === "SCRUM" && (
          <aside className="w-96 border-l border-outline-variant overflow-y-auto">
            <SprintPanel boardId={board.id} sprints={board.sprints} tasks={allTasks} />
          </aside>
        )}
      </div>
    </div>
  );
}
