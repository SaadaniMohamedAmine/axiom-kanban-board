import { z } from "zod";

export const createBoardSchema = z.object({
  workspaceId: z.string().cuid(),
  name: z.string().min(1, "Board name is required").max(100),
  template: z.enum(["SCRUM", "KANBAN", "BUG_TRACKING", "CUSTOM"]),
});

export const createColumnSchema = z.object({
  boardId: z.string().cuid(),
  name: z.string().min(1, "Column name is required").max(50),
  color: z.string().max(7).optional(),
});

export const renameColumnSchema = z.object({
  columnId: z.string().cuid(),
  name: z.string().min(1, "Column name is required").max(50),
});

export const reorderColumnSchema = z.object({
  columnId: z.string().cuid(),
  order: z.number().int().nonnegative(),
});

export const recolorColumnSchema = z.object({
  columnId: z.string().cuid(),
  color: z.string().max(7).nullable(),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type RenameColumnInput = z.infer<typeof renameColumnSchema>;
export type ReorderColumnInput = z.infer<typeof reorderColumnSchema>;
export type RecolorColumnInput = z.infer<typeof recolorColumnSchema>;
