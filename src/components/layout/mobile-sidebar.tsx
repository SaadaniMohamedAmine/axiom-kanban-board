"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { WorkspaceSidebarNav } from "@/components/layout/workspace-sidebar-nav";
import { PlanCard } from "@/components/layout/plan-card";

// Same navy + blue tint as .onboarding-glass-card, instead of the neutral
// --surface-container token, so the app chrome doesn't read as flat grey.
const NAVY_BG = "linear-gradient(180deg, rgba(17,24,39,0.97) 0%, rgba(13,17,30,0.97) 100%)";

interface NotificationItem {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

interface Membership {
  workspace: {
    id: string;
    slug: string;
    name: string;
    plan: "FREE" | "PRO" | "TEAM";
    aiRequestsToday: number;
    boards: { id: string; name: string }[];
    _count: { members: number };
  };
}

interface MobileSidebarProps {
  memberships: Membership[];
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  locale: "fr" | "en";
  unreadCount: number;
  notifications: NotificationItem[];
  notificationLabels: {
    title: string;
    markAllRead: string;
    nothingHereYet: string;
    seeAllActivity: string;
  };
}

export function MobileSidebar({
  memberships,
  userId,
  userName,
  userEmail,
  userImage,
  locale,
  unreadCount,
  notifications,
  notificationLabels,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { open: openCommandPalette } = useCommandPalette();

  // Close the drawer on navigation instead of wiring onClick on every link —
  // WorkspaceSidebarNav is shared with desktop and has no notion of a mobile
  // drawer to close.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOpen(false); }, [pathname]);

  const workspaceSlugs = memberships.map((m) => m.workspace.slug);
  const currentSlug = pathname.split("/")[1];
  const slug = workspaceSlugs.includes(currentSlug) ? currentSlug : workspaceSlugs[0];

  return (
    <>
      <header
        className="md:hidden h-14 border-b border-primary/10 flex items-center px-3 gap-1 sticky top-0 z-30"
        style={{ background: NAVY_BG }}
      >
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant shrink-0"
          aria-label="Open menu"
        >
          <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <span className="text-[15px] font-semibold text-on-surface shrink-0 mr-1">Axiom</span>

        <div className="flex items-center gap-0.5 ml-auto">
          <button
            onClick={openCommandPalette}
            aria-label={t("searchPlaceholder")}
            className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
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
              href={`/${slug}/settings`}
              aria-label={t("settings")}
              className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
            >
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          )}
          <UserMenu userName={userName} userEmail={userEmail} userImage={userImage} />
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 border-r border-primary/10 z-50 flex flex-col transform transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: NAVY_BG }}
      >
        <div className="p-5 border-b border-outline-variant flex items-center justify-between shrink-0">
          <h1 className="text-[18px] font-semibold text-on-surface">Axiom</h1>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
          >
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <WorkspaceSidebarNav memberships={memberships} />
        <PlanCard memberships={memberships} />
      </aside>
    </>
  );
}
