export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type ActivityType =
  | "STATUS_CHANGE"
  | "ASSIGNED"
  | "COMMENTED"
  | "AI_SUGGESTION_APPLIED";

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  code: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  estimate: number | null;
  dueDate: Date | null;
  order: number;
  sprintId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
}

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: Date;
}

export interface ActivityEvent {
  id: string;
  taskId: string;
  actorId: string;
  type: ActivityType;
  payload: unknown;
  createdAt: Date;
}

export interface TaskWithRelations extends Task {
  assignees: TaskAssignee[];
  labels: TaskLabel[];
  comments: Comment[];
  activity: ActivityEvent[];
}
