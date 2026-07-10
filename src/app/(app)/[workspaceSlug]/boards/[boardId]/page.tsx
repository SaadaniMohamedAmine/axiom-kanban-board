import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BoardView } from "@/components/board/board-view";
import { CreateTaskForm } from "./create-task-form";

export default async function BoardPage({
  params,
}: {
  params: { workspaceSlug: string; boardId: string };
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
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
    where: { id: params.boardId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!board || board.workspaceId !== workspace.id) {
    redirect(`/${params.workspaceSlug}/boards`);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 border-b border-outline-variant">
        <h1 className="text-h2 text-on-surface">{board.name}</h1>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <BoardView board={board} columns={board.columns} />
      </div>
      <CreateTaskForm boardId={board.id} columns={board.columns} />
    </div>
  );
}
