import { NextRequest } from "next/server";
import { requireAPIKey } from "@/lib/api/require-api-key";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { dispatchWebhooks } from "@/lib/api/webhook";

const createTaskSchema = z.object({
  boardId: z.string().cuid(),
  columnId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  estimate: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAPIKey(req);
  if ("error" in auth) return auth.error;

  const { workspaceId } = auth.context;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "bad_request", message: "Invalid JSON body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "validation_error", issues: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { boardId, columnId, title, description, priority, estimate } = parsed.data;

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId },
    select: { id: true, taskCounter: true },
  });
  if (!board) {
    return new Response(
      JSON.stringify({ error: "not_found", message: "Board not found in this workspace." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
    select: { id: true },
  });
  if (!column) {
    return new Response(
      JSON.stringify({ error: "not_found", message: "Column not found in this board." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const [updatedBoard, maxOrder] = await Promise.all([
    prisma.board.update({
      where: { id: boardId },
      data: { taskCounter: { increment: 1 } },
      select: { taskCounter: true },
    }),
    prisma.task.aggregate({ where: { columnId }, _max: { order: true } }),
  ]);

  const task = await prisma.task.create({
    data: {
      boardId,
      columnId,
      title,
      description,
      priority,
      estimate,
      code: `AX-${updatedBoard.taskCounter}`,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  void dispatchWebhooks(workspaceId, "task.created", {
    id: task.id,
    code: task.code,
    title: task.title,
    boardId,
    columnId,
  });

  return new Response(JSON.stringify({ data: task }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
