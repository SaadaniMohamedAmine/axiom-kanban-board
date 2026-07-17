"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { restoreBoard, permanentlyDeleteBoard } from "@/lib/actions/board.actions";
import { useToast } from "@/contexts/toast-context";
import { MOTION } from "@/lib/motion";

interface TrashedBoard {
  id: string;
  name: string;
  deletedAt: string;
}

interface TrashBoardListProps {
  boards: TrashedBoard[];
  canManage: boolean;
}

export function TrashBoardList({ boards: initial, canManage }: TrashBoardListProps) {
  const t = useTranslations("board");
  const tActions = useTranslations("actions");
  const tOnboarding = useTranslations("onboarding");
  const [boards, setBoards] = useState(initial);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<TrashedBoard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!confirmTarget) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirmTarget(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmTarget]);

  async function handleRestore(id: string, name: string) {
    setRestoringId(id);
    try {
      await restoreBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
      toast(t("boardsList.restoredToast", { name }));
    } catch (error) {
      toast(error instanceof Error ? error.message : t("boardsList.restoreFailed"), "error");
    } finally {
      setRestoringId(null);
    }
  }

  async function handleDeleteForever() {
    if (!confirmTarget) return;
    setIsDeleting(true);
    try {
      await permanentlyDeleteBoard(confirmTarget.id);
      setBoards((prev) => prev.filter((b) => b.id !== confirmTarget.id));
      toast(t("trashPage.deletedForeverToast", { name: confirmTarget.name }));
      setConfirmTarget(null);
    } catch (error) {
      toast(error instanceof Error ? error.message : t("boardsList.deleteFailed"), "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
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
                  {t("trashPage.deletedOn", { date: new Date(board.deletedAt).toLocaleDateString() })}
                </p>
              </div>
            </div>

            {canManage && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(board.id, board.name)}
                  disabled={restoringId === board.id}
                  className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-[13px] font-semibold hover:bg-surface-container-highest disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {restoringId === board.id ? t("boardsList.restoring") : t("boardsList.restore")}
                </button>
                <button
                  onClick={() => setConfirmTarget(board)}
                  className="px-4 py-2 border border-error/40 text-error rounded-lg text-[13px] font-semibold hover:bg-error/10 transition-colors cursor-pointer"
                >
                  {t("boardsList.deleteForever")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {confirmTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div
              className="absolute inset-0 bg-surface-container-lowest/90"
              variants={MOTION.variants.modalOverlay}
              initial="hidden" animate="visible" exit="exit"
              onClick={() => !isDeleting && setConfirmTarget(null)}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)" }}
            />
            <motion.div
              className="onboarding-glass-card relative w-full max-w-md rounded-2xl p-8 shadow-2xl"
              variants={MOTION.variants.modalContent}
              initial="hidden" animate="visible" exit="exit"
            >
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                disabled={isDeleting}
                aria-label={tOnboarding("close")}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>

              <h2 className="text-h3 text-on-surface mb-3">{t("trashPage.deleteForeverTitle")}</h2>
              <p className="text-[13px] text-on-surface-variant mb-6">
                {t("trashPage.deleteForeverConfirm", { name: confirmTarget.name })}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg text-[13px] font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer disabled:opacity-50"
                >
                  {tActions("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteForever}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-error text-on-error rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {isDeleting ? t("boardsList.deleting") : tActions("confirm")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
