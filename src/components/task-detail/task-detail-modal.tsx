"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MOTION } from "@/lib/motion";
import type { TaskWithRelations } from "@/types/task.types";
import { TaskPropertiesPanel } from "./task-properties-panel";
import { ActivityList } from "./activity-list";
import { CommentThread } from "./comment-thread";
import { AxiomIntelligencePanel } from "@/components/ai/axiom-intelligence-panel";
import { MoveToMenu } from "@/components/board/move-to-menu";
import { priorityAccent } from "@/components/board/task-card";

interface TaskDetailModalProps {
  task: TaskWithRelations;
  onClose: () => void;
  canEdit: boolean;
  columnName: string;
  boardMembers: { userId: string; name: string; taskCount: number }[];
  columns: { id: string; name: string }[];
}

export function TaskDetailModal({ task, onClose, canEdit, columnName, boardMembers, columns }: TaskDetailModalProps) {
  const [now] = useState(() => Date.now());

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-surface-container-lowest/90"
          variants={MOTION.variants.modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        />
        <motion.main
          variants={MOTION.variants.modalContent}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="onboarding-glass-card relative z-10 w-full md:max-w-5xl rounded-none md:rounded-2xl overflow-hidden flex flex-col h-[100dvh] md:h-[85vh] md:max-h-[800px] shadow-2xl"
        >
        <div className={`h-1 shrink-0 bg-gradient-to-r ${priorityAccent[task.priority]}`} />

        {/* Header */}
        <header className="p-8 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant uppercase tracking-wider text-[11px] font-semibold">
              <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                <rect height="18" rx="2" width="18" x="3" y="3"></rect>
                <path d="M7 7h10"></path>
                <path d="M7 12h10"></path>
                <path d="M7 17h10"></path>
              </svg>
              Task {task.code}
            </div>
            <h1 className="text-2xl font-semibold text-on-surface">{task.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer">
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </header>

        {canEdit && (
          <div className="md:hidden px-8 pb-4">
            <MoveToMenu
              taskId={task.id}
              currentColumnId={task.columnId}
              columns={columns}
              onMoved={onClose}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column (Details) */}
          <section className="flex-1 overflow-y-auto p-6 md:p-8 pt-0 border-b md:border-b-0 border-r-0 md:border-r border-outline-variant/20">
            {/* Description */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-on-surface-variant mb-4 text-sm font-medium">
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                Description
              </div>
              <div className="text-[14px] leading-relaxed text-on-surface-variant">
                {task.description ? (
                  <div className="whitespace-pre-wrap">{task.description}</div>
                ) : (
                  <p className="italic opacity-60">No description yet</p>
                )}
              </div>
            </div>

            {/* Activity */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-on-surface-variant mb-6 text-sm font-medium">
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"></path>
                  <path d="M12 8v4l3 3"></path>
                </svg>
                Activity
              </div>
              <ActivityList activities={task.activity} boardMembers={boardMembers} columns={columns} />
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 text-on-surface-variant mb-6 text-sm font-medium">
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Comments
              </div>
              <CommentThread taskId={task.id} comments={task.comments} />
            </div>
          </section>

          {/* Right Column (Properties) */}
          <aside className="w-full md:w-[340px] bg-gradient-to-b from-primary/5 to-violet-500/5 p-5 md:p-6 overflow-y-auto">
            <TaskPropertiesPanel task={task} canEdit={canEdit} boardMembers={boardMembers} />
            <AxiomIntelligencePanel task={task} columnName={columnName} boardMembers={boardMembers} />
          </aside>
        </div>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-6 text-[11px] text-on-surface-variant/60">
            <div className="flex items-center gap-1.5">
              <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Created {new Date(task.createdAt ?? now).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 cursor-pointer">
              Close
            </button>
          </div>
        </footer>
        </motion.main>
      </div>
    </AnimatePresence>
  );
}
