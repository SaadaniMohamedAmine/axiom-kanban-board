"use client";

import { useState } from "react";
import { inviteMember } from "@/lib/actions/workspace.actions";
import type { WorkspaceMember, Invitation } from "@/types/workspace.types";

interface MemberListProps {
  workspaceId: string;
  members: WorkspaceMember[];
  invitations: Invitation[];
  currentUserId: string;
  currentUserRole: string;
}

export function MemberList({ workspaceId, members, invitations, currentUserId, currentUserRole }: MemberListProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await inviteMember({ workspaceId, email: email.trim(), role });
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-h2 text-on-surface mb-8">Team Members</h1>

      {canInvite && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-surface-container border border-outline-variant rounded-lg">
          <h2 className="text-h3 text-on-surface mb-4">Invite Member</h2>
          <div className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? "Sending..." : "Invite"}
            </button>
          </div>
          {error && <p className="text-sm text-error mt-2">{error}</p>}
        </form>
      )}

      <div className="space-y-4">
        <h2 className="text-h3 text-on-surface">Members ({members.length})</h2>
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 bg-surface-container border border-outline-variant rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {member.userId.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-body-md text-on-surface font-medium">
                  {member.userId.slice(0, 8)}
                  {member.userId === currentUserId && " (You)"}
                </p>
                <p className="text-label-md text-on-surface-variant">
                  Joined {new Date(member.joinedAt ?? member.invitedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-label-md font-bold ${
              member.role === "OWNER" ? "bg-primary/20 text-primary" :
              member.role === "ADMIN" ? "bg-secondary/20 text-secondary" :
              member.role === "MEMBER" ? "bg-tertiary/20 text-tertiary" :
              "bg-outline/20 text-outline"
            }`}>
              {member.role}
            </span>
          </div>
        ))}
      </div>

      {invitations.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-h3 text-on-surface">Pending Invitations ({invitations.length})</h2>
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center justify-between p-4 bg-surface-container border border-outline-variant rounded-lg">
              <div>
                <p className="text-body-md text-on-surface font-medium">{invitation.email}</p>
                <p className="text-label-md text-on-surface-variant">
                  Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-label-md font-bold bg-yellow-500/20 text-yellow-500">
                {invitation.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
