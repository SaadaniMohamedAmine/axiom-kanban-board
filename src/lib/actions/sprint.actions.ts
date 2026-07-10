"use server";

import { prisma } from "../prisma";
import { requireRole } from "../permissions";
import {
  createSprintSchema,
  updateSprintSchema,
  attachTaskToSprintSchema,
  detachTaskFromSprintSchema,
  type CreateSprintInput,
  type UpdateSprintInput,
  type AttachTaskToSprintInput,
  type DetachTaskFromSprintInput,
} from "../validations/sprint.schema";
import { revalidatePath } from "next/cache";

export async function createSprint(input: CreateSprintInput) {
  const validated = createSprintSchema.parse(input);
  const { boardId, name, startDate, endDate } = validated;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  await requireRole(board.workspaceId, "MEMBER");

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    throw new Error("End date must be after start date");
  }

  const sprint = await prisma.sprint.create({
    data: {
      boardId,
      name,
      startDate: start,
      endDate: end,
      status: "PLANNED",
    },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return sprint;
}

export async function updateSprint(input: UpdateSprintInput) {
  const validated = updateSprintSchema.parse(input);
  const { sprintId, name, startDate, endDate, status } = validated;

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { board: true },
  });

  if (!sprint) {
    throw new Error("Sprint not found");
  }

  await requireRole(sprint.board.workspaceId, "MEMBER");

  const updates: Record<string, unknown> = {};

  if (name !== undefined) updates.name = name;
  if (startDate !== undefined) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : sprint.endDate;
    if (end < start) {
      throw new Error("End date must be after start date");
    }
    updates.startDate = start;
  }
  if (endDate !== undefined) {
    const end = new Date(endDate);
    const start = startDate ? new Date(startDate) : sprint.startDate;
    if (end < start) {
      throw new Error("End date must be after start date");
    }
    updates.endDate = end;
  }
  if (status !== undefined) updates.status = status;

  await prisma.sprint.update({
    where: { id: sprintId },
    data: updates,
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function deleteSprint(sprintId: string) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { board: true },
  });

  if (!sprint) {
    throw new Error("Sprint not found");
  }

  await requireRole(sprint.board.workspaceId, "MEMBER");

  await prisma.sprint.delete({
    where: { id: sprintId },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function attachTaskToSprint(input: AttachTaskToSprintInput) {
  const validated = attachTaskToSprintSchema.parse(input);
  const { taskId, sprintId } = validated;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { board: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await requireRole(task.board.workspaceId, "MEMBER");

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
  });

  if (!sprint || sprint.boardId !== task.boardId) {
    throw new Error("Sprint not found");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { sprintId },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function detachTaskFromSprint(input: DetachTaskFromSprintInput) {
  const validated = detachTaskFromSprintSchema.parse(input);
  const { taskId } = validated;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { board: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await requireRole(task.board.workspaceId, "MEMBER");

  await prisma.task.update({
    where: { id: taskId },
    data: { sprintId: null },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}
