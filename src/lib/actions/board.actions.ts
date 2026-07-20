"use server";

import { prisma } from "../prisma";
import { requireRole } from "../permissions";
import { getPlanLimits } from "../billing/plan-limits";
import { createAuditLog } from "../audit/log";
import { createNotification } from "../notifications/create";
import { getTranslations } from "next-intl/server";
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
import { triggerBoardEvent } from "../realtime";
import { auth } from "../auth";
import { headers } from "next/headers";
import type { BoardEvent } from "@/types/realtime.types";

function makeColumnEvent(
  boardId: string,
  actorId: string,
  columnId: string,
  data: Record<string, unknown>,
): BoardEvent {
  return {
    type: "column.updated",
    boardId,
    taskId: null,
    columnId,
    actorId,
    data,
    timestamp: new Date().toISOString(),
  };
}

const DEFAULT_COLUMNS: Record<string, { name: string; color: string }[]> = {
  KANBAN: [
    { name: "Backlog", color: "#6B7280" },
    { name: "To Do", color: "#9CA3AF" },
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
    { name: "Backlog", color: "#6B7280" },
    { name: "Reported", color: "#EF4444" },
    { name: "Confirmed", color: "#F59E0B" },
    { name: "In Progress", color: "#3B82F6" },
    { name: "Resolved", color: "#10B981" },
  ],
  // CUSTOM intentionally starts empty — its whole purpose is a blank slate
  // the user builds themselves, so it's excluded from the "always present"
  // Backlog rule.
  CUSTOM: [],
};

export async function createBoard(input: CreateBoardInput) {
  const validated = createBoardSchema.parse(input);
  const { workspaceId, name, template } = validated;

  await requireRole(workspaceId, "ADMIN");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, _count: { select: { boards: { where: { archivedAt: null, deletedAt: null } } } } },
  });
  if (!workspace) throw new Error("Workspace not found");
  const limits = getPlanLimits(workspace.plan);
  if (workspace._count.boards >= limits.maxBoards) {
    // Next.js redacts thrown-error messages from Server Actions in
    // production — expected failures must be return values instead (see
    // board-create-modal.tsx).
    return { error: "PLAN_LIMIT_BOARDS" as const, plan: workspace.plan };
  }

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

  const boardSession = await auth.api.getSession({ headers: await headers() });
  if (boardSession) {
    void createAuditLog({
      workspaceId,
      actorId: boardSession.user.id,
      actorEmail: boardSession.user.email,
      action: "BOARD_CREATED",
      targetType: "board",
      targetId: board.id,
      targetLabel: board.name,
    });
    const tBoardCreated = await getTranslations("notificationMessages");
    void createNotification({
      userId: boardSession.user.id,
      type: "board_created",
      title: tBoardCreated("board_created.title"),
      message: tBoardCreated("board_created.message", { name: board.name }),
    });
  }

  revalidatePath(`/[workspaceSlug]`, "page");
  return board;
}

export async function archiveBoard(boardId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("Board not found");

  await requireRole(board.workspaceId, "ADMIN");

  await prisma.board.update({
    where: { id: boardId },
    data: { archivedAt: new Date() },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId: board.workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "BOARD_ARCHIVED",
      targetType: "board",
      targetId: boardId,
      targetLabel: board.name,
    });
    const tBoardArchived = await getTranslations("notificationMessages");
    void createNotification({
      userId: session.user.id,
      type: "board_archived",
      title: tBoardArchived("board_archived.title"),
      message: tBoardArchived("board_archived.message", { name: board.name }),
    });
  }

  revalidatePath(`/[workspaceSlug]`, "page");
  return { success: true };
}

export async function unarchiveBoard(boardId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("Board not found");

  await requireRole(board.workspaceId, "ADMIN");

  await prisma.board.update({
    where: { id: boardId },
    data: { archivedAt: null },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId: board.workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "BOARD_UNARCHIVED",
      targetType: "board",
      targetId: boardId,
      targetLabel: board.name,
    });
  }

  revalidatePath(`/[workspaceSlug]`, "page");
  return { success: true };
}

export async function trashBoard(boardId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("Board not found");

  await requireRole(board.workspaceId, "ADMIN");

  await prisma.board.update({
    where: { id: boardId },
    data: { deletedAt: new Date() },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId: board.workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "BOARD_TRASHED",
      targetType: "board",
      targetId: boardId,
      targetLabel: board.name,
    });
    const tBoardDeleted = await getTranslations("notificationMessages");
    void createNotification({
      userId: session.user.id,
      type: "board_deleted",
      title: tBoardDeleted("board_deleted.title"),
      message: tBoardDeleted("board_deleted.message", { name: board.name }),
    });
  }

  revalidatePath(`/[workspaceSlug]`, "page");
  return { success: true };
}

export async function restoreBoard(boardId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("Board not found");

  await requireRole(board.workspaceId, "ADMIN");

  await prisma.board.update({
    where: { id: boardId },
    data: { deletedAt: null },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId: board.workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "BOARD_RESTORED",
      targetType: "board",
      targetId: boardId,
      targetLabel: board.name,
    });
  }

  revalidatePath(`/[workspaceSlug]`, "page");
  return { success: true };
}

export async function permanentlyDeleteBoard(boardId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("Board not found");

  await requireRole(board.workspaceId, "ADMIN");

  await prisma.board.delete({ where: { id: boardId } });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId: board.workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "BOARD_DELETED",
      targetType: "board",
      targetId: boardId,
      targetLabel: board.name,
    });
  }

  revalidatePath(`/[workspaceSlug]`, "page");
  return { success: true };
}

export async function createColumn(input: CreateColumnInput, socketId?: string) {
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

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    await triggerBoardEvent(
      boardId,
      makeColumnEvent(boardId, session.user.id, column.id, column as unknown as Record<string, unknown>),
      socketId,
    );
  }

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return column;
}

export async function renameColumn(input: RenameColumnInput, socketId?: string) {
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

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    await triggerBoardEvent(
      column.boardId,
      makeColumnEvent(column.boardId, session.user.id, columnId, { columnId, name }),
      socketId,
    );
  }

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function reorderColumn(input: ReorderColumnInput, socketId?: string) {
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

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    await triggerBoardEvent(
      column.boardId,
      makeColumnEvent(column.boardId, session.user.id, columnId, { columnId, order }),
      socketId,
    );
  }

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function recolorColumn(input: RecolorColumnInput, socketId?: string) {
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

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    await triggerBoardEvent(
      column.boardId,
      makeColumnEvent(column.boardId, session.user.id, columnId, { columnId, color }),
      socketId,
    );
  }

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function deleteColumn(columnId: string, socketId?: string) {
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

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    await triggerBoardEvent(
      column.boardId,
      makeColumnEvent(column.boardId, session.user.id, columnId, { columnId, deleted: true }),
      socketId,
    );
  }

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}
