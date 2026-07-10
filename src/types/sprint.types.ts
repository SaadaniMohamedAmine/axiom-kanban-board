export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface Sprint {
  id: string;
  boardId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
}
