"use server";

import { prisma } from "../prisma";
import { requireRole } from "../permissions";
import { addCommentSchema, type AddCommentInput } from "../validations/task.schema";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { headers } from "next/headers";

export async function addComment(input: AddCommentInput) {
  const validated = addCommentSchema.parse(input);
  const { taskId, body } = validated;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { board: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await requireRole(task.board.workspaceId, "MEMBER");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  await prisma.$transaction([
    prisma.comment.create({
      data: {
        taskId,
        authorId: session.user.id,
        body,
      },
    }),
    prisma.activityEvent.create({
      data: {
        taskId,
        actorId: session.user.id,
        type: "COMMENTED",
        payload: {},
      },
    }),
  ]);

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}
