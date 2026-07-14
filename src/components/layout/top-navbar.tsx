"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { NotificationBell } from "@/components/layout/notification-bell";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

interface NotificationItem {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

interface Membership {
  workspace: {
    slug: string;
    boards: { id: string }[];
  };
}

interface TopNavbarProps {
  memberships: Membership[];
  unreadCount: number;
  notifications: NotificationItem[];
  userId: string;
  userName: string;
  userEmail: string;
  locale: "fr" | "en";
  notificationLabels: {
    title: string;
    markAllRead: string;
    nothingHereYet: string;
    seeAllActivity: string;
  };
}

export function TopNavbar({
  memberships,
  unreadCount,
  notifications,
  userId,
  userName,
  userEmail,
  locale,
  notificationLabels,
}: TopNavbarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { open: openCommandPalette } = useCommandPalette();

  const workspaceSlugs = memberships.map((m) => m.workspace.slug);
  const currentSlug = pathname.split("/")[1];
  const current = memberships.find((m) => m.workspace.slug === currentSlug) ?? memberships[0];
  const slug = current?.workspace.slug;
  const firstBoardId = current?.workspace.boards[0]?.id;

  const navItems = slug
    ? [
        { href: "/workspaces", label: t("dashboard"), active: pathname === "/workspaces" },
        { href: `/${slug}`, label: t("projects"), active: pathname === `/${slug}` || pathname.startsWith(`/${slug}/boards`) },
        { href: `/${slug}/settings#members`, label: t("team"), active: false },
        ...(firstBoardId
          ? [{ href: `/${slug}/boards/${firstBoardId}/analytics`, label: t("analytics"), active: pathname.endsWith("/analytics") }]
          : []),
      ]
    : [{ href: "/workspaces", label: t("dashboard"), active: pathname === "/workspaces" }];

  return (
    <header className="hidden md:flex h-16 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/50 items-center px-6 gap-6 shrink-0">
      <Link href="/workspaces" className="text-[19px] font-black text-primary tracking-tight shrink-0">
        Axiom
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              item.active
                ? "text-primary bg-primary/10"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <button
          onClick={openCommandPalette}
          className="w-64 flex items-center gap-2 px-3.5 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant/60 hover:border-outline-variant/50 hover:text-on-surface-variant transition-colors cursor-pointer text-left"
        >
          <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="15" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-[13px] flex-1 truncate">{t("searchPlaceholder")}</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant/50 shrink-0">
            ⌘K
          </kbd>
        </button>
        <LocaleSwitcher currentLocale={locale} />
        <ThemeToggle />
        <NotificationBell
          workspaceSlugs={workspaceSlugs}
          fallbackSlug={memberships[0]?.workspace.slug}
          unreadCount={unreadCount}
          notifications={notifications}
          userId={userId}
          labels={notificationLabels}
        />
        {slug && (
          <Link
            id="invite-team-link"
            href={`/${slug}/settings`}
            aria-label={t("settings")}
            className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        )}
        <UserMenu userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}
