"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { useCreateTask } from "@/contexts/create-task-context";
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
  role: string;
  workspace: {
    slug: string;
    name: string;
    boards: { id: string; name: string }[];
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
  const tBoard = useTranslations("board");
  const tSettings = useTranslations("settings");
  const pathname = usePathname();
  const { open: openCommandPalette } = useCommandPalette();
  const { open: openCreateTask } = useCreateTask();

  const isOnBoardPage = /^\/[^/]+\/boards\/[^/]+$/.test(pathname);
  const workspaceSlugs = memberships.map((m) => m.workspace.slug);

  const currentSlug = pathname.split("/")[1];
  const current = memberships.find((m) => m.workspace.slug === currentSlug) ?? memberships[0];
  const slug = current?.workspace.slug;

  const breadcrumb = buildBreadcrumb(pathname, current, { t, tSettings });

  return (
    <header className="hidden md:flex h-14 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/30 items-center px-5 shrink-0 gap-4">
      {/* Logo — always goes back to the public landing page, even signed in */}
      <Link href="/" className="text-[18px] font-black text-primary tracking-tight shrink-0">
        Axiom
      </Link>

      {breadcrumb.length > 0 && <div className="h-4 w-px bg-outline-variant/40 shrink-0" />}

      {breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] min-w-0">
          {breadcrumb.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <svg
                  className="text-on-surface-variant/30 shrink-0"
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="12"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className={`truncate transition-colors ${
                    i === breadcrumb.length - 1
                      ? "text-on-surface font-medium"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${
                    i === breadcrumb.length - 1 ? "text-on-surface font-medium" : "text-on-surface-variant"
                  }`}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-2 ml-auto shrink-0">
        {isOnBoardPage && current?.role !== "VIEWER" && (
          <button
            onClick={openCreateTask}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            {tBoard("addTask")}
          </button>
        )}

        <button
          onClick={openCommandPalette}
          className="w-56 flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant/60 hover:border-outline-variant/50 hover:text-on-surface-variant transition-colors cursor-pointer text-left"
        >
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            width="14"
            className="shrink-0"
          >
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
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              width="16"
            >
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

// ─── Breadcrumb ─────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function buildBreadcrumb(
  pathname: string,
  current: Membership | undefined,
  translators: { t: (key: string) => string; tSettings: (key: string) => string }
): BreadcrumbItem[] {
  const { t, tSettings } = translators;

  if (pathname === "/workspaces") return [{ label: t("workspaces") }];

  if (pathname === "/workspaces/archived")
    return [{ label: t("workspaces"), href: "/workspaces" }, { label: t("archive") }];

  if (pathname === "/workspaces/trash")
    return [{ label: t("workspaces"), href: "/workspaces" }, { label: t("trash") }];

  if (pathname === "/workspaces/new")
    return [{ label: t("workspaces"), href: "/workspaces" }, { label: t("newWorkspace") }];

  if (pathname === "/dashboard") return [{ label: t("dashboard") }];

  if (!current) return [];

  const slug = current.workspace.slug;
  const segments = pathname.split("/").filter(Boolean);
  if (!segments[0] || segments[0] !== slug) return [];

  const wsItem: BreadcrumbItem = { label: current.workspace.name, href: `/${slug}` };

  if (pathname === `/${slug}`) return [wsItem];
  if (pathname === `/${slug}/team`) return [wsItem, { label: t("team") }];
  if (pathname === `/${slug}/notifications`) return [wsItem, { label: t("notifications") }];
  if (pathname === `/${slug}/audit-log`) return [wsItem, { label: t("auditLog") }];
  if (pathname === `/${slug}/settings/billing`)
    return [wsItem, { label: t("settings"), href: `/${slug}/settings` }, { label: tSettings("billing") }];
  if (pathname.startsWith(`/${slug}/settings`)) return [wsItem, { label: t("settings") }];

  const boardMatch = pathname.match(/^\/[^/]+\/boards\/([^/]+)(\/analytics)?$/);
  if (boardMatch) {
    const boardId = boardMatch[1];
    const isAnalytics = !!boardMatch[2];
    const board = current.workspace.boards.find((b) => b.id === boardId);
    const boardItem: BreadcrumbItem = {
      label: board?.name ?? t("board"),
      href: `/${slug}/boards/${boardId}`,
    };
    if (isAnalytics) return [wsItem, boardItem, { label: t("analytics") }];
    return [wsItem, boardItem];
  }

  return [wsItem];
}
