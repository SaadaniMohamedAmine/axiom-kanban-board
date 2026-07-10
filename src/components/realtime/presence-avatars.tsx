"use client";

import type { PresenceMember } from "@/types/realtime.types";

interface PresenceAvatarsProps {
  members: PresenceMember[];
  currentUserId: string;
}

const AVATAR_COLORS = [
  { bg: "bg-primary-container", text: "text-on-primary-container" },
  { bg: "bg-secondary-container", text: "text-on-secondary-container" },
  { bg: "bg-tertiary-container", text: "text-on-tertiary-container" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorForUser(userId: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function PresenceAvatars({ members, currentUserId }: PresenceAvatarsProps) {
  const otherMembers = members.filter((m) => m.id !== currentUserId);

  if (otherMembers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center -space-x-2">
      {otherMembers.map((member) => {
        const colors = getColorForUser(member.id);
        const initials = getInitials(member.name);

        if (member.image) {
          return (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full border-2 border-surface overflow-hidden"
              title={member.name}
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>
          );
        }

        return (
          <div
            key={member.id}
            className={`w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-label-md font-bold ${colors.bg} ${colors.text}`}
            title={member.name}
          >
            {initials}
          </div>
        );
      })}
    </div>
  );
}
