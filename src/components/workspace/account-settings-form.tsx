"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/contexts/toast-context";

interface AccountSettingsFormProps {
  name: string;
  email: string;
}

export function AccountSettingsForm({ name, email }: AccountSettingsFormProps) {
  const { toast } = useToast();

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
      if (error) throw new Error(error.message ?? "Failed to update profile");
      toast("Profile updated");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update profile", "error");
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
      if (error) throw new Error(error.message ?? "Failed to change password");
      toast("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to change password", "error");
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
        <h2 className="text-h3 text-on-surface">Profile</h2>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface-variant opacity-60"
          />
        </div>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">Name</label>
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
          {isSavingName ? "Saving..." : "Save"}
        </button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="p-6 bg-surface-container border border-outline-variant rounded-lg space-y-4"
      >
        <h2 className="text-h3 text-on-surface">Password</h2>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-label-md text-on-surface-variant mb-1">New password</label>
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
          {isSavingPassword ? "Saving..." : "Change password"}
        </button>
      </form>
    </div>
  );
}
