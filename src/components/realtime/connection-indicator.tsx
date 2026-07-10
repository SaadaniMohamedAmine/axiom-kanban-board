"use client";

import type { ConnectionState } from "@/types/realtime.types";

interface ConnectionIndicatorProps {
  state: ConnectionState;
}

export function ConnectionIndicator({ state }: ConnectionIndicatorProps) {
  if (state === "live") {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-error-container/20 border border-error-container/40">
      <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
      <span className="text-label-md text-error">Connection lost</span>
    </div>
  );
}
