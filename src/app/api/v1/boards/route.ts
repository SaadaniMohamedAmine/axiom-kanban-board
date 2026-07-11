import { NextRequest } from "next/server";
import { requireAPIKey } from "@/lib/api/require-api-key";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAPIKey(req);
  if ("error" in auth) return auth.error;

  const { workspaceId } = auth.context;

  const boards = await prisma.board.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      template: true,
      taskCounter: true,
      createdAt: true,
      _count: { select: { tasks: true, columns: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return new Response(
    JSON.stringify({
      data: boards,
      meta: { workspaceId, count: boards.length },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
