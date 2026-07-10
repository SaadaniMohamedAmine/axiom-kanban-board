import { z } from "zod";

export const prioritizeInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  columnName: z.string().max(100),
  dueDate: z.string().datetime().optional(),
});

export const estimateInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  similarTasks: z
    .array(
      z.object({
        title: z.string(),
        estimate: z.number(),
      })
    )
    .max(10)
    .optional(),
});

export const describeInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  columnName: z.string().max(100),
});

export const detectBlockerInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  columnName: z.string().max(100),
  daysSinceLastActivity: z.number().min(0).max(365),
  commentCount: z.number().min(0),
});

export const assignInputSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  members: z
    .array(
      z.object({
        userId: z.string(),
        name: z.string(),
        taskCount: z.number(),
      })
    )
    .max(20),
});

export const feedbackInputSchema = z.object({
  logId: z.string().cuid(),
  feedback: z.enum(["USEFUL", "NOT_USEFUL"]),
});
