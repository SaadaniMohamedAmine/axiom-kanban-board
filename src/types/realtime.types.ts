export type ConnectionState = "live" | "degraded";

export interface PresenceMember {
  id: string;
  name: string;
  image: string | null;
}

export type BoardEventType =
  | "task.created"
  | "task.updated"
  | "task.moved"
  | "task.deleted"
  | "column.updated";

export interface BoardEvent {
  type: BoardEventType;
  boardId: string;
  taskId: string | null;
  columnId: string | null;
  actorId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface ConflictEvent {
  type: "task.conflict";
  taskId: string;
  supersededActorId: string;
  field: string;
  timestamp: string;
}

export type RealtimeEvent = BoardEvent | ConflictEvent;
