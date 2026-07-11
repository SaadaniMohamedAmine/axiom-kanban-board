import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ tasks: [], boards: [] }));
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const [tasks, boards] = await Promise.all([
    prisma.task.findMany({
      where: {
        board: { workspaceId: { in: workspaceIds } },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        board: { include: { workspace: { select: { slug: true } } } },
        column: { select: { name: true } },
      },
      take: 8,
    }),
    prisma.board.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        name: { contains: q, mode: "insensitive" },
      },
      include: { workspace: { select: { slug: true } } },
      take: 4,
    }),
  ]);

  return new Response(
    JSON.stringify({
      tasks: tasks.map((t) => ({
        id: t.id,
        code: t.code,
        title: t.title,
        column: t.column.name,
        href: `/${t.board.workspace.slug}/boards/${t.boardId}?task=${t.id}`,
      })),
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        href: `/${b.workspace.slug}/boards/${b.id}`,
      })),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
