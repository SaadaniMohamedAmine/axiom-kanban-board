"use client";

import { useState } from "react";
import { BoardView } from "@/components/board/board-view";
import { TaskDetailModal } from "@/components/task-detail/task-detail-modal";
import type { Board, Column as ColumnType } from "@/types/board.types";
import type { Task, TaskWithRelations } from "@/types/task.types";
import type { PresenceMember } from "@/types/realtime.types";

interface BoardViewWithModalProps {
  board: Board;
  columns: (ColumnType & { tasks: TaskWithRelations[] })[];
  canEdit: boolean;
  currentUser: PresenceMember;
}

export function BoardViewWithModal({ board, columns, canEdit, currentUser }: BoardViewWithModalProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  function handleTaskClick(task: Task) {
    // `task` comes from BoardView's live, realtime-synced state, so it always
    // has current scalar fields (title, priority, dueDate, etc.) even for
    // tasks created or edited by other users after the initial page load.
    // Relations (assignees/labels/comments/activity) aren't part of the
    // realtime payloads, so enrich from the original SSR snapshot when
    // available and fall back to empty arrays for tasks created live, which
    // legitimately have none yet.
    const relations = columns.flatMap((col) => col.tasks).find((t) => t.id === task.id);
    setSelectedTask({
      ...task,
      assignees: relations?.assignees ?? [],
      labels: relations?.labels ?? [],
      comments: relations?.comments ?? [],
      activity: relations?.activity ?? [],
    });
  }

  return (
    <>
      <BoardView board={board} columns={columns} onTaskClick={handleTaskClick} canEdit={canEdit} currentUser={currentUser} />
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} canEdit={canEdit} />
      )}
    </>
  );
}
