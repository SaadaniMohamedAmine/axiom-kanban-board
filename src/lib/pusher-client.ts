"use client";

import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us3",
      channelAuthorization: {
        endpoint: "/api/pusher/auth",
        transport: "ajax",
      },
      // Defaults (120s activity / 30s pong) leave a dead connection looking
      // "live" for minutes on a silent network drop (no clean close event) —
      // shortened so FR-008's "discreet indicator, immediately" is actually met.
      activityTimeout: 5000,
      pongTimeout: 3000,
    });
  }
  return pusherClient;
};

export const disconnectPusher = () => {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
};
