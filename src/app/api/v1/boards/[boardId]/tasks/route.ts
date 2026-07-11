import { NextRequest } from "next/server";
import { requireAPIKey } from "@/lib/api/require-api-key";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ boardId: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  const auth = await requireAPIKey(req);
  if ("error" in auth) return auth.error;

  const { workspaceId } = auth.context;
  const { boardId } = await params;

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId },
    select: { id: true },
  });

  if (!board) {
    return new Response(
      JSON.stringify({ error: "not_found", message: "Board not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const perPage = Math.min(100, parseInt(url.searchParams.get("per_page") ?? "50", 10));

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where: { boardId },
      include: {
        column: { select: { id: true, name: true } },
        assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
        labels: { include: { label: { select: { id: true, name: true, color: true } } } },
      },
      orderBy: [{ order: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.task.count({ where: { boardId } }),
  ]);

  return new Response(
    JSON.stringify({
      data: tasks,
      meta: { boardId, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
