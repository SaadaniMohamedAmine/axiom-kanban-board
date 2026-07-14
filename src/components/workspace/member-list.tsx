"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { inviteMember } from "@/lib/actions/workspace.actions";
import type { WorkspaceMember, Invitation } from "@/types/workspace.types";
import { SettingsCard } from "@/components/settings/settings-card";
import { RippleButton } from "@/components/ui/ripple-button";

interface MemberListProps {
  workspaceId: string;
  members: WorkspaceMember[];
  invitations: Invitation[];
  currentUserId: string;
  currentUserRole: string;
}

export function MemberList({ workspaceId, members, invitations, currentUserId, currentUserRole }: MemberListProps) {
  const t = useTranslations("membersPage");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const inputClass =
    "bg-surface-container-lowest border border-outline-variant/30 rounded px-4 py-2.5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none input-glow transition-all text-body-md";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await inviteMember({ workspaceId, email: email.trim(), role });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inviteFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {canInvite && (
        <SettingsCard title={t("inviteMember")}>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailAddress")}
              className={`flex-1 ${inputClass}`}
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
            <RippleButton
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="px-6 py-2 bg-primary text-on-primary rounded font-label-md text-label-md hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
            >
              {isSubmitting ? t("sending") : t("invite")}
            </RippleButton>
          </form>
          {error && <p className="text-sm text-error mt-3">{error}</p>}
        </SettingsCard>
      )}

      <div className="space-y-3">
        <h2 className="text-h3 text-on-surface">{t("members")} ({members.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-start gap-3 p-4 bg-surface-container/80 backdrop-blur-sm border border-outline-variant/20 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                {member.user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-md text-on-surface font-medium truncate">
                  {member.user.name}
                  {member.userId === currentUserId && ` ${t("you")}`}
                </p>
                <p className="text-label-md text-on-surface-variant truncate">{member.user.email}</p>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className="text-[11px] text-on-surface-variant/50 truncate">
                    {t("joined")} {new Date(member.joinedAt ?? member.invitedAt).toLocaleDateString()}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-label-md font-bold shrink-0 ${
                    member.role === "OWNER" ? "bg-primary/20 text-primary" :
                    member.role === "ADMIN" ? "bg-secondary/20 text-secondary" :
                    member.role === "MEMBER" ? "bg-tertiary/20 text-tertiary" :
                    "bg-outline/20 text-outline"
                  }`}>
                    {member.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-h3 text-on-surface">{t("pendingInvitations")} ({invitations.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between gap-2 p-4 bg-surface-container/80 backdrop-blur-sm border border-outline-variant/20 rounded-xl">
                <div className="min-w-0">
                  <p className="text-body-md text-on-surface font-medium truncate">{invitation.email}</p>
                  <p className="text-label-md text-on-surface-variant truncate">
                    {t("expires")} {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-label-md font-bold bg-yellow-500/20 text-yellow-500 shrink-0">
                  {invitation.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
