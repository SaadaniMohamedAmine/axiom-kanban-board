export type BoardTemplate = "SCRUM" | "KANBAN" | "BUG_TRACKING" | "CUSTOM";

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  template: BoardTemplate;
  taskCounter: number;
  createdAt: Date;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
  color: string | null;
}

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface BoardWithRelations extends Board {
  columns: Column[];
  labels: Label[];
}
