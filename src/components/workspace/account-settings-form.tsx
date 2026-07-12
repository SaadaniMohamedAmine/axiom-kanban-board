"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/contexts/toast-context";

interface AccountSettingsFormProps {
  name: string;
  email: string;
}

export function AccountSettingsForm({ name, email }: AccountSettingsFormProps) {
  const { toast } = useToast();
  const t = useTranslations("accountForm");
  const tActions = useTranslations("actions");

  const [displayName, setDisplayName] = useState(name);
  const [isSavingName, setIsSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSavingName(true);
    try {
      const { error } = await authClient.updateUser({ name: displayName.trim() });
      if (error) throw new Error(error.message ?? t("profileUpdateFailed"));
      toast(t("profileUpdated"));
    } catch (err) {
      toast(err instanceof Error ? err.message : t("profileUpdateFailed"), "error");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setIsSavingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message ?? t("passwordChangeFailed"));
      toast(t("passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("passwordChangeFailed"), "error");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleNameSubmit}
        className="p-6 bg-surface-container border border-outline-variant rounded-lg space-y-4"
      >
        <h2 className="text-h3 text-on-surface">{t("profile")}</h2>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">{t("email")}</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface-variant opacity-60"
          />
        </div>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">{t("name")}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={isSavingName || !displayName.trim()}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSavingName ? t("saving") : tActions("save")}
        </button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="p-6 bg-surface-container border border-outline-variant rounded-lg space-y-4"
      >
        <h2 className="text-h3 text-on-surface">{t("password")}</h2>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">{t("currentPassword")}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">{t("newPassword")}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={isSavingPassword || !currentPassword || !newPassword}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSavingPassword ? t("saving") : t("changePassword")}
        </button>
      </form>
    </div>
  );
}
