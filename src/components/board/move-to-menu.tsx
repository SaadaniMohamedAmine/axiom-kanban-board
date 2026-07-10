"use client";

import { useState, useTransition } from "react";
import { moveTask } from "@/lib/actions/task.actions";

interface MoveToMenuProps {
  taskId: string;
  currentColumnId: string;
  columns: { id: string; name: string }[];
  onMoved?: () => void;
}

export function MoveToMenu({
  taskId,
  currentColumnId,
  columns,
  onMoved,
}: MoveToMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const otherColumns = columns.filter((c) => c.id !== currentColumnId);

  function handleMove(targetColumnId: string) {
    setOpen(false);
    startTransition(async () => {
      await moveTask({
        taskId,
        targetColumnId,
        order: 9999,
        sourceColumnId: currentColumnId,
      });
      onMoved?.();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 text-[12px] text-on-surface-variant border border-outline-variant rounded-lg px-3 py-1.5 hover:bg-surface-container-high transition-colors disabled:opacity-50"
      >
        <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="12">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
        Move to...
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-1 w-44 bg-surface-container-highest border border-outline-variant rounded-lg shadow-xl z-20 overflow-hidden">
            {otherColumns.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-on-surface-variant/60">
                No other columns
              </div>
            ) : (
              otherColumns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleMove(col.id)}
                  className="w-full text-left px-3 py-2.5 text-[13px] text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {col.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
