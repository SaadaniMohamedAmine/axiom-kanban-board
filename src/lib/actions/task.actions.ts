"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { requireRole } from "../permissions";
import { generateTaskCode } from "../task-code";
import { calculateOrderAtEnd, calculateOrderBetween, renumberOrders } from "../task-order";
import {
  createTaskSchema,
  moveTaskSchema,
  updateTaskFieldsSchema,
  setTaskAssigneesSchema,
  setTaskLabelsSchema,
  type CreateTaskInput,
  type MoveTaskInput,
  type UpdateTaskFieldsInput,
  type SetTaskAssigneesInput,
  type SetTaskLabelsInput,
} from "../validations/task.schema";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { headers } from "next/headers";
import { triggerBoardEvent } from "../realtime";
import { dispatchWebhooks } from "../api/webhook";
import type { BoardEvent, ConflictEvent } from "@/types/realtime.types";
import { createAuditLog } from "../audit/log";

function makeEvent(
  type: BoardEvent["type"],
  boardId: string,
  actorId: string,
  data: Record<string, unknown>,
  taskId: string | null = null,
  columnId: string | null = null,
): BoardEvent {
  return { type, boardId, taskId, columnId, actorId, data, timestamp: new Date().toISOString() };
}

export async function createTask(input: CreateTaskInput, socketId?: string) {
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

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    await triggerBoardEvent(
      boardId,
      makeEvent("task.created", boardId, session.user.id, task as unknown as Record<string, unknown>, task.id, columnId),
      socketId,
    );
    void dispatchWebhooks(board.workspaceId, "task.created", {
      id: task.id,
      code: task.code,
      title: task.title,
      boardId,
      columnId,
    });
  }

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return task;
}

export async function moveTask(input: MoveTaskInput, socketId?: string) {
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

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

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

  let tasksInColumn = targetColumn.tasks.filter((t) => t.id !== taskId);
  let previousOrder = targetIndex > 0 ? tasksInColumn[targetIndex - 1]?.order ?? null : null;
  let nextOrder = targetIndex < tasksInColumn.length ? tasksInColumn[targetIndex]?.order ?? null : null;

  let order = calculateOrderBetween(previousOrder, nextOrder);

  if (previousOrder !== null && order <= previousOrder) {
    const renumbered = renumberOrders(tasksInColumn.length);
    await prisma.$transaction(
      tasksInColumn.map((t, i) =>
        prisma.task.update({ where: { id: t.id }, data: { order: renumbered[i] } })
      )
    );
    tasksInColumn = tasksInColumn.map((t, i) => ({ ...t, order: renumbered[i] }));
    previousOrder = targetIndex > 0 ? tasksInColumn[targetIndex - 1]?.order ?? null : null;
    nextOrder = targetIndex < tasksInColumn.length ? tasksInColumn[targetIndex]?.order ?? null : null;
    order = calculateOrderBetween(previousOrder, nextOrder);
  }

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
        actorId: session.user.id,
        type: "STATUS_CHANGE",
        payload: {
          field: "column",
          from: task.columnId,
          to: targetColumnId,
        },
      },
    });
  }

  await triggerBoardEvent(
    task.boardId,
    makeEvent("task.moved", task.boardId, session.user.id, { taskId, columnId: targetColumnId, order }, taskId, targetColumnId),
    socketId,
  );

  void dispatchWebhooks(task.board.workspaceId, "task.updated", {
    taskId,
    columnId: targetColumnId,
    columnChanged,
  });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function deleteTask(taskId: string, socketId?: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { board: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await requireRole(task.board.workspaceId, "MEMBER");

  const session = await auth.api.getSession({ headers: await headers() });

  await prisma.task.delete({
    where: { id: taskId },
  });

  if (session) {
    await triggerBoardEvent(
      task.boardId,
      makeEvent("task.deleted", task.boardId, session.user.id, { taskId }, taskId),
      socketId,
    );
    void dispatchWebhooks(task.board.workspaceId, "task.deleted", { taskId });
  }

  if (session) {
    void createAuditLog({
      workspaceId: task.board.workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "TASK_DELETED",
      targetType: "task",
      targetId: taskId,
      targetLabel: `${task.code}: ${task.title}`,
    });
  }

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function updateTaskFields(input: UpdateTaskFieldsInput, socketId?: string) {
  const validated = updateTaskFieldsSchema.parse(input);
  const { taskId, title, description, priority, estimate, dueDate, expectedUpdatedAt } = validated;

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

  const updates: Record<string, unknown> = {};
  const activityPayloads: { field: string; from: unknown; to: unknown }[] = [];

  if (title !== undefined && title !== task.title) {
    updates.title = title;
    activityPayloads.push({ field: "title", from: task.title, to: title });
  }
  if (description !== undefined && description !== task.description) {
    updates.description = description;
    activityPayloads.push({ field: "description", from: task.description, to: description });
  }
  if (priority !== undefined && priority !== task.priority) {
    updates.priority = priority;
    activityPayloads.push({ field: "priority", from: task.priority, to: priority });
  }
  if (estimate !== undefined && estimate !== task.estimate) {
    updates.estimate = estimate;
    activityPayloads.push({ field: "estimate", from: task.estimate, to: estimate });
  }
  if (dueDate !== undefined && dueDate !== task.dueDate?.toISOString()) {
    updates.dueDate = dueDate ? new Date(dueDate) : null;
    activityPayloads.push({ field: "dueDate", from: task.dueDate, to: dueDate });
  }

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  const taskUpdatedAtBefore = task.updatedAt;

  // Conflict detection must run BEFORE this update's own activity rows are
  // inserted below — otherwise the "most recent activity" query always finds
  // the row this same request is about to create and falsely reports the
  // acting user as having superseded themselves.
  let conflictEvent: ConflictEvent | null = null;
  if (expectedUpdatedAt) {
    const expectedTime = new Date(expectedUpdatedAt).getTime();
    const actualTime = taskUpdatedAtBefore.getTime();

    if (Math.abs(expectedTime - actualTime) > 1000) {
      const supersedingActivity = await prisma.activityEvent.findFirst({
        where: {
          taskId,
          createdAt: {
            gt: new Date(expectedUpdatedAt),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (supersedingActivity) {
        conflictEvent = {
          type: "task.conflict",
          taskId,
          supersededActorId: supersedingActivity.actorId,
          field: activityPayloads[0]?.field ?? "unknown",
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: updates,
    }),
    ...activityPayloads.map((payload) =>
      prisma.activityEvent.create({
        data: {
          taskId,
          actorId: session.user.id,
          type: "STATUS_CHANGE",
          payload: payload as Prisma.InputJsonValue,
        },
      })
    ),
  ]);

  await triggerBoardEvent(
    task.boardId,
    makeEvent("task.updated", task.boardId, session.user.id, { taskId, ...updates }, taskId),
    socketId,
  );

  if (conflictEvent) {
    await triggerBoardEvent(
      task.boardId,
      conflictEvent as unknown as BoardEvent,
      socketId,
    );
  }

  void dispatchWebhooks(task.board.workspaceId, "task.updated", { taskId, updates });

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function setTaskAssignees(input: SetTaskAssigneesInput, socketId?: string) {
  const validated = setTaskAssigneesSchema.parse(input);
  const { taskId, userIds } = validated;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      board: true,
      assignees: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await requireRole(task.board.workspaceId, "MEMBER");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const validMembers = await prisma.workspaceMember.findMany({
    where: { workspaceId: task.board.workspaceId, userId: { in: userIds } },
    select: { userId: true },
  });
  if (validMembers.length !== userIds.length) {
    throw new Error("One or more assignees are not members of this workspace");
  }

  const currentAssigneeIds = task.assignees.map((a) => a.userId);
  const added = userIds.filter((id) => !currentAssigneeIds.includes(id));
  const removed = currentAssigneeIds.filter((id) => !userIds.includes(id));
  const notifiedUserIds = added.filter((id) => id !== session.user.id);

  await prisma.$transaction([
    prisma.taskAssignee.deleteMany({
      where: { taskId, userId: { in: removed } },
    }),
    ...added.map((userId) =>
      prisma.taskAssignee.create({
        data: { taskId, userId },
      })
    ),
    prisma.activityEvent.create({
      data: {
        taskId,
        actorId: session.user.id,
        type: "ASSIGNED",
        payload: { added, removed },
      },
    }),
    ...notifiedUserIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          type: "task_assigned",
          payload: {
            title: "You were assigned a task",
            message: `${task.title} (${task.code})`,
          },
        },
      })
    ),
  ]);

  const updatedAssignees = await prisma.taskAssignee.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true } } },
  });

  await triggerBoardEvent(
    task.boardId,
    makeEvent("task.updated", task.boardId, session.user.id, { taskId, assignees: updatedAssignees }, taskId),
    socketId,
  );

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function setTaskLabels(input: SetTaskLabelsInput, socketId?: string) {
  const validated = setTaskLabelsSchema.parse(input);
  const { taskId, labelIds } = validated;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      board: true,
      labels: true,
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await requireRole(task.board.workspaceId, "MEMBER");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const validLabels = await prisma.label.findMany({
    where: { boardId: task.boardId, id: { in: labelIds } },
    select: { id: true },
  });
  if (validLabels.length !== labelIds.length) {
    throw new Error("One or more labels do not belong to this board");
  }

  const currentLabelIds = task.labels.map((l) => l.labelId);
  const added = labelIds.filter((id) => !currentLabelIds.includes(id));
  const removed = currentLabelIds.filter((id) => !labelIds.includes(id));

  await prisma.$transaction([
    prisma.taskLabel.deleteMany({
      where: { taskId, labelId: { in: removed } },
    }),
    ...added.map((labelId) =>
      prisma.taskLabel.create({
        data: { taskId, labelId },
      })
    ),
    prisma.activityEvent.create({
      data: {
        taskId,
        actorId: session.user.id,
        type: "STATUS_CHANGE",
        payload: { field: "labels", from: currentLabelIds, to: labelIds },
      },
    }),
  ]);

  await triggerBoardEvent(
    task.boardId,
    makeEvent("task.updated", task.boardId, session.user.id, { taskId, labelIds }, taskId),
    socketId,
  );

  revalidatePath(`/[workspaceSlug]/boards/[boardId]`, "page");
  return { success: true };
}

export async function getBoardSnapshot(boardId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: {
              assignees: true,
              labels: true,
            },
          },
        },
      },
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  await requireRole(board.workspaceId, "VIEWER");

  return { columns: board.columns };
}
