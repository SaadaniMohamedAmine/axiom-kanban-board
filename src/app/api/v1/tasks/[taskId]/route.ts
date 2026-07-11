import { NextRequest } from "next/server";
import { requireAPIKey } from "@/lib/api/require-api-key";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { dispatchWebhooks } from "@/lib/api/webhook";

interface Props {
  params: Promise<{ taskId: string }>;
}

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  estimate: z.number().int().positive().nullable().optional(),
  columnId: z.string().cuid().optional(),
});

export async function PATCH(req: NextRequest, { params }: Props) {
  const auth = await requireAPIKey(req);
  if ("error" in auth) return auth.error;

  const { workspaceId } = auth.context;
  const { taskId } = await params;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      board: { workspaceId },
    },
    select: { id: true, boardId: true },
  });

  if (!task) {
    return new Response(
      JSON.stringify({ error: "not_found", message: "Task not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return new Response(
      JSON.stringify({ error: "bad_request", message: "Invalid JSON." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "validation_error", issues: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (parsed.data.columnId !== undefined) {
    const column = await prisma.column.findFirst({
      where: { id: parsed.data.columnId, boardId: task.boardId },
      select: { id: true },
    });
    if (!column) {
      return new Response(
        JSON.stringify({ error: "not_found", message: "Column not found on this task's board." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
      ...(parsed.data.estimate !== undefined && { estimate: parsed.data.estimate }),
      ...(parsed.data.columnId !== undefined && { columnId: parsed.data.columnId }),
    },
  });

  void dispatchWebhooks(workspaceId, "task.updated", { id: updated.id, changes: parsed.data });

  return new Response(JSON.stringify({ data: updated }), {
    headers: { "Content-Type": "application/json" },
  });
}
