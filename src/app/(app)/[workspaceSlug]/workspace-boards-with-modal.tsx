"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { BoardCreateModal } from "@/components/board-admin/board-create-modal";
import { archiveBoard, trashBoard } from "@/lib/actions/board.actions";
import { useToast } from "@/contexts/toast-context";
import { MOTION } from "@/lib/motion";
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

type PendingAction = { type: "archive" | "delete"; board: BoardWithCounts } | null;

export function WorkspaceBoardsWithModal({ workspaceId, workspaceSlug, boards: initialBoards, canCreateBoard }: WorkspaceBoardsWithModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [boards, setBoards] = useState(initialBoards);
  const [pending, setPending] = useState<PendingAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("board");
  const tNav = useTranslations("nav");
  const tActions = useTranslations("actions");
  const tOnboarding = useTranslations("onboarding");
  const { toast } = useToast();

  useEffect(() => {
    if (!pending) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPending(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pending]);

  async function handleConfirm() {
    if (!pending) return;
    setIsSubmitting(true);
    try {
      if (pending.type === "archive") {
        await archiveBoard(pending.board.id);
        toast(t("boardsList.archivedToast"));
      } else {
        await trashBoard(pending.board.id);
        toast(t("boardsList.deletedToast"));
      }
      setBoards((prev) => prev.filter((b) => b.id !== pending.board.id));
      setPending(null);
    } catch (error) {
      toast(error instanceof Error ? error.message : t("boardsList.actionFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-body-md text-on-surface-variant">
          {boards.length === 0 ? t("boardsList.noBoards") : t("boardsList.boardCount", { count: boards.length })}
        </p>
        <div className="flex items-center gap-4">
          {canCreateBoard && (
            <>
              <Link
                href={`/${workspaceSlug}/boards/archived`}
                className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {tNav("archive")}
              </Link>
              <Link
                href={`/${workspaceSlug}/boards/trash`}
                className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {tNav("trash")}
              </Link>
            </>
          )}
          {canCreateBoard && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 transition-all cursor-pointer"
            >
              {t("boardsList.createBoard")}
            </button>
          )}
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="border border-dashed border-outline-variant/40 rounded-xl p-12 text-center text-on-surface-variant">
          {t("boardsList.emptyState")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((board, index) => (
            <div key={board.id} className="onboarding-glass-card group relative rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              {canCreateBoard && (
                <div className="absolute -top-3 -right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                  <button
                    onClick={() => setPending({ type: "archive", board })}
                    aria-label={t("boardsList.archiveAction")}
                    title={t("boardsList.archiveAction")}
                    className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/40 shadow-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                  >
                    <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="14">
                      <rect height="5" rx="1" width="20" x="2" y="4" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M10 13h4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPending({ type: "delete", board })}
                    aria-label={t("boardsList.moveToTrashAction")}
                    title={t("boardsList.moveToTrashAction")}
                    className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/40 shadow-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                  >
                    <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="14">
                      <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              )}

              <Link href={`/${workspaceSlug}/boards/${board.id}`} className="block p-6 overflow-hidden">
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
            </div>
          ))}
        </div>
      )}

      {isCreating && (
        <BoardCreateModal workspaceId={workspaceId} onClose={() => setIsCreating(false)} />
      )}

      <AnimatePresence>
        {pending && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div
              className="absolute inset-0 bg-surface-container-lowest/90"
              variants={MOTION.variants.modalOverlay}
              initial="hidden" animate="visible" exit="exit"
              onClick={() => !isSubmitting && setPending(null)}
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
                onClick={() => setPending(null)}
                disabled={isSubmitting}
                aria-label={tOnboarding("close")}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>

              <h2 className="text-h3 text-on-surface mb-3">
                {pending.type === "delete" ? t("boardsList.deleteModalTitle") : t("boardsList.archiveModalTitle")}
              </h2>
              <p className="text-[13px] text-on-surface-variant mb-6">
                {pending.type === "delete"
                  ? t("boardsList.deleteConfirm", { name: pending.board.name })
                  : t("boardsList.archiveConfirm", { name: pending.board.name })}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-surface-container-high text-on-surface-variant rounded-lg text-[13px] font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer disabled:opacity-50"
                >
                  {tActions("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    pending.type === "delete"
                      ? "bg-error text-on-error hover:brightness-110"
                      : "bg-primary text-on-primary hover:brightness-110"
                  }`}
                >
                  {isSubmitting ? t("boardsList.working") : tActions("confirm")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
