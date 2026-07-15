"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { PresenceMember } from "@/types/realtime.types";
import type { PresenceChannel } from "pusher-js";

export function useWorkspacePresence(workspaceId: string): PresenceMember[] {
  const [members, setMembers] = useState<PresenceMember[]>([]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`presence-workspace-${workspaceId}`) as PresenceChannel;

    channel.bind("pusher:subscription_succeeded", () => {
      const initialMembers: PresenceMember[] = [];
      channel.members.each((member: { id: string; info: PresenceMember }) => {
        initialMembers.push(member.info);
      });
      setMembers(initialMembers);
    });

    channel.bind("pusher:member_added", (member: { id: string; info: PresenceMember }) => {
      setMembers((prev) => (prev.some((m) => m.id === member.info.id) ? prev : [...prev, member.info]));
    });

    channel.bind("pusher:member_removed", (member: { id: string; info: PresenceMember }) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.info.id));
    });

    return () => {
      channel.unbind("pusher:subscription_succeeded");
      channel.unbind("pusher:member_added");
      channel.unbind("pusher:member_removed");
      pusher.unsubscribe(`presence-workspace-${workspaceId}`);
      setMembers([]);
    };
  }, [workspaceId]);

  return members;
}
