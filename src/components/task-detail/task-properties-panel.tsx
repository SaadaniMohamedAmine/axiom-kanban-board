"use client";

import { useState } from "react";
import { updateTaskFields, setTaskAssignees, setTaskLabels } from "@/lib/actions/task.actions";
import type { TaskWithRelations } from "@/types/task.types";

interface TaskPropertiesPanelProps {
  task: TaskWithRelations;
}

export function TaskPropertiesPanel({ task }: TaskPropertiesPanelProps) {
  const [priority, setPriority] = useState(task.priority);
  const [estimate, setEstimate] = useState(task.estimate?.toString() ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");

  async function handlePriorityChange(newPriority: typeof task.priority) {
    setPriority(newPriority);
    try {
      await updateTaskFields({ taskId: task.id, priority: newPriority });
    } catch (error) {
      setPriority(task.priority);
    }
  }

  async function handleEstimateBlur() {
    const num = parseInt(estimate, 10);
    const newValue = isNaN(num) ? null : num;
    if (newValue !== task.estimate) {
      try {
        await updateTaskFields({ taskId: task.id, estimate: newValue });
      } catch (error) {
        setEstimate(task.estimate?.toString() ?? "");
      }
    }
  }

  async function handleDueDateChange(newDate: string) {
    setDueDate(newDate);
    const newValue = newDate ? new Date(newDate).toISOString() : null;
    try {
      await updateTaskFields({ taskId: task.id, dueDate: newValue });
    } catch (error) {
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => handlePriorityChange(e.target.value as typeof task.priority)}
          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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
