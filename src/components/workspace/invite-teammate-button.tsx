"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { inviteMember } from "@/lib/actions/workspace.actions";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import { useToast } from "@/contexts/toast-context";
import { MOTION } from "@/lib/motion";

interface InviteTeammateButtonProps {
  workspaceId: string;
  workspaceSlug: string;
}

export function InviteTeammateButton({ workspaceId, workspaceSlug }: InviteTeammateButtonProps) {
  const router = useRouter();
  const t = useTranslations("membersPage");
  const tTeam = useTranslations("teamPage");
  const tOnboarding = useTranslations("onboarding");
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await inviteMember({ workspaceId, email: email.trim(), role });
      if (result.error === "PLAN_LIMIT_MEMBERS") {
        setIsOpen(false);
        setShowUpgrade(true);
        return;
      }
      if (result.error) {
        setError(t("inviteFailed"));
        return;
      }
      setEmail("");
      setIsOpen(false);
      toast(t("invitationSent"));
      router.refresh();
    } catch {
      setError(t("inviteFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none input-glow transition-all text-body-md";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary hover:brightness-110 text-on-primary px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
      >
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="16" x2="22" y1="11" y2="11" />
        </svg>
        {tTeam("inviteTeammate")}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div
              className="absolute inset-0 bg-surface-container-lowest/90"
              variants={MOTION.variants.modalOverlay}
              initial="hidden" animate="visible" exit="exit"
              onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
                aria-label={tOnboarding("close")}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>

              <h2 className="text-h3 text-on-surface mb-6">{t("inviteMember")}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailAddress")}
                  className={inputClass}
                  autoFocus
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  className={inputClass}
                >
                  <option value="ADMIN">{t("admin")}</option>
                  <option value="MEMBER">{t("member")}</option>
                  <option value="VIEWER">{t("viewer")}</option>
                </select>

                {error && <p className="text-[13px] text-error">{error}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full py-2.5 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  {isSubmitting ? t("sending") : t("invite")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <UpgradeModal
        open={showUpgrade}
        limitType="members"
        workspaceSlug={workspaceSlug}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}
