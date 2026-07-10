import { pusher } from "./pusher";
import type { BoardEvent } from "@/types/realtime.types";

const CHANNEL_PREFIX = "presence-board-";

export function getChannelName(boardId: string): string {
  return `${CHANNEL_PREFIX}${boardId}`;
}

export async function triggerBoardEvent(
  boardId: string,
  event: BoardEvent,
  excludeSocketId?: string,
): Promise<void> {
  try {
    const channelName = getChannelName(boardId);
    await pusher.trigger(
      channelName,
      event.type,
      event,
      excludeSocketId ? { socket_id: excludeSocketId } : undefined,
    );
  } catch (error) {
    console.error(`[realtime] Failed to broadcast ${event.type} on board ${boardId}:`, error);
  }
}
