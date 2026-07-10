"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { getBoardSnapshot } from "@/lib/actions/task.actions";
import type { PresenceMember, ConnectionState, BoardEvent, ConflictEvent } from "@/types/realtime.types";
import type { PresenceChannel } from "pusher-js";
import type { Column } from "@/types/board.types";
import type { Task } from "@/types/task.types";

const DEGRADED_PUSHER_STATES = new Set(["unavailable", "disconnected", "failed"]);
const DEGRADATION_THRESHOLD_MS = 8_000;
const POLL_INTERVAL_MS = 5_000;

interface UseBoardChannelOptions {
  onEvent?: (event: BoardEvent) => void;
  onConflict?: (event: ConflictEvent) => void;
  onColumnsUpdate?: (columns: (Column & { tasks: Task[] })[]) => void;
}

interface UseBoardChannelReturn {
  socketId: string | undefined;
  connectionState: ConnectionState;
  members: PresenceMember[];
}

export function useBoardChannel(
  boardId: string,
  options?: UseBoardChannelOptions,
): UseBoardChannelReturn {
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [connectionState, setConnectionState] = useState<ConnectionState>("live");
  const [members, setMembers] = useState<PresenceMember[]>([]);
  const optionsRef = useRef(options);
  const channelRef = useRef<PresenceChannel | null>(null);
  const degradedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  });

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    const poll = async () => {
      try {
        const snapshot = await getBoardSnapshot(boardId);
        optionsRef.current?.onColumnsUpdate?.(snapshot.columns as (Column & { tasks: Task[] })[]);
      } catch {
        // Polling failure is non-fatal — next interval will retry
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
  }, [boardId]);

  useEffect(() => {
    const pusher = getPusherClient();

    const onStateChange = ({ current }: { current: string }) => {
      setSocketId(pusher.connection.socket_id ?? undefined);
      const isDegraded = DEGRADED_PUSHER_STATES.has(current);
      setConnectionState(isDegraded ? "degraded" : "live");

      if (isDegraded) {
        if (!degradedTimerRef.current) {
          degradedTimerRef.current = setTimeout(() => {
            startPolling();
          }, DEGRADATION_THRESHOLD_MS);
        }
      } else {
        if (degradedTimerRef.current) {
          clearTimeout(degradedTimerRef.current);
          degradedTimerRef.current = null;
        }
        stopPolling();
      }
    };

    pusher.connection.bind("state_change", onStateChange);

    const channel = pusher.subscribe(`presence-board-${boardId}`) as PresenceChannel;
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => {
      const initialMembers: PresenceMember[] = [];
      channel.members.each((member: { id: string; info: PresenceMember }) => {
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
        optionsRef.current?.onEvent?.(data);
      });
    }

    channel.bind("task.conflict", (data: ConflictEvent) => {
      optionsRef.current?.onConflict?.(data);
    });

    return () => {
      pusher.connection.unbind("state_change", onStateChange);
      for (const eventType of eventTypes) {
        channel.unbind(eventType);
      }
      channel.unbind("task.conflict");
      channel.unbind("pusher:subscription_succeeded");
      channel.unbind("pusher:member_added");
      channel.unbind("pusher:member_removed");
      pusher.unsubscribe(`presence-board-${boardId}`);
      channelRef.current = null;
      setMembers([]);
      if (degradedTimerRef.current) {
        clearTimeout(degradedTimerRef.current);
        degradedTimerRef.current = null;
      }
      stopPolling();
    };
  }, [boardId, startPolling, stopPolling]);

  return { socketId, connectionState, members };
}
