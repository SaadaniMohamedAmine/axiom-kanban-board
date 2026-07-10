"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/types/task.types";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  canEdit: boolean;
}

const priorityStyles = {
  URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
  HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  LOW: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export function TaskCard({ task, onClick, canEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...(canEdit ? attributes : {})}
      {...(canEdit ? listeners : {})}
      onClick={onClick}
      className="bg-surface-container border border-outline-variant p-4 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
      data-id={task.code}
    >
      <div className="flex gap-2 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <h4 className="text-sm font-semibold text-on-surface leading-snug mb-4">{task.title}</h4>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex -space-x-1">
          {/* Assignees would be rendered here */}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1.5 text-on-surface-variant text-[10px]">
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg">
              <rect height="18" rx="2" ry="2" width="18" x="3" y="4"></rect>
              <line x1="16" x2="16" y1="2" y2="6"></line>
              <line x1="8" x2="8" y1="2" y2="6"></line>
              <line x1="3" x2="21" y1="10" y2="10"></line>
            </svg>
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        )}
      </div>
    </article>
  );
}
