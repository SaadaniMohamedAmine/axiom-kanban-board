"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NotificationBellProps {
  workspaceSlugs: string[];
  fallbackSlug: string | undefined;
  unreadCount: number;
}

export function NotificationBell({ workspaceSlugs, fallbackSlug, unreadCount }: NotificationBellProps) {
  const pathname = usePathname();
  const currentSlug = pathname.split("/")[1];
  const slug = workspaceSlugs.includes(currentSlug) ? currentSlug : fallbackSlug;

  if (!slug) return null;

  return (
    <Link
      href={`/${slug}/notifications`}
      className="relative p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
      aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
    >
      <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-[3px] rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
