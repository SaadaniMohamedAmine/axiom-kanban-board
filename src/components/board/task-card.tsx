"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { ConflictBadge } from "@/components/realtime/conflict-badge";
import type { Task } from "@/types/task.types";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  canEdit: boolean;
  showConflict?: boolean;
}

export const priorityStyles = {
  URGENT: "bg-red-500/10 text-red-500 border-red-500/20",
  HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  LOW: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export const priorityAccent = {
  URGENT: "from-red-500 to-red-400",
  HIGH: "from-red-500 to-orange-400",
  MEDIUM: "from-yellow-500 to-amber-400",
  LOW: "from-emerald-500 to-emerald-400",
};

export function TaskCard({ task, onClick, canEdit, showConflict }: TaskCardProps) {
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
    <motion.article
      ref={setNodeRef}
      style={style}
      {...(canEdit ? attributes : {})}
      {...(canEdit ? listeners : {})}
      onClick={onClick}
      whileHover={{ y: -2, transition: { duration: MOTION.duration.fast } }}
      whileTap={{ scale: 0.98, transition: { duration: MOTION.duration.instant } }}
      className="gradient-border relative p-4 md:p-4 hover:shadow-glow transition-shadow cursor-pointer group min-h-[80px] md:min-h-0 overflow-hidden"
      data-id={task.code}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${priorityAccent[task.priority]}`} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityStyles[task.priority]}`}>
            {task.priority}
          </span>
          <ConflictBadge visible={!!showConflict} />
        </div>
        <span className="text-[10px] font-mono text-on-surface-variant/40">{task.code}</span>
      </div>
      <h4 className="text-sm font-semibold text-on-surface leading-snug mb-4 group-hover:text-primary transition-colors">{task.title}</h4>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex -space-x-1.5">
          {(task.assignees ?? []).map((a) => (
            <span
              key={a.id}
              title={a.user?.name ?? "Unknown member"}
              className="w-5 h-5 rounded-full bg-primary/25 border-2 border-surface-container flex items-center justify-center text-[9px] font-bold text-primary shrink-0"
            >
              {(a.user?.name ?? "?").slice(0, 2).toUpperCase()}
            </span>
          ))}
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
    </motion.article>
  );
}
