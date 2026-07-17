"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { MOTION } from "@/lib/motion";
import type { TaskWithRelations } from "@/types/task.types";
import { TaskPropertiesPanel } from "./task-properties-panel";
import { ActivityList } from "./activity-list";
import { CommentThread } from "./comment-thread";
import { AxiomIntelligencePanel } from "@/components/ai/axiom-intelligence-panel";
import { MoveToMenu } from "@/components/board/move-to-menu";
import { priorityAccent } from "@/components/board/task-card";
import { archiveTask, deleteTask } from "@/lib/actions/task.actions";
import { useToast } from "@/contexts/toast-context";

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
  const [pendingAction, setPendingAction] = useState<"archive" | "delete" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("taskDetail");
  const tActions = useTranslations("actions");
  const { toast } = useToast();

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (pendingAction) setPendingAction(null);
        else onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, pendingAction]);

  async function handleConfirmAction() {
    if (!pendingAction) return;
    setIsSubmitting(true);
    try {
      if (pendingAction === "archive") {
        await archiveTask(task.id);
        toast(t("archivedToast"));
      } else {
        await deleteTask(task.id);
        toast(t("deletedToast"));
      }
      setPendingAction(null);
      onClose();
    } catch (error) {
      toast(error instanceof Error ? error.message : t("updateFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

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
              {t("taskLabel", { code: task.code })}
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
                {t("description")}
              </div>
              <div className="text-[14px] leading-relaxed text-on-surface-variant">
                {task.description ? (
                  <div className="whitespace-pre-wrap">{task.description}</div>
                ) : (
                  <p className="italic opacity-60">{t("noDescriptionYet")}</p>
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
                {t("activity")}
              </div>
              <ActivityList activities={task.activity} boardMembers={boardMembers} columns={columns} />
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 text-on-surface-variant mb-6 text-sm font-medium">
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {t("comments")}
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
              {t("created", { date: new Date(task.createdAt ?? now).toLocaleDateString() })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => setPendingAction("archive")}
                  className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 cursor-pointer"
                >
                  {t("archive")}
                </button>
                <button
                  onClick={() => setPendingAction("delete")}
                  className="text-sm font-medium text-error/80 hover:text-error transition-colors px-4 py-2 cursor-pointer"
                >
                  {tActions("delete")}
                </button>
              </>
            )}
            <button onClick={onClose} className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 cursor-pointer">
              {t("close")}
            </button>
          </div>
        </footer>
        </motion.main>

        {pendingAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center px-6">
            <div
              className="absolute inset-0 bg-surface-container-lowest/90"
              onClick={() => !isSubmitting && setPendingAction(null)}
            />
            <div className="onboarding-glass-card relative w-full max-w-md rounded-2xl p-8 shadow-2xl">
              <h2 className="text-h3 text-on-surface mb-3">
                {pendingAction === "delete" ? t("deleteModalTitle") : t("archiveModalTitle")}
              </h2>
              <p className="text-[13px] text-on-surface-variant mb-6">
                {pendingAction === "delete"
                  ? t("deleteConfirm", { title: task.title })
                  : t("archiveConfirm", { title: task.title })}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg text-[13px] font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer disabled:opacity-50"
                >
                  {tActions("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    pendingAction === "delete"
                      ? "bg-error text-on-error hover:brightness-110"
                      : "bg-primary text-on-primary hover:brightness-110"
                  }`}
                >
                  {isSubmitting ? t("working") : tActions("confirm")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
