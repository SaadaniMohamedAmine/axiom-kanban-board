"use client";

import { useTranslations } from "next-intl";
import { useWorkspacePresence } from "@/hooks/use-workspace-presence";
import type { WorkspaceMember } from "@/types/workspace.types";

interface TeamMemberTableProps {
  workspaceId: string;
  members: WorkspaceMember[];
  currentUserId: string;
}

const ROLE_STYLE: Record<string, string> = {
  OWNER: "bg-primary/10 text-primary border-primary/20",
  ADMIN: "bg-secondary/10 text-secondary border-secondary/20",
  MEMBER: "bg-tertiary/10 text-tertiary border-tertiary/20",
  VIEWER: "bg-outline/10 text-outline border-outline/20",
};

export function TeamMemberTable({ workspaceId, members, currentUserId }: TeamMemberTableProps) {
  const t = useTranslations("teamPage");
  const tMembers = useTranslations("membersPage");
  const presentMembers = useWorkspacePresence(workspaceId);
  const onlineIds = new Set(presentMembers.map((m) => m.id));

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-container-high/50">
        <h3 className="text-h3 text-on-surface">{t("activeMembers")}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-6 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("colMember")}</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("colEmail")}</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("colRole")}</th>
              <th className="px-6 py-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {members.map((member) => {
              const isOnline = onlineIds.has(member.userId);
              return (
                <tr key={member.id} className="hover:bg-surface-container-highest/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center font-bold text-[13px] text-primary shrink-0">
                        {member.user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] text-on-surface font-semibold truncate">
                          {member.user.name}
                          {member.userId === currentUserId && ` ${tMembers("you")}`}
                        </p>
                        <p className="text-[12px] text-on-surface-variant">
                          {tMembers("joined")} {new Date(member.joinedAt ?? member.invitedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant font-mono text-[13px]">{member.user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${ROLE_STYLE[member.role] ?? ROLE_STYLE.MEMBER}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500/80" : "bg-outline/40"}`} />
                      <span className="text-[13px] text-on-surface-variant">{isOnline ? t("online") : t("offline")}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
