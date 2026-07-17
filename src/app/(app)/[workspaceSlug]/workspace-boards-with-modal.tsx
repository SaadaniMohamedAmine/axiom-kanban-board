"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BoardCreateModal } from "@/components/board-admin/board-create-modal";
import type { Board } from "@/types/board.types";

interface BoardWithCounts extends Board {
  _count: { columns: number; tasks: number };
}

interface WorkspaceBoardsWithModalProps {
  workspaceId: string;
  workspaceSlug: string;
  boards: BoardWithCounts[];
  canCreateBoard: boolean;
}

const AVATAR_GRADIENTS = [
  "from-primary to-violet-500",
  "from-violet-500 to-tertiary",
  "from-tertiary to-primary",
  "from-secondary to-primary",
];

export function WorkspaceBoardsWithModal({ workspaceId, workspaceSlug, boards, canCreateBoard }: WorkspaceBoardsWithModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const t = useTranslations("board");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-body-md text-on-surface-variant">
          {boards.length === 0 ? t("boardsList.noBoards") : t("boardsList.boardCount", { count: boards.length })}
        </p>
        {canCreateBoard && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 transition-all cursor-pointer"
          >
            {t("boardsList.createBoard")}
          </button>
        )}
      </div>

      {boards.length === 0 ? (
        <div className="border border-dashed border-outline-variant/40 rounded-xl p-12 text-center text-on-surface-variant">
          {t("boardsList.emptyState")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((board, index) => (
            <Link
              key={board.id}
              href={`/${workspaceSlug}/boards/${board.id}`}
              className="onboarding-glass-card group block p-6 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white shadow-lg shrink-0`}
                >
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="20">
                    <rect height="18" rx="2" width="18" x="3" y="3" /><path d="M9 3v18" /><path d="M15 3v18" />
                  </svg>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 bg-surface-container-high text-on-surface-variant">
                  {t(`templates.${board.template}`)}
                </span>
              </div>

              <h2 className="text-h3 text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                {board.name}
              </h2>

              <div className="flex items-center gap-4 mt-3 text-label-md text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="13">
                    <rect height="18" rx="2" width="18" x="3" y="3" /><path d="M3 9h18" /><path d="M9 21V9" />
                  </svg>
                  {board._count.columns} {t("boardsList.columns")}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="13">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  {board._count.tasks} {t("boardsList.tasks")}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-[12px] font-semibold text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                {t("boardsList.openBoard")}
                <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </div>
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
