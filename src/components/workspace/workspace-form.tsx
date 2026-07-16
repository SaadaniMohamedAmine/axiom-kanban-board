"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { createWorkspace } from "@/lib/actions/workspace.actions";
import { MOTION } from "@/lib/motion";

export function WorkspaceForm() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createWorkspace({ name: name.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <motion.div
        className="absolute inset-0 bg-surface-container-lowest/90"
        variants={MOTION.variants.modalOverlay}
        initial="hidden"
        animate="visible"
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
          onClick={() => router.back()}
          aria-label={t("close")}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-h3 text-on-surface">{t("title")}</h2>
            <p className="text-[13px] text-on-surface-variant">{t("description")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                {t("nameLabel")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none input-glow transition-all text-body-md"
                autoFocus
              />
            </div>

            {error && <p className="text-[13px] text-error">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {isSubmitting ? t("creating") : t("continue")}
            </button>
          </form>
        </div>
      </motion.section>
    </div>
  );
}
