"use client";

import { useState } from "react";
import { createBoard } from "@/lib/actions/board.actions";

interface BoardCreateModalProps {
  workspaceId: string;
  onClose: () => void;
}

export function BoardCreateModal({ workspaceId, onClose }: BoardCreateModalProps) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<"SCRUM" | "KANBAN" | "BUG_TRACKING" | "CUSTOM">("KANBAN");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createBoard({ workspaceId, name: name.trim(), template });
      onClose();
    } catch (error) {
      console.error("Failed to create board:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface-container-high border border-outline-variant rounded-xl p-8 shadow-2xl">
        <h2 className="text-h2 text-on-surface mb-6">Create Board</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label-md text-on-surface-variant mb-2 block">Board Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sprint Planning"
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="text-label-md text-on-surface-variant mb-2 block">Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as typeof template)}
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="KANBAN">Kanban</option>
              <option value="SCRUM">Scrum</option>
              <option value="BUG_TRACKING">Bug Tracking</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-surface-container-high text-on-surface-variant rounded-lg text-label-md font-semibold hover:bg-surface-container-highest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
