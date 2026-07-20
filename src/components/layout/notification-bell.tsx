"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationIcon, notificationBadgeClass } from "@/components/layout/notification-icon";
import { timeAgo } from "@/lib/time-ago";
import { markAllNotificationsRead } from "@/lib/actions/notification.actions";

interface NotificationItem {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

interface NotificationBellProps {
  workspaceSlugs: string[];
  fallbackSlug: string | undefined;
  unreadCount: number;
  notifications: NotificationItem[];
  userId: string;
  labels: {
    title: string;
    markAllRead: string;
    nothingHereYet: string;
    seeAllActivity: string;
  };
}

export function NotificationBell({
  workspaceSlugs,
  fallbackSlug,
  unreadCount,
  notifications,
  userId,
  labels,
}: NotificationBellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSlug = pathname.split("/")[1];
  const slug = workspaceSlugs.includes(currentSlug) ? currentSlug : fallbackSlug;

  if (!slug) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
        className="relative p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
      >
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-3.5 h-3.5 px-0.75 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-xl border border-outline-variant/40 bg-surface-container/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-on-surface">{labels.title}</h3>
            {unreadCount > 0 && (
              <form action={markAllNotificationsRead.bind(null, userId)}>
                <button type="submit" className="text-[12px] text-primary hover:underline cursor-pointer">
                  {labels.markAllRead}
                </button>
              </form>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-[13px] text-on-surface-variant text-center py-12">{labels.nothingHereYet}</p>
          ) : (
            <div className="max-h-105 overflow-y-auto">
              {notifications.map((n) => {
                const payload = n.payload as { title?: string; message?: string };
                return (
                  <Link
                    key={n.id}
                    href={`/${slug}/notifications`}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 p-4 border-b border-outline-variant/10 last:border-b-0 hover:bg-surface-container-high/50 transition-colors relative ${
                      n.readAt ? "opacity-60" : ""
                    }`}
                  >
                    {!n.readAt && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />}
                    <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${notificationBadgeClass(n.type)}`}>
                      <NotificationIcon type={n.type} className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-[13px] font-medium text-on-surface leading-snug">
                          {payload.title ?? n.type}
                        </p>
                        <span className="text-[10px] text-on-surface-variant/50 whitespace-nowrap shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      {payload.message && (
                        <p className="text-[12px] text-on-surface-variant/70 line-clamp-2">{payload.message}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="p-3 bg-surface-container-lowest/50 border-t border-outline-variant/30 text-center">
            <Link
              href={`/${slug}/notifications`}
              onClick={() => setOpen(false)}
              className="text-[12px] text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {labels.seeAllActivity}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
