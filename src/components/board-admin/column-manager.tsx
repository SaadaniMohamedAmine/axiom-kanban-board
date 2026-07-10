"use client";

import { useState } from "react";
import { createColumn, renameColumn, deleteColumn } from "@/lib/actions/board.actions";
import type { Column } from "@/types/board.types";

interface ColumnManagerProps {
  boardId: string;
  columns: Column[];
}

export function ColumnManager({ boardId, columns }: ColumnManagerProps) {
  const [newColumnName, setNewColumnName] = useState("");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateColumn(e: React.FormEvent) {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    setIsSubmitting(true);
    try {
      await createColumn({ boardId, name: newColumnName.trim() });
      setNewColumnName("");
    } catch (error) {
      console.error("Failed to create column:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRenameColumn(columnId: string) {
    if (!editingName.trim()) return;

    try {
      await renameColumn({ columnId, name: editingName.trim() });
      setEditingColumnId(null);
    } catch (error) {
      console.error("Failed to rename column:", error);
    }
  }

  async function handleDeleteColumn(columnId: string) {
    if (!confirm("Are you sure you want to delete this column?")) return;

    try {
      await deleteColumn(columnId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete column");
    }
  }

  return (
    <div className="p-6 bg-surface-container border border-outline-variant rounded-lg">
      <h3 className="text-h3 text-on-surface mb-4">Manage Columns</h3>

      <form onSubmit={handleCreateColumn} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          placeholder="New column name"
          className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newColumnName.trim()}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {columns.map((column) => (
          <div key={column.id} className="flex items-center gap-2 p-3 bg-surface-container-lowest border border-outline-variant rounded-lg">
            {editingColumnId === column.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-3 py-1 bg-surface-container border border-outline-variant rounded text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={() => handleRenameColumn(column.id)}
                  className="px-3 py-1 bg-primary text-on-primary rounded text-label-md font-semibold hover:brightness-110 transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingColumnId(null)}
                  className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded text-label-md font-semibold hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1">
                  {column.color && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: column.color }} />
                  )}
                  <span className="text-body-md text-on-surface">{column.name}</span>
                </div>
                <button
                  onClick={() => {
                    setEditingColumnId(column.id);
                    setEditingName(column.name);
                  }}
                  className="px-3 py-1 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteColumn(column.id)}
                  className="px-3 py-1 text-error hover:text-error/80 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
