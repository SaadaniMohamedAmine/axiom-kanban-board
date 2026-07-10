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
  boardMembers: { userId: string; name: string; taskCount: number }[];
}

export function BoardViewWithModal({ board, columns, canEdit, currentUser, boardMembers }: BoardViewWithModalProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  function handleTaskClick(task: Task) {
    const relations = columns.flatMap((col) => col.tasks).find((t) => t.id === task.id);
    setSelectedTask({
      ...task,
      assignees: relations?.assignees ?? [],
      labels: relations?.labels ?? [],
      comments: relations?.comments ?? [],
      activity: relations?.activity ?? [],
    });
  }

  const selectedColumn = selectedTask
    ? columns.find((col) => col.tasks.some((t) => t.id === selectedTask.id))
    : null;

  return (
    <>
      <BoardView board={board} columns={columns} onTaskClick={handleTaskClick} canEdit={canEdit} currentUser={currentUser} />
      {selectedTask && selectedColumn && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          canEdit={canEdit}
          columnName={selectedColumn.name}
          boardMembers={boardMembers}
          columns={columns.map((col) => ({ id: col.id, name: col.name }))}
        />
      )}
    </>
  );
}
