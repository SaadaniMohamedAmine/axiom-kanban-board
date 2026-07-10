import { z } from "zod";

export const createSprintSchema = z.object({
  boardId: z.string().cuid(),
  name: z.string().min(1, "Sprint name is required").max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateSprintSchema = z.object({
  sprintId: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED"]).optional(),
});

export const attachTaskToSprintSchema = z.object({
  taskId: z.string().cuid(),
  sprintId: z.string().cuid(),
});

export const detachTaskFromSprintSchema = z.object({
  taskId: z.string().cuid(),
});

export type CreateSprintInput = z.infer<typeof createSprintSchema>;
export type UpdateSprintInput = z.infer<typeof updateSprintSchema>;
export type AttachTaskToSprintInput = z.infer<typeof attachTaskToSprintSchema>;
export type DetachTaskFromSprintInput = z.infer<typeof detachTaskFromSprintSchema>;
