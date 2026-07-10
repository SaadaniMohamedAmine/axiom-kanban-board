"use server";

import { prisma } from "../prisma";
import { requireRole } from "../permissions";
import { generateTaskCode } from "../task-code";
import { calculateOrderAtEnd, calculateOrderBetween } from "../task-order";
import {
  createTaskSchema,
  moveTaskSchema,
  type CreateTaskInput,
  type MoveTaskInput,
} from "../validations/task.schema";
import { revalidatePath } from "next/cache";

export async function createTask(input: CreateTaskInput) {
  const validated = createTaskSchema.parse(input);
  const { boardId, columnId, title, description, priority, estimate, dueDate } = validated;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  await requireRole(board.workspaceId, "MEMBER");

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: {
      tasks: {
        orderBy: { order: "desc" },
        take: 1,
      },
    },
  });

  if (!column || column.boardId !== boardId) {
    throw new Error("Column not found");
  }

  const lastTaskOrder = column.tasks[0]?.order ?? null;
  const order = calculateOrderAtEnd(lastTaskOrder);

  const code = await generateTaskCode(boardId);

  const task = await prisma.task.create({
    data: {
      boardId,
      columnId,
      code,
      title,
      description,
      priority: priority ?? "MEDIUM",
      estimate,
      dueDate: dueDate ? new Date(dueDate) : null,
      order,
    },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return task;
}

export async function moveTask(input: MoveTaskInput) {
  const validated = moveTaskSchema.parse(input);
  const { taskId, targetColumnId, targetIndex } = validated;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { board: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await requireRole(task.board.workspaceId, "MEMBER");

  const targetColumn = await prisma.column.findUnique({
    where: { id: targetColumnId },
    include: {
      tasks: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!targetColumn || targetColumn.boardId !== task.boardId) {
    throw new Error("Target column not found");
  }

  const tasksInColumn = targetColumn.tasks.filter((t) => t.id !== taskId);
  const previousTask = targetIndex > 0 ? tasksInColumn[targetIndex - 1] : null;
  const nextTask = targetIndex < tasksInColumn.length ? tasksInColumn[targetIndex] : null;

  const previousOrder = previousTask?.order ?? null;
  const nextOrder = nextTask?.order ?? null;

  const order = calculateOrderBetween(previousOrder, nextOrder);

  const columnChanged = task.columnId !== targetColumnId;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      columnId: targetColumnId,
      order,
    },
  });

  if (columnChanged) {
    await prisma.activityEvent.create({
      data: {
        taskId,
        actorId: (await (await import("../auth")).auth.api.getSession({ headers: await (await import("next/headers")).headers() }))?.user.id ?? "",
        type: "STATUS_CHANGE",
        payload: {
          field: "column",
          from: task.columnId,
          to: targetColumnId,
        },
      },
    });
  }

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { board: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await requireRole(task.board.workspaceId, "MEMBER");

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}
