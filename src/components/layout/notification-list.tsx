"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { markNotificationRead } from "@/lib/actions/notification.actions";
import { NotificationIcon, notificationBadgeClass } from "@/components/layout/notification-icon";

interface NotificationItem {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

interface NotificationListProps {
  notifications: NotificationItem[];
  locale: "fr" | "en";
  nothingHereYet: string;
}

const KNOWN_TYPES = [
  "blocker_detected",
  "task_assigned",
  "comment_added",
  "sprint_started",
  "ai_suggestion",
  "access_requested",
  "welcome_back",
  "welcome",
  "workspace_created",
  "board_created",
  "task_created",
  "workspace_archived",
  "board_archived",
  "task_archived",
  "workspace_deleted",
  "board_deleted",
  "task_deleted",
  "name_changed",
  "password_changed",
  "plan_changed",
] as const;

export function NotificationList({ notifications, locale, nothingHereYet }: NotificationListProps) {
  const t = useTranslations("notificationPrefs");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const availableTypes = useMemo(
    () => KNOWN_TYPES.filter((type) => notifications.some((n) => n.type === type)),
    [notifications]
  );

  const filtered = activeFilter ? notifications.filter((n) => n.type === activeFilter) : notifications;

  if (notifications.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
          <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20" className="text-on-surface-variant/40">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <p className="text-[14px] text-on-surface-variant">{nothingHereYet}</p>
      </div>
    );
  }

  return (
    <div>
      {availableTypes.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
              activeFilter === null
                ? "bg-primary/10 text-primary"
                : "bg-surface-container text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t("allTypes")}
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                activeFilter === type
                  ? notificationBadgeClass(type)
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <NotificationIcon type={type} className="w-3 h-3" />
              {t(type)}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {filtered.map((n) => {
          const payload = n.payload as { title?: string; message?: string };
          return (
            <form key={n.id} action={markNotificationRead.bind(null, n.id)}>
              <button
                type="submit"
                className={`w-full text-left flex items-start gap-3 p-4 rounded-xl transition-colors ${
                  n.readAt ? "opacity-50 hover:opacity-70" : "bg-primary/5 hover:bg-primary/8"
                }`}
              >
                <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${notificationBadgeClass(n.type)}`}>
                  <NotificationIcon type={n.type} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-medium text-on-surface">{payload.title ?? n.type}</p>
                  {payload.message && (
                    <p className="text-[12px] text-on-surface-variant/70 mt-0.5 truncate">{payload.message}</p>
                  )}
                  <p className="text-[11px] text-on-surface-variant/40 mt-1">
                    {new Date(n.createdAt).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.readAt && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
