"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/contexts/toast-context";
import { SettingsCard } from "@/components/settings/settings-card";
import { RippleButton } from "@/components/ui/ripple-button";
import { notifyNameChanged, notifyPasswordChanged } from "@/lib/actions/notification.actions";

interface AccountSettingsFormProps {
  name: string;
  email: string;
  hasPassword: boolean;
  passwordAgeDays: number | null;
}

const STALE_PASSWORD_THRESHOLD_DAYS = 90;

export function AccountSettingsForm({ name, email, hasPassword, passwordAgeDays }: AccountSettingsFormProps) {
  const { toast } = useToast();
  const t = useTranslations("accountForm");
  const tActions = useTranslations("actions");

  const [displayName, setDisplayName] = useState(name);
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const passwordsMismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSavingName(true);
    try {
      const { error } = await authClient.updateUser({ name: displayName.trim() });
      if (error) throw new Error(error.message ?? t("profileUpdateFailed"));
      void notifyNameChanged(displayName.trim());
      toast(t("profileUpdated"));
    } catch (err) {
      toast(err instanceof Error ? err.message : t("profileUpdateFailed"), "error");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || passwordsMismatch) return;

    setIsSavingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message ?? t("passwordChangeFailed"));
      void notifyPasswordChanged();
      toast(t("passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("passwordChangeFailed"), "error");
    } finally {
      setIsSavingPassword(false);
    }
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-4 py-2.5 text-on-surface focus:outline-none input-glow transition-all text-body-md";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <SettingsCard title={t("profile")} badge={{ label: t("generalBadge"), tone: "primary" }}>
        <form onSubmit={handleNameSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">{t("name")}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">{t("email")}</label>
              <input type="email" value={email} disabled className={`${inputClass} opacity-60`} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <RippleButton
              type="submit"
              disabled={isSavingName || !displayName.trim()}
              className="px-6 py-2 bg-primary text-on-primary rounded font-label-md text-label-md hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {isSavingName ? t("saving") : t("saveChanges")}
            </RippleButton>
          </div>
        </form>
      </SettingsCard>

      {hasPassword && (
        <SettingsCard title={t("password")} badge={{ label: t("protectedBadge"), tone: "tertiary" }}>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1">{t("currentPassword")}</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  aria-label={showCurrentPassword ? tActions("hidePassword") : tActions("showPassword")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  {showCurrentPassword ? (
                    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" x2="23" y1="1" y2="23" />
                    </svg>
                  ) : (
                    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant ml-1">{t("newPassword")}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("newPasswordPlaceholder")}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant ml-1">{t("confirmPassword")}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className={inputClass}
                />
                {passwordsMismatch && (
                  <p className="text-[12px] text-error ml-1">{t("passwordMismatch")}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
              <p className="font-label-md text-label-md text-on-surface-variant max-w-xs">{t("passwordHint")}</p>
              <RippleButton
                type="submit"
                disabled={isSavingPassword || !currentPassword || !newPassword || passwordsMismatch}
                className="px-6 py-2 border border-outline-variant/50 hover:border-outline text-on-surface font-label-md text-label-md rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
              >
                {isSavingPassword ? t("saving") : t("changePassword")}
              </RippleButton>
            </div>
          </form>
        </SettingsCard>
      )}
      </div>

      {hasPassword && passwordAgeDays !== null && passwordAgeDays >= STALE_PASSWORD_THRESHOLD_DAYS && (
        <div className="relative p-6 rounded-xl bg-surface-container-high/40 border border-outline-variant/20 overflow-hidden">
          <div className="w-1 h-full absolute left-0 top-0 bg-outline-variant/60" />
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60" />
            <span className="font-label-md text-label-md text-on-surface-variant tracking-wide uppercase text-[11px]">
              {t("securityTipTitle")}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("securityTipStale", { days: passwordAgeDays })}
          </p>
        </div>
      )}
    </div>
  );
}
