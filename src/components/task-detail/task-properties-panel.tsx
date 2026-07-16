"use client";

import { useEffect, useRef, useState } from "react";
import { updateTaskFields, setTaskAssignees } from "@/lib/actions/task.actions";
import type { TaskWithRelations } from "@/types/task.types";

interface TaskPropertiesPanelProps {
  task: TaskWithRelations;
  canEdit: boolean;
  boardMembers: { userId: string; name: string }[];
}

type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";
const PRIORITIES: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];
const PRIORITY_LABELS: Record<Priority, string> = { URGENT: "Urgent", HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
const PRIORITY_DOT: Record<Priority, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-400",
  MEDIUM: "bg-yellow-400",
  LOW: "bg-emerald-400",
};

function SectionLabel({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
      {icon}
      {children}
    </label>
  );
}

export function TaskPropertiesPanel({ task, canEdit, boardMembers }: TaskPropertiesPanelProps) {
  const [priority, setPriority] = useState(task.priority);
  const [estimate, setEstimate] = useState(task.estimate?.toString() ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  const [description, setDescription] = useState(task.description ?? "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeIds, setAssigneeIds] = useState(task.assignees.map((a) => a.userId));
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [isSavingAssignees, setIsSavingAssignees] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const assigneesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setPriorityOpen(false);
      if (assigneesRef.current && !assigneesRef.current.contains(e.target as Node)) setAssigneesOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleToggleAssignee(userId: string) {
    if (!canEdit) return;
    const nextIds = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId];
    const previousIds = assigneeIds;
    setAssigneeIds(nextIds);
    setIsSavingAssignees(true);
    try {
      // No socketId here: unlike drag/move, nothing else applies this change
      // to board-view's own columns state, so the assigner's own board must
      // receive its own Pusher echo to see the update without a reload.
      await setTaskAssignees({ taskId: task.id, userIds: nextIds });
    } catch {
      setAssigneeIds(previousIds);
    } finally {
      setIsSavingAssignees(false);
    }
  }

  async function handlePriorityChange(newPriority: Priority) {
    if (!canEdit) return;
    setPriority(newPriority);
    setPriorityOpen(false);
    try {
      await updateTaskFields({ taskId: task.id, priority: newPriority, expectedUpdatedAt: task.updatedAt.toISOString() });
    } catch {
      setPriority(task.priority);
    }
  }

  async function handleEstimateBlur() {
    if (!canEdit) return;
    const num = parseInt(estimate, 10);
    const newValue = isNaN(num) ? null : num;
    if (newValue !== task.estimate) {
      try {
        await updateTaskFields({ taskId: task.id, estimate: newValue, expectedUpdatedAt: task.updatedAt.toISOString() });
      } catch {
        setEstimate(task.estimate?.toString() ?? "");
      }
    }
  }

  async function handleDueDateChange(newDate: string) {
    if (!canEdit) return;
    setDueDate(newDate);
    const newValue = newDate ? new Date(newDate).toISOString() : null;
    try {
      await updateTaskFields({ taskId: task.id, dueDate: newValue, expectedUpdatedAt: task.updatedAt.toISOString() });
    } catch {
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    }
  }

  function insertMarkdown(prefix: string, suffix: string = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    const newText = description.substring(0, start) + prefix + selectedText + suffix + description.substring(end);
    setDescription(newText);
    textarea.focus();
    textarea.setSelectionRange(start + prefix.length, end + prefix.length);
  }

  async function handleDescriptionBlur() {
    if (canEdit && description !== task.description) {
      try {
        await updateTaskFields({ taskId: task.id, description: description || null, expectedUpdatedAt: task.updatedAt.toISOString() });
      } catch {
        setDescription(task.description ?? "");
      }
    }
    setIsEditingDescription(false);
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none input-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      <div>
        <SectionLabel icon={
          <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
          </svg>
        }>
          Description
        </SectionLabel>
        {isEditingDescription && canEdit ? (
          <div className="gradient-border rounded-lg overflow-hidden">
            <div className="flex gap-1 p-1 border-b border-outline-variant/20">
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors cursor-pointer"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("*", "*")}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors italic cursor-pointer"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("- ")}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors cursor-pointer"
                title="List"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("[", "](url)")}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors cursor-pointer"
                title="Link"
              >
                🔗
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              autoFocus
              className="w-full px-3 py-2 bg-transparent text-body-md text-on-surface focus:outline-none min-h-[120px] resize-y"
              placeholder="Add a description..."
            />
          </div>
        ) : (
          <div
            onClick={() => canEdit && setIsEditingDescription(true)}
            className={`gradient-border rounded-lg px-3 py-2 text-body-md text-on-surface min-h-[60px] ${canEdit ? "cursor-pointer hover:shadow-glow transition-shadow" : "cursor-default"}`}
          >
            {description ? (
              <div className="whitespace-pre-wrap">{description}</div>
            ) : (
              <p className="italic opacity-60">{canEdit ? "Click to add description..." : "No description yet"}</p>
            )}
          </div>
        )}
      </div>

      <div>
        <SectionLabel icon={<span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[priority]}`} />}>
          Priority
        </SectionLabel>
        <div ref={priorityRef} className="relative">
          <button
            type="button"
            onClick={() => canEdit && setPriorityOpen((v) => !v)}
            disabled={!canEdit}
            aria-haspopup="listbox"
            aria-expanded={priorityOpen}
            className={`${inputClass} flex items-center justify-between ${canEdit ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[priority]}`} />
              {PRIORITY_LABELS[priority]}
            </span>
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
                  onClick={() => handlePriorityChange(p)}
                  className={`w-full flex items-center gap-2 text-left px-3 py-2 text-body-md transition-colors cursor-pointer hover:bg-surface-container-highest ${p === priority ? "text-on-surface font-medium" : "text-on-surface-variant"}`}
                >
                  <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} />
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionLabel icon={
          <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
        }>
          Estimate (points)
        </SectionLabel>
        <input
          type="number"
          value={estimate}
          onChange={(e) => setEstimate(e.target.value)}
          onBlur={handleEstimateBlur}
          placeholder="0"
          disabled={!canEdit}
          className={inputClass}
        />
      </div>

      <div>
        <SectionLabel icon={
          <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
            <rect height="18" rx="2" ry="2" width="18" x="3" y="4" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        }>
          Due Date
        </SectionLabel>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => handleDueDateChange(e.target.value)}
          disabled={!canEdit}
          className={inputClass}
        />
      </div>

      <div>
        <SectionLabel icon={
          <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }>
          Assignees
        </SectionLabel>
        <div ref={assigneesRef} className="relative">
          <button
            type="button"
            onClick={() => canEdit && setAssigneesOpen((v) => !v)}
            disabled={!canEdit}
            aria-haspopup="listbox"
            aria-expanded={assigneesOpen}
            className={`w-full flex items-center justify-between gap-2 ${inputClass} ${canEdit ? "cursor-pointer" : "cursor-not-allowed"}`}
          >
            {assigneeIds.length === 0 ? (
              <span className="text-on-surface-variant/60 italic">No assignees</span>
            ) : (
              <span className="flex items-center gap-2 min-w-0">
                <span className="flex -space-x-1.5 shrink-0">
                  {assigneeIds.map((id) => {
                    const member = boardMembers.find((m) => m.userId === id);
                    return (
                      <span
                        key={id}
                        title={member?.name ?? id}
                        className="w-6 h-6 rounded-full bg-primary/25 border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-primary"
                      >
                        {(member?.name ?? id).slice(0, 2).toUpperCase()}
                      </span>
                    );
                  })}
                </span>
                <span className="truncate text-on-surface">
                  {assigneeIds.length === 1
                    ? boardMembers.find((m) => m.userId === assigneeIds[0])?.name ?? "Unknown member"
                    : `${assigneeIds.length} assigned`}
                </span>
              </span>
            )}
            <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" className={`shrink-0 text-on-surface-variant/60 transition-transform ${assigneesOpen ? "rotate-180" : ""}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {assigneesOpen && (
            <div role="listbox" className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-high shadow-lg overflow-hidden z-10 max-h-56 overflow-y-auto">
              {boardMembers.length === 0 ? (
                <p className="px-3 py-2 text-xs italic text-on-surface-variant/60">No workspace members</p>
              ) : (
                boardMembers.map((member) => {
                  const isAssigned = assigneeIds.includes(member.userId);
                  return (
                    <button
                      key={member.userId}
                      type="button"
                      role="option"
                      aria-selected={isAssigned}
                      onClick={() => handleToggleAssignee(member.userId)}
                      disabled={isSavingAssignees}
                      className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-body-md transition-colors cursor-pointer hover:bg-surface-container-highest disabled:opacity-50"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/25 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {member.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className={`flex-1 truncate ${isAssigned ? "text-on-surface font-medium" : "text-on-surface-variant"}`}>
                        {member.name}
                      </span>
                      {isAssigned && (
                        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="14" className="text-primary shrink-0">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionLabel icon={
          <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
            <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" /><circle cx="7" cy="7" r="1" fill="currentColor" />
          </svg>
        }>
          Labels
        </SectionLabel>
        {task.labels.length === 0 ? (
          <p className="text-sm italic text-on-surface-variant/60">No labels</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {task.labels.map((l) => (
              <span key={l.id} className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                {l.labelId.slice(0, 8)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
