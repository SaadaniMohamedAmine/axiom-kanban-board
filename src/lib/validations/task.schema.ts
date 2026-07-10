import { z } from "zod";

export const createTaskSchema = z.object({
  boardId: z.string().cuid(),
  columnId: z.string().cuid(),
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().max(10000).optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  estimate: z.number().int().nonnegative().optional(),
  dueDate: z.string().datetime().optional(),
});

export const moveTaskSchema = z.object({
  taskId: z.string().cuid(),
  targetColumnId: z.string().cuid(),
  targetIndex: z.number().int().nonnegative(),
});

export const updateTaskFieldsSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).nullable().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  estimate: z.number().int().nonnegative().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
});

export const setTaskAssigneesSchema = z.object({
  taskId: z.string().cuid(),
  userIds: z.array(z.string().cuid()),
});

export const setTaskLabelsSchema = z.object({
  taskId: z.string().cuid(),
  labelIds: z.array(z.string().cuid()),
});

export const addCommentSchema = z.object({
  taskId: z.string().cuid(),
  body: z.string().min(1, "Comment body is required").max(5000),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type UpdateTaskFieldsInput = z.infer<typeof updateTaskFieldsSchema>;
export type SetTaskAssigneesInput = z.infer<typeof setTaskAssigneesSchema>;
export type SetTaskLabelsInput = z.infer<typeof setTaskLabelsSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
