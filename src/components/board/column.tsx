"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import type { Column as ColumnType, Task } from "@/types/board.types";

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export function Column({ column, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <section className="w-80 flex flex-col gap-4 shrink-0">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            {column.name}
          </h3>
          <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-bold">
            {tasks.length}
          </span>
        </div>
        <button className="text-outline hover:text-on-surface transition-colors">
          <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="19" cy="12" r="1"></circle>
            <circle cx="5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>
      <div ref={setNodeRef} className="space-y-4 min-h-[200px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
