"use server";

import { prisma } from "../prisma";
import { requireRole } from "../permissions";
import {
  createBoardSchema,
  createColumnSchema,
  renameColumnSchema,
  reorderColumnSchema,
  recolorColumnSchema,
  type CreateBoardInput,
  type CreateColumnInput,
  type RenameColumnInput,
  type ReorderColumnInput,
  type RecolorColumnInput,
} from "../validations/board.schema";
import { revalidatePath } from "next/cache";
import { calculateOrderAtEnd } from "../task-order";

const DEFAULT_COLUMNS: Record<string, { name: string; color: string }[]> = {
  KANBAN: [
    { name: "To Do", color: "#6B7280" },
    { name: "In Progress", color: "#3B82F6" },
    { name: "Done", color: "#10B981" },
  ],
  SCRUM: [
    { name: "Backlog", color: "#6B7280" },
    { name: "To Do", color: "#9CA3AF" },
    { name: "In Progress", color: "#3B82F6" },
    { name: "Review", color: "#F59E0B" },
    { name: "Done", color: "#10B981" },
  ],
  BUG_TRACKING: [
    { name: "Reported", color: "#EF4444" },
    { name: "Confirmed", color: "#F59E0B" },
    { name: "In Progress", color: "#3B82F6" },
    { name: "Resolved", color: "#10B981" },
  ],
  CUSTOM: [],
};

export async function createBoard(input: CreateBoardInput) {
  const validated = createBoardSchema.parse(input);
  const { workspaceId, name, template } = validated;

  await requireRole(workspaceId, "ADMIN");

  const defaultColumns = DEFAULT_COLUMNS[template] ?? DEFAULT_COLUMNS.CUSTOM;

  const board = await prisma.board.create({
    data: {
      workspaceId,
      name,
      template,
      columns: {
        create: defaultColumns.map((col, index) => ({
          name: col.name,
          color: col.color,
          order: (index + 1) * 1000,
        })),
      },
    },
  });

  revalidatePath(`/${workspaceId}/boards`, "page");
  return board;
}

export async function createColumn(input: CreateColumnInput) {
  const validated = createColumnSchema.parse(input);
  const { boardId, name, color } = validated;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { order: "desc" },
        take: 1,
      },
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  await requireRole(board.workspaceId, "ADMIN");

  const lastColumnOrder = board.columns[0]?.order ?? null;
  const order = calculateOrderAtEnd(lastColumnOrder);

  const column = await prisma.column.create({
    data: {
      boardId,
      name,
      color,
      order,
    },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return column;
}

export async function renameColumn(input: RenameColumnInput) {
  const validated = renameColumnSchema.parse(input);
  const { columnId, name } = validated;

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: true },
  });

  if (!column) {
    throw new Error("Column not found");
  }

  await requireRole(column.board.workspaceId, "ADMIN");

  await prisma.column.update({
    where: { id: columnId },
    data: { name },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function reorderColumn(input: ReorderColumnInput) {
  const validated = reorderColumnSchema.parse(input);
  const { columnId, order } = validated;

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: true },
  });

  if (!column) {
    throw new Error("Column not found");
  }

  await requireRole(column.board.workspaceId, "ADMIN");

  await prisma.column.update({
    where: { id: columnId },
    data: { order },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function recolorColumn(input: RecolorColumnInput) {
  const validated = recolorColumnSchema.parse(input);
  const { columnId, color } = validated;

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: true },
  });

  if (!column) {
    throw new Error("Column not found");
  }

  await requireRole(column.board.workspaceId, "ADMIN");

  await prisma.column.update({
    where: { id: columnId },
    data: { color },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function deleteColumn(columnId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: {
      board: true,
      _count: { select: { tasks: true } },
    },
  });

  if (!column) {
    throw new Error("Column not found");
  }

  await requireRole(column.board.workspaceId, "ADMIN");

  if (column._count.tasks > 0) {
    throw new Error("Cannot delete column with tasks. Move or delete tasks first.");
  }

  await prisma.column.delete({
    where: { id: columnId },
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}
