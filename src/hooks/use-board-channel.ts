"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { PresenceMember, ConnectionState, BoardEvent } from "@/types/realtime.types";
import type PusherClient from "pusher-js";
import type { PresenceChannel } from "pusher-js";

interface UseBoardChannelOptions {
  onEvent?: (event: BoardEvent) => void;
}

interface UseBoardChannelReturn {
  socketId: string | undefined;
  connectionState: ConnectionState;
  members: PresenceMember[];
}

const DEGRADED_PUSHER_STATES = new Set(["unavailable", "disconnected", "failed"]);

export function useBoardChannel(
  boardId: string,
  options?: UseBoardChannelOptions,
): UseBoardChannelReturn {
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [connectionState, setConnectionState] = useState<ConnectionState>("live");
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const onEventRef = useRef(options?.onEvent);
  const channelRef = useRef<PresenceChannel | null>(null);

  onEventRef.current = options?.onEvent;

  useEffect(() => {
    const pusher = getPusherClient();

    setSocketId(pusher.connection.socket_id ?? undefined);

    const onStateChange = ({ current }: { current: string }) => {
      setSocketId(pusher.connection.socket_id ?? undefined);
      setConnectionState(DEGRADED_PUSHER_STATES.has(current) ? "degraded" : "live");
    };

    pusher.connection.bind("state_change", onStateChange);

    const channel = pusher.subscribe(`presence-board-${boardId}`) as PresenceChannel;
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => {
      const initialMembers: PresenceMember[] = [];
      channel.each((member: { id: string; info: PresenceMember }) => {
        initialMembers.push(member.info);
      });
      setMembers(initialMembers);
    });

    channel.bind("pusher:member_added", (member: { id: string; info: PresenceMember }) => {
      setMembers((prev) => {
        if (prev.some((m) => m.id === member.info.id)) return prev;
        return [...prev, member.info];
      });
    });

    channel.bind("pusher:member_removed", (member: { id: string; info: PresenceMember }) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.info.id));
    });

    const eventTypes = ["task.created", "task.updated", "task.moved", "task.deleted", "column.updated"] as const;
    for (const eventType of eventTypes) {
      channel.bind(eventType, (data: BoardEvent) => {
        onEventRef.current?.(data);
      });
    }

    return () => {
      pusher.connection.unbind("state_change", onStateChange);
      for (const eventType of eventTypes) {
        channel.unbind(eventType);
      }
      channel.unbind("pusher:subscription_succeeded");
      channel.unbind("pusher:member_added");
      channel.unbind("pusher:member_removed");
      pusher.unsubscribe(`presence-board-${boardId}`);
      channelRef.current = null;
      setMembers([]);
    };
  }, [boardId]);

  return { socketId, connectionState, members };
}
