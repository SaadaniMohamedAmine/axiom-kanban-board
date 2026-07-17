"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ActivityEvent } from "@/types/task.types";

interface ActivityListProps {
  activities: ActivityEvent[];
  boardMembers: { userId: string; name: string }[];
  columns: { id: string; name: string }[];
}

export function ActivityList({ activities, boardMembers, columns }: ActivityListProps) {
  const [now] = useState(() => Date.now());
  const t = useTranslations("taskDetail");

  const memberNameById = new Map(boardMembers.map((m) => [m.userId, m.name]));
  const columnNameById = new Map(columns.map((c) => [c.id, c.name]));

  function actorName(actorId: string): string {
    return memberNameById.get(actorId) ?? t("userFallback", { id: actorId.slice(0, 6) });
  }

  function columnName(id: unknown): string {
    if (typeof id !== "string") return t("unknownColumn");
    return columnNameById.get(id) ?? t("unknownColumn");
  }

  function formatActivity(activity: ActivityEvent): string {
    const payload = activity.payload as Record<string, unknown>;
    switch (activity.type) {
      case "STATUS_CHANGE":
        if (payload.field === "column") {
          return t("movedColumn", { from: columnName(payload.from), to: columnName(payload.to) });
        }
        if (payload.field === "labels") {
          return t("updatedLabelsShort");
        }
        return t("changedField", { field: String(payload.field), from: String(payload.from), to: String(payload.to) });
      case "ASSIGNED": {
        const added = (payload.added as string[]) ?? [];
        const removed = (payload.removed as string[]) ?? [];
        if (added.length > 0 && removed.length > 0) {
          return t("updatedAssigneesShort");
        }
        if (added.length > 0) {
          return t("assignedNames", { names: added.map((id) => actorName(id)).join(", ") });
        }
        return t("unassignedNames", { names: removed.map((id) => actorName(id)).join(", ") });
      }
      case "COMMENTED":
        return t("addedComment");
      default:
        return t("performedAction");
    }
  }

  function timeAgo(date: Date): string {
    const seconds = Math.floor((now - new Date(date).getTime()) / 1000);
    if (seconds < 60) return t("justNow");
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t("minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    return t("daysAgo", { count: days });
  }

  if (activities.length === 0) {
    return <p className="text-sm text-on-surface-variant italic opacity-60">{t("noActivityYet")}</p>;
  }

  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
            <span className="text-on-surface font-medium">{actorName(activity.actorId)}</span>{" "}
            {formatActivity(activity)}
            <span className="text-[10px] ml-1 opacity-60">{timeAgo(activity.createdAt)}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
