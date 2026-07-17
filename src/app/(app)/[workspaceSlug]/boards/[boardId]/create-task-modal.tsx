"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { createTask, setTaskLabels } from "@/lib/actions/task.actions";
import { useToast } from "@/contexts/toast-context";
import { useCreateTask } from "@/contexts/create-task-context";
import { MOTION } from "@/lib/motion";
import type { Column, Label } from "@/types/board.types";

interface CreateTaskModalProps {
  boardId: string;
  columns: Column[];
  labels: Label[];
}

type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";
const PRIORITIES: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export function CreateTaskModal({ boardId, columns, labels }: CreateTaskModalProps) {
  const { isOpen, open, close } = useCreateTask();
  const t = useTranslations("board");
  const tOnboarding = useTranslations("onboarding");
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(columns[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setPriorityOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setColumnId(columns[0]?.id ?? "");
    setPriority("MEDIUM");
    setDueDate("");
    setLabelIds([]);
  }

  function toggleLabel(labelId: string) {
    setLabelIds((prev) => (prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !columnId) return;

    setIsSubmitting(true);
    try {
      // No socketId here (unlike drag/move): nothing applies a local optimistic
      // update for creation, so the creator's own client must receive its own
      // Pusher echo via board-view's handleBoardEvent to see the new task
      // without a full page reload.
      const task = await createTask({
        boardId,
        columnId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      if (labelIds.length > 0) {
        await setTaskLabels({ taskId: task.id, labelIds });
      }

      toast(t("createTaskModal.created"));
      resetForm();
      close();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast(t("createTaskModal.failed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none input-glow transition-all text-body-md";

  const currentColumnName = columns.find((c) => c.id === columnId)?.name ?? "";

  return (
    <>
      <button
        id="create-task-btn"
        onClick={open}
        aria-label={t("createTaskModal.title")}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
      >
        <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
          <path d="M12 5v14" /><path d="M5 12h14" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div
              className="absolute inset-0 bg-surface-container-lowest/90"
              variants={MOTION.variants.modalOverlay}
              initial="hidden" animate="visible" exit="exit"
              onClick={close}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)" }}
            />
            <motion.div
              className="onboarding-glass-card relative w-full max-w-lg rounded-2xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
              variants={MOTION.variants.modalContent}
              initial="hidden" animate="visible" exit="exit"
            >
              <button
                type="button"
                onClick={close}
                aria-label={tOnboarding("close")}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>

              <h2 className="text-h3 text-on-surface mb-6">{t("createTaskModal.title")}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                    {t("createTaskModal.titleLabel")}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("createTaskModal.titlePlaceholder")}
                    className={inputClass}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                    {t("createTaskModal.descriptionLabel")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("createTaskModal.descriptionPlaceholder")}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                      {t("createTaskModal.statusLabel")}
                    </label>
                    <div ref={statusRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setStatusOpen((v) => !v)}
                        aria-haspopup="listbox"
                        aria-expanded={statusOpen}
                        className={`${inputClass} flex items-center justify-between cursor-pointer`}
                      >
                        <span className="truncate">{currentColumnName}</span>
                        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" className={`shrink-0 text-on-surface-variant/60 transition-transform ${statusOpen ? "rotate-180" : ""}`}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      {statusOpen && (
                        <div role="listbox" className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-high shadow-lg overflow-hidden z-10">
                          {columns.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              role="option"
                              aria-selected={c.id === columnId}
                              onClick={() => { setColumnId(c.id); setStatusOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-body-md transition-colors cursor-pointer hover:bg-surface-container-highest ${c.id === columnId ? "text-on-surface font-medium" : "text-on-surface-variant"}`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                      {t("createTaskModal.priorityLabel")}
                    </label>
                    <div ref={priorityRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setPriorityOpen((v) => !v)}
                        aria-haspopup="listbox"
                        aria-expanded={priorityOpen}
                        className={`${inputClass} flex items-center justify-between cursor-pointer`}
                      >
                        <span>{t(`priority.${priority}`)}</span>
                        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" className={`shrink-0 text-on-surface-variant/60 transition-transform ${priorityOpen ? "rotate-180" : ""}`}>
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      {priorityOpen && (
                        <div role="listbox" className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-high shadow-lg overflow-hidden z-10">
                          {PRIORITIES.map((p) => (
                            <button
                              key={p}
                              type="button"
                              role="option"
                              aria-selected={p === priority}
                              onClick={() => { setPriority(p); setPriorityOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-body-md transition-colors cursor-pointer hover:bg-surface-container-highest ${p === priority ? "text-on-surface font-medium" : "text-on-surface-variant"}`}
                            >
                              {t(`priority.${p}`)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                    {t("createTaskModal.dueDateLabel")}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {labels.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                      {t("createTaskModal.labelsLabel")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {labels.map((label) => {
                        const active = labelIds.includes(label.id);
                        return (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => toggleLabel(label.id)}
                            style={active ? { backgroundColor: `${label.color}26`, borderColor: label.color, color: label.color } : undefined}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer ${
                              active ? "" : "border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60"
                            }`}
                          >
                            {label.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !columnId}
                  className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  {isSubmitting ? t("createTaskModal.creating") : t("createTaskModal.create")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
