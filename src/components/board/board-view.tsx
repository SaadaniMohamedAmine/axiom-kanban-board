"use client";

import { useState, useOptimistic, startTransition } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { EmptyBoardState } from "./empty-board-state";
import { moveTask } from "@/lib/actions/task.actions";
import type { Board, Column as ColumnType } from "@/types/board.types";
import type { Task } from "@/types/task.types";
import type { PresenceMember } from "@/types/realtime.types";

interface BoardViewProps {
  board: Board;
  columns: (ColumnType & { tasks: Task[] })[];
  onTaskClick?: (task: Task) => void;
  canEdit: boolean;
  currentUser: PresenceMember;
}

export function BoardView({ columns: initialColumns, onTaskClick, canEdit, currentUser }: BoardViewProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [optimisticColumns, setOptimisticColumns] = useOptimistic(
    columns,
    (state, newColumns: (ColumnType & { tasks: Task[] })[]) => newColumns
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const hasTasks = columns.some((col) => col.tasks.length > 0);

  if (!hasTasks && columns.length === 0) {
    return <EmptyBoardState />;
  }

  function handleDragStart(event: DragStartEvent) {
    if (!canEdit) return;
    const task = columns.flatMap((col) => col.tasks).find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!canEdit || !over) return;

    const activeTask = columns.flatMap((col) => col.tasks).find((t) => t.id === active.id);
    if (!activeTask) return;

    const overColumnId = over.data.current?.columnId ?? over.id;
    const targetColumn = columns.find((col) => col.id === overColumnId || col.tasks.some((t) => t.id === over.id));

    if (!targetColumn) return;

    const sourceColumn = columns.find((col) => col.tasks.some((t) => t.id === active.id));
    if (!sourceColumn) return;

    const overTask = columns.flatMap((col) => col.tasks).find((t) => t.id === over.id);
    const targetIndex = overTask
      ? targetColumn.tasks.findIndex((t) => t.id === overTask.id)
      : targetColumn.tasks.length;

    const newColumns = columns.map((col) => {
      if (col.id === sourceColumn.id && col.id === targetColumn.id) {
        const newTasks = arrayMove(col.tasks, col.tasks.findIndex((t) => t.id === active.id), targetIndex);
        return { ...col, tasks: newTasks };
      }
      if (col.id === sourceColumn.id) {
        return { ...col, tasks: col.tasks.filter((t) => t.id !== active.id) };
      }
      if (col.id === targetColumn.id) {
        const newTasks = [...col.tasks];
        newTasks.splice(targetIndex, 0, activeTask);
        return { ...col, tasks: newTasks };
      }
      return col;
    });

    startTransition(async () => {
      setOptimisticColumns(newColumns);
      setMoveError(null);

      try {
        await moveTask({
          taskId: activeTask.id,
          targetColumnId: targetColumn.id,
          targetIndex,
        });
        setColumns(newColumns);
      } catch (error) {
        setColumns(columns);
        setMoveError(error instanceof Error ? error.message : "Failed to move task");
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {moveError && (
        <div className="mx-8 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {moveError}
        </div>
      )}
      <div className="flex-1 overflow-x-auto flex gap-6 p-8">
        {optimisticColumns.map((column) => (
          <Column key={column.id} column={column} tasks={column.tasks} onTaskClick={onTaskClick} canEdit={canEdit} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} canEdit={canEdit} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
