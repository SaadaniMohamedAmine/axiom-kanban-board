"use client";

import { useState } from "react";
import { createSprint, updateSprint, deleteSprint, attachTaskToSprint, detachTaskFromSprint } from "@/lib/actions/sprint.actions";
import type { Sprint } from "@/types/sprint.types";
import type { Task } from "@/types/task.types";

interface SprintPanelProps {
  boardId: string;
  sprints: Sprint[];
  tasks: Task[];
}

export function SprintPanel({ boardId, sprints, tasks }: SprintPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateSprint(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      await createSprint({ boardId, name: name.trim(), startDate, endDate });
      setName("");
      setStartDate("");
      setEndDate("");
      setIsCreating(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create sprint");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(sprintId: string, newStatus: Sprint["status"]) {
    try {
      await updateSprint({ sprintId, status: newStatus });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update sprint");
    }
  }

  async function handleDeleteSprint(sprintId: string) {
    if (!confirm("Are you sure you want to delete this sprint?")) return;

    try {
      await deleteSprint(sprintId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete sprint");
    }
  }

  async function handleAttachTask(taskId: string, sprintId: string) {
    try {
      await attachTaskToSprint({ taskId, sprintId });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to attach task");
    }
  }

  async function handleDetachTask(taskId: string) {
    try {
      await detachTaskFromSprint({ taskId });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to detach task");
    }
  }

  const unassignedTasks = tasks.filter((t) => !t.sprintId);

  return (
    <div className="p-6 bg-surface-container border border-outline-variant rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-on-surface">Sprints</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1 bg-primary text-on-primary rounded text-label-md font-semibold hover:brightness-110 transition-all"
        >
          {isCreating ? "Cancel" : "+ New Sprint"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateSprint} className="mb-4 p-4 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sprint name"
            className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface-container border border-outline-variant rounded text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface-container border border-outline-variant rounded text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !startDate || !endDate}
            className="w-full py-2 bg-primary text-on-primary rounded text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Creating..." : "Create Sprint"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {sprints.map((sprint) => (
          <div key={sprint.id} className="p-4 bg-surface-container-lowest border border-outline-variant rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-body-md text-on-surface font-medium">{sprint.name}</h4>
              <span className={`px-2 py-1 rounded text-label-md font-bold ${
                sprint.status === "PLANNED" ? "bg-outline/20 text-outline" :
                sprint.status === "ACTIVE" ? "bg-primary/20 text-primary" :
                "bg-tertiary/20 text-tertiary"
              }`}>
                {sprint.status}
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant mb-3">
              {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
            </p>
            <div className="flex gap-2 mb-3">
              {sprint.status === "PLANNED" && (
                <button
                  onClick={() => handleStatusChange(sprint.id, "ACTIVE")}
                  className="px-3 py-1 bg-primary/10 text-primary rounded text-label-md hover:bg-primary/20 transition-colors"
                >
                  Start Sprint
                </button>
              )}
              {sprint.status === "ACTIVE" && (
                <button
                  onClick={() => handleStatusChange(sprint.id, "COMPLETED")}
                  className="px-3 py-1 bg-tertiary/10 text-tertiary rounded text-label-md hover:bg-tertiary/20 transition-colors"
                >
                  Complete Sprint
                </button>
              )}
              <button
                onClick={() => handleDeleteSprint(sprint.id)}
                className="px-3 py-1 text-error hover:text-error/80 transition-colors"
              >
                Delete
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-label-md text-on-surface-variant">Tasks in sprint:</p>
              {tasks.filter((t) => t.sprintId === sprint.id).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-surface-container rounded">
                  <span className="text-body-md text-on-surface">{task.title}</span>
                  <button
                    onClick={() => handleDetachTask(task.id)}
                    className="text-on-surface-variant hover:text-error transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {tasks.filter((t) => t.sprintId === sprint.id).length === 0 && (
                <p className="text-label-md text-on-surface-variant italic">No tasks assigned</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {unassignedTasks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-body-md text-on-surface font-medium mb-2">Unassigned Tasks</h4>
          <div className="space-y-1">
            {unassignedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-surface-container-lowest border border-outline-variant rounded">
                <span className="text-body-md text-on-surface">{task.title}</span>
                <select
                  onChange={(e) => e.target.value && handleAttachTask(task.id, e.target.value)}
                  className="px-2 py-1 bg-surface-container border border-outline-variant rounded text-label-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  defaultValue=""
                >
                  <option value="" disabled>Assign to sprint...</option>
                  {sprints.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
