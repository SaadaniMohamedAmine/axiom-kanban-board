"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MOTION } from "@/lib/motion";
import { TaskCard } from "./task-card";
import type { Column as ColumnType } from "@/types/board.types";
import type { Task } from "@/types/task.types";

const STATUS_DOT_COLORS = ["bg-outline", "bg-primary", "bg-tertiary", "bg-secondary"];

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  canEdit: boolean;
  conflictedTaskIds?: Set<string>;
  columnIndex?: number;
}

export function Column({ column, tasks, onTaskClick, canEdit, conflictedTaskIds, columnIndex = 0 }: ColumnProps) {
  const t = useTranslations("board");
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <section className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[columnIndex % STATUS_DOT_COLORS.length]}`} />
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            {column.name}
          </h3>
          <span className="bg-surface-container text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full font-bold">
            {tasks.length}
          </span>
        </div>
        {canEdit && (
          <button className="text-outline hover:text-on-surface transition-colors">
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        )}
      </div>
      <div ref={setNodeRef} className="flex-1 min-h-0 overflow-y-auto space-y-4 p-3 rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low/30">
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-[13px] text-on-surface-variant/40">{t("emptyColumn")}</p>
          </div>
        )}
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                variants={MOTION.variants.listItem}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                <TaskCard task={task} onClick={() => onTaskClick?.(task)} canEdit={canEdit} showConflict={conflictedTaskIds?.has(task.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>
    </section>
  );
}
