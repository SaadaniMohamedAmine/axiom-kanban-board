"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { unarchiveBoard } from "@/lib/actions/board.actions";
import { useToast } from "@/contexts/toast-context";

interface ArchivedBoard {
  id: string;
  name: string;
  archivedAt: string;
}

interface ArchivedBoardListProps {
  boards: ArchivedBoard[];
  canManage: boolean;
}

export function ArchivedBoardList({ boards: initial, canManage }: ArchivedBoardListProps) {
  const t = useTranslations("board");
  const [boards, setBoards] = useState(initial);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleRestore(id: string, name: string) {
    setRestoringId(id);
    try {
      await unarchiveBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
      toast(t("boardsList.restoredToast", { name }));
    } catch (error) {
      toast(error instanceof Error ? error.message : t("boardsList.restoreFailed"), "error");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="space-y-3">
      {boards.map((board) => (
        <div key={board.id} className="onboarding-glass-card flex items-center justify-between rounded-xl p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-[13px] shrink-0">
              {board.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-body-md text-on-surface font-medium truncate">{board.name}</p>
              <p className="text-[12px] text-on-surface-variant/60">
                {t("archivedPage.archivedOn", { date: new Date(board.archivedAt).toLocaleDateString() })}
              </p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => handleRestore(board.id, board.name)}
              disabled={restoringId === board.id}
              className="shrink-0 px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {restoringId === board.id ? t("boardsList.restoring") : t("boardsList.restore")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
