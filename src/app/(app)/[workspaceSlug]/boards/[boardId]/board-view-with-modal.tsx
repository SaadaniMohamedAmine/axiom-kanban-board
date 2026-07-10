"use client";

import { useState } from "react";
import { BoardView } from "@/components/board/board-view";
import { TaskDetailModal } from "@/components/task-detail/task-detail-modal";
import type { Board, Column as ColumnType } from "@/types/board.types";
import type { Task, TaskWithRelations } from "@/types/task.types";

interface BoardViewWithModalProps {
  board: Board;
  columns: (ColumnType & { tasks: TaskWithRelations[] })[];
  canEdit: boolean;
}

export function BoardViewWithModal({ board, columns, canEdit }: BoardViewWithModalProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  function handleTaskClick(task: Task) {
    const fullTask = columns
      .flatMap((col) => col.tasks)
      .find((t) => t.id === task.id);
    if (fullTask) {
      setSelectedTask(fullTask);
    }
  }

  return (
    <>
      <BoardView board={board} columns={columns} onTaskClick={handleTaskClick} canEdit={canEdit} />
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} canEdit={canEdit} />
      )}
    </>
  );
}
