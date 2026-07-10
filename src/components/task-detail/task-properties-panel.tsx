"use client";

import { useState, useRef } from "react";
import { updateTaskFields } from "@/lib/actions/task.actions";
import { getPusherClient } from "@/lib/pusher-client";
import type { TaskWithRelations } from "@/types/task.types";

interface TaskPropertiesPanelProps {
  task: TaskWithRelations;
  canEdit: boolean;
}

export function TaskPropertiesPanel({ task, canEdit }: TaskPropertiesPanelProps) {
  const [priority, setPriority] = useState(task.priority);
  const [estimate, setEstimate] = useState(task.estimate?.toString() ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  const [description, setDescription] = useState(task.description ?? "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handlePriorityChange(newPriority: typeof task.priority) {
    if (!canEdit) return;
    setPriority(newPriority);
    try {
      await updateTaskFields({ taskId: task.id, priority: newPriority, expectedUpdatedAt: task.updatedAt.toISOString() }, getPusherClient().connection.socket_id ?? undefined);
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
        await updateTaskFields({ taskId: task.id, estimate: newValue, expectedUpdatedAt: task.updatedAt.toISOString() }, getPusherClient().connection.socket_id ?? undefined);
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
      await updateTaskFields({ taskId: task.id, dueDate: newValue, expectedUpdatedAt: task.updatedAt.toISOString() }, getPusherClient().connection.socket_id ?? undefined);
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
        await updateTaskFields({ taskId: task.id, description: description || null, expectedUpdatedAt: task.updatedAt.toISOString() }, getPusherClient().connection.socket_id ?? undefined);
      } catch {
        setDescription(task.description ?? "");
      }
    }
    setIsEditingDescription(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          Description
        </label>
        {isEditingDescription && canEdit ? (
          <div>
            <div className="flex gap-1 mb-2 p-1 bg-surface-container-lowest border border-outline-variant rounded-t-lg">
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**")}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("*", "*")}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors italic"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("- ")}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                title="List"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("[", "](url)")}
                className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
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
              className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-b-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px] resize-y"
              placeholder="Add a description..."
            />
          </div>
        ) : (
          <div
            onClick={() => canEdit && setIsEditingDescription(true)}
            className={`w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface min-h-[60px] ${canEdit ? "cursor-pointer hover:border-primary/50 transition-colors" : "cursor-default"}`}
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
        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => handlePriorityChange(e.target.value as typeof task.priority)}
          disabled={!canEdit}
          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          Estimate (points)
        </label>
        <input
          type="number"
          value={estimate}
          onChange={(e) => setEstimate(e.target.value)}
          onBlur={handleEstimateBlur}
          placeholder="0"
          disabled={!canEdit}
          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          Due Date
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => handleDueDateChange(e.target.value)}
          disabled={!canEdit}
          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          Assignees
        </label>
        <div className="text-sm text-on-surface-variant">
          {task.assignees.length === 0 ? (
            <p className="italic opacity-60">No assignees</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {task.assignees.map((a) => (
                <span key={a.id} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                  {a.userId.slice(0, 8)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          Labels
        </label>
        <div className="text-sm text-on-surface-variant">
          {task.labels.length === 0 ? (
            <p className="italic opacity-60">No labels</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {task.labels.map((l) => (
                <span key={l.id} className="px-2 py-1 bg-secondary/10 text-secondary rounded text-xs">
                  {l.labelId.slice(0, 8)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
