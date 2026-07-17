"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface Membership {
  workspace: {
    slug: string;
    name: string;
    boards: { id: string }[];
  };
}

interface WorkspaceSidebarNavProps {
  memberships: Membership[];
}

export function WorkspaceSidebarNav({ memberships }: WorkspaceSidebarNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const currentSlug = pathname.split("/")[1];
  const current = memberships.find((m) => m.workspace.slug === currentSlug) ?? memberships[0];
  const slug = current?.workspace.slug;
  const firstBoardId = current?.workspace.boards[0]?.id;

  // ─── Section 1 — Aperçu & liste des espaces ──────────────────────────────
  const overviewLink = slug
    ? {
        href: `/${slug}`,
        label: t("overview"),
        active: pathname === `/${slug}` || pathname.startsWith(`/${slug}/boards`),
        icon: iconOverview,
      }
    : null;

  const allWorkspacesLink = {
    id: "sidebar-workspaces",
    href: "/workspaces",
    label: t("workspaces"),
    active: pathname === "/workspaces",
    icon: iconWorkspaces,
  };

  // ─── Section 2 — Espace de travail courant & contexte ───────────────────
  const contextLinks = slug
    ? [
        {
          href: `/${slug}/team`,
          label: t("team"),
          active: pathname === `/${slug}/team`,
          icon: iconTeam,
        },
        ...(firstBoardId
          ? [
              {
                href: `/${slug}/boards/${firstBoardId}/analytics`,
                label: t("analytics"),
                active: pathname.endsWith("/analytics"),
                icon: iconAnalytics,
              },
            ]
          : []),
        {
          href: `/${slug}/settings#ai-quota`,
          label: t("aiInsights"),
          active: false,
          icon: iconAI,
        },
      ]
    : [];

  // ─── Section 3 — Utilitaires ─────────────────────────────────────────────
  const utilityLinks = [
    {
      href: "/workspaces/archived",
      label: t("archive"),
      active: pathname === "/workspaces/archived",
      icon: iconArchive,
    },
    {
      href: "/workspaces/trash",
      label: t("trash"),
      active: pathname === "/workspaces/trash",
      icon: iconTrash,
    },
  ];

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-1">
      <div className="space-y-0.5">
        {overviewLink && <NavLink {...overviewLink} />}
        <NavLink {...allWorkspacesLink} />
      </div>

      <div className="my-2 h-px bg-outline-variant/20" />

      <div className="space-y-0.5">
        <WorkspaceSwitcher memberships={memberships} current={current} />

        <NavLink
          href="/my-tasks"
          label={t("myTasks")}
          active={pathname === "/my-tasks"}
          icon={iconMyTasks}
        />

        {contextLinks.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>

      <div className="my-2 h-px bg-outline-variant/20" />

      <div className="space-y-0.5">
        {utilityLinks.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}

// ─── Workspace switcher ─────────────────────────────────────────────────────

function WorkspaceSwitcher({
  memberships,
  current,
}: {
  memberships: Membership[];
  current: Membership | undefined;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!current) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
      >
        {iconWorkspaces}
        <span className="flex-1 truncate text-left">
          {t("workspaces")} <span className="text-on-surface-variant/60">({current.workspace.name})</span>
        </span>
        <svg
          fill="none"
          height="12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="12"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-full min-w-55 rounded-lg border border-outline-variant/20 bg-surface-container-high shadow-lg overflow-hidden z-50"
        >
          {memberships.map((m) => (
            <Link
              key={m.workspace.slug}
              href={`/${m.workspace.slug}`}
              role="option"
              aria-selected={m.workspace.slug === current.workspace.slug}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-surface-container-highest transition-colors ${
                m.workspace.slug === current.workspace.slug ? "text-on-surface font-medium" : "text-on-surface-variant"
              }`}
            >
              <span className="truncate">{m.workspace.name}</span>
            </Link>
          ))}
          <div className="h-px bg-outline-variant/20" />
          <Link
            href="/workspaces/new"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-primary hover:bg-surface-container-highest transition-colors"
          >
            <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("newWorkspace")}
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── NavLink ────────────────────────────────────────────────────────────────

interface NavLinkProps {
  id?: string;
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}

function NavLink({ id, href, label, active, icon }: NavLinkProps) {
  return (
    <Link
      id={id}
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-all ${
        active
          ? "bg-primary/10 text-primary"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

// ─── Icônes SVG ──────────────────────────────────────────────────────────────

const iconOverview = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <rect height="7" width="7" x="3" y="3" />
    <rect height="7" width="7" x="14" y="3" />
    <rect height="7" width="7" x="14" y="14" />
    <rect height="7" width="7" x="3" y="14" />
  </svg>
);

const iconTeam = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const iconAnalytics = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <line x1="18" x2="18" y1="20" y2="10" />
    <line x1="12" x2="12" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="14" />
  </svg>
);

const iconAI = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const iconWorkspaces = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" className="shrink-0">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

const iconArchive = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <rect height="5" rx="1" width="20" x="2" y="3" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </svg>
);

const iconTrash = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const iconMyTasks = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
