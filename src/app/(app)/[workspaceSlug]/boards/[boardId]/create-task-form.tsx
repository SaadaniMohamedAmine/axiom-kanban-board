"use client";

import { useState } from "react";
import { createTask } from "@/lib/actions/task.actions";
import { getPusherClient } from "@/lib/pusher-client";
import { useToast } from "@/contexts/toast-context";
import type { Column } from "@/types/board.types";

interface CreateTaskFormProps {
  boardId: string;
  columns: Column[];
}

export function CreateTaskForm({ boardId, columns }: CreateTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [columnId, setColumnId] = useState(columns[0]?.id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !columnId) return;

    setIsSubmitting(true);
    try {
      await createTask({
        boardId,
        columnId,
        title: title.trim(),
      }, getPusherClient().connection.socket_id ?? undefined);
      toast("Task created");
      setTitle("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create task:", error);
      toast("Failed to create task", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <div className="p-4 border-t border-outline-variant">
        <button
          id="create-task-btn"
          onClick={() => setIsOpen(true)}
          className="w-full py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-label-md font-semibold transition-colors"
        >
          + New Task
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-outline-variant bg-surface-container">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
        <div className="flex gap-2">
          <select
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
            className="flex-1 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-label-md font-semibold hover:bg-surface-container-highest transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
