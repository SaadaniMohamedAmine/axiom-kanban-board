"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { createBoard } from "@/lib/actions/board.actions";
import { useToast } from "@/contexts/toast-context";
import { MOTION } from "@/lib/motion";

interface BoardCreateModalProps {
  workspaceId: string;
  onClose: () => void;
}

const TEMPLATE_VALUES = ["KANBAN", "SCRUM", "BUG_TRACKING", "CUSTOM"] as const;

export function BoardCreateModal({ workspaceId, onClose }: BoardCreateModalProps) {
  const router = useRouter();
  const t = useTranslations("board");
  const tOnboarding = useTranslations("onboarding");
  const tNotify = useTranslations("notificationMessages");
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<"SCRUM" | "KANBAN" | "BUG_TRACKING" | "CUSTOM">("KANBAN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) setTemplateOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const board = await createBoard({ workspaceId, name: name.trim(), template });
      notify({
        type: "board_created",
        title: tNotify("board_created.title"),
        message: tNotify("board_created.message", { name: board.name }),
      });
      router.refresh();
      onClose();
    } catch {
      setError(t("createBoardModal.failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none input-glow transition-all text-body-md";

  const currentTemplateLabel = t(`templates.${template}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <motion.div
        className="absolute inset-0 bg-surface-container-lowest/90"
        variants={MOTION.variants.modalOverlay}
        initial="hidden"
        animate="visible"
        onClick={onClose}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)" }}
      />

      <motion.section
        className="onboarding-glass-card relative w-full max-w-md rounded-2xl p-8 shadow-2xl"
        variants={MOTION.variants.modalContent}
        initial="hidden"
        animate="visible"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={tOnboarding("close")}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        <h2 className="text-h3 text-on-surface mb-6">{t("createBoardModal.title")}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
              {t("createBoardModal.nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("createBoardModal.namePlaceholder")}
              className={inputClass}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
              {t("createBoardModal.templateLabel")}
            </label>
            <div ref={templateRef} className="relative">
              <button
                type="button"
                onClick={() => setTemplateOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={templateOpen}
                className={`${inputClass} flex items-center justify-between cursor-pointer`}
              >
                <span>{currentTemplateLabel}</span>
                <svg
                  fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                  strokeWidth="2" viewBox="0 0 24 24" width="14"
                  className={`text-on-surface-variant/60 transition-transform ${templateOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {templateOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-full mt-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-high shadow-lg overflow-hidden z-10"
                >
                  {TEMPLATE_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={value === template}
                      onClick={() => { setTemplate(value); setTemplateOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-body-md transition-colors cursor-pointer hover:bg-surface-container-highest ${
                        value === template ? "text-on-surface font-medium" : "text-on-surface-variant"
                      }`}
                    >
                      {t(`templates.${value}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-[13px] text-error">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {isSubmitting ? t("createBoardModal.creating") : t("createBoardModal.create")}
          </button>
        </form>
      </motion.section>
    </div>
  );
}
