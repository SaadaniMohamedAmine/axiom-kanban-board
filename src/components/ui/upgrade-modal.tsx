"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MOTION } from "@/lib/motion";
import { PLAN_PRICES } from "@/lib/billing/plan-limits";

export type LimitType = "workspaces" | "boards" | "ai" | "members";

interface UpgradeModalProps {
  open: boolean;
  limitType: LimitType;
  workspaceSlug?: string;
  onClose: () => void;
}

// Index into the `upgradeModal.features` list (messages/*.json) that each
// limit type should highlight — index-based so it survives translation
// instead of matching on the (locale-dependent) copy string.
const HIGHLIGHT_INDEX: Record<LimitType, number> = {
  workspaces: 0,
  boards: 1,
  ai: 2,
  members: 5,
};

const LIMIT_ICONS: Record<LimitType, React.ReactNode> = {
  workspaces: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  boards: (
    <>
      <rect height="18" rx="1.5" width="5" x="3" y="3" />
      <rect height="10" rx="1.5" width="5" x="9.5" y="3" />
      <rect height="14" rx="1.5" width="5" x="16" y="3" />
    </>
  ),
  ai: (
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  ),
  members: (
    <>
      <path d="M16 21v-3.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V21" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-3.5a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
};

export function UpgradeModal({ open, limitType, workspaceSlug, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const t = useTranslations("billing.upgradeModal");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const features = t.raw("features") as string[];
  const highlightIndex = HIGHLIGHT_INDEX[limitType];

  function handleUpgrade() {
    setIsRedirecting(true);
    router.push(workspaceSlug ? `/${workspaceSlug}/settings/billing` : "/pricing");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-200 flex items-center justify-center px-6">
          <motion.div
            className="absolute inset-0 bg-surface-container-lowest/90"
            variants={MOTION.variants.modalOverlay}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)" }}
          />

          <motion.div
            className="onboarding-glass-card relative w-full max-w-md rounded-2xl p-8 shadow-2xl z-10"
            variants={MOTION.variants.modalContent}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
                  {LIMIT_ICONS[limitType]}
                </svg>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-on-surface leading-tight">
                  {t(`${limitType}.title`)}
                </h2>
                <p className="text-[13px] text-on-surface-variant mt-1">
                  {t(`${limitType}.description`)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-3">
                {t("planName", { price: PLAN_PRICES.PRO })}
              </p>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 text-[13px] ${
                      index === highlightIndex ? "text-primary font-semibold" : "text-on-surface-variant"
                    }`}
                  >
                    <svg
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="14"
                      className={index === highlightIndex ? "text-primary shrink-0" : "text-on-surface-variant/40 shrink-0"}
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface-variant text-[13px] font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                {t("later")}
              </button>
              <button
                onClick={handleUpgrade}
                disabled={isRedirecting}
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:brightness-110 disabled:opacity-70 transition-all cursor-pointer"
              >
                {isRedirecting ? t("redirecting") : t("upgradeCta")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
