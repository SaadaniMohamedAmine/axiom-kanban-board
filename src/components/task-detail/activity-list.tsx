"use client";

import type { ActivityEvent } from "@/types/task.types";

interface ActivityListProps {
  activities: ActivityEvent[];
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-on-surface-variant italic opacity-60">No activity yet</p>;
  }

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function formatActivity(activity: ActivityEvent): string {
    const payload = activity.payload as Record<string, unknown>;
    switch (activity.type) {
      case "STATUS_CHANGE":
        return `changed ${payload.field} from ${payload.from} to ${payload.to}`;
      case "ASSIGNED": {
        const added = (payload.added as string[]) ?? [];
        const removed = (payload.removed as string[]) ?? [];
        if (added.length > 0 && removed.length > 0) {
          return `updated assignees`;
        }
        if (added.length > 0) {
          return `assigned ${added.length} member(s)`;
        }
        return `unassigned ${removed.length} member(s)`;
      }
      case "COMMENTED":
        return `added a comment`;
      default:
        return `performed an action`;
    }
  }

  function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-4 pl-1">
      {sortedActivities.map((activity) => (
        <div key={activity.id} className="flex items-center gap-3 text-xs">
          <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] text-on-surface-variant">
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
            </svg>
          </div>
          <p className="text-on-surface-variant">
            <span className="text-on-surface font-medium">{activity.actorId.slice(0, 8)}</span>{" "}
            {formatActivity(activity)}
            <span className="text-[10px] ml-1 opacity-60">{timeAgo(activity.createdAt)}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
