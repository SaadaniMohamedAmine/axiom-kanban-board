"use client";

import { useState } from "react";
import Link from "next/link";
import { BoardCreateModal } from "@/components/board-admin/board-create-modal";
import type { Board } from "@/types/board.types";

interface WorkspaceBoardsWithModalProps {
  workspaceId: string;
  workspaceSlug: string;
  boards: Board[];
}

export function WorkspaceBoardsWithModal({ workspaceId, workspaceSlug, boards }: WorkspaceBoardsWithModalProps) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-body-md text-on-surface-variant">
          {boards.length === 0 ? "No boards yet" : `${boards.length} board${boards.length > 1 ? "s" : ""}`}
        </p>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 transition-all"
        >
          Create Board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="border border-dashed border-outline-variant/40 rounded-xl p-12 text-center text-on-surface-variant">
          Create your first board to start organizing work.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/${workspaceSlug}/boards/${board.id}`}
              className="block p-6 bg-surface-container border border-outline-variant rounded-xl hover:border-primary/50 transition-colors"
            >
              <h2 className="text-h3 text-on-surface font-semibold">{board.name}</h2>
              <p className="text-label-md text-on-surface-variant mt-1">{board.template}</p>
            </Link>
          ))}
        </div>
      )}

      {isCreating && (
        <BoardCreateModal workspaceId={workspaceId} onClose={() => setIsCreating(false)} />
      )}
    </div>
  );
}
