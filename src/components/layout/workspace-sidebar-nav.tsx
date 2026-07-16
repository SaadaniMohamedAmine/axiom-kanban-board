"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface Membership {
  workspace: {
    slug: string;
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

  if (!slug) return null;

  const links = [
    {
      href: `/${slug}`,
      label: t("overview"),
      active: pathname === `/${slug}`,
      icon: (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <rect height="7" width="7" x="3" y="3" />
          <rect height="7" width="7" x="14" y="3" />
          <rect height="7" width="7" x="14" y="14" />
          <rect height="7" width="7" x="3" y="14" />
        </svg>
      ),
    },
    {
      id: "sidebar-workspaces",
      href: "/workspaces",
      label: t("workspaces"),
      active: pathname === "/workspaces",
      icon: (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      href: `/${slug}/settings#ai-quota`,
      label: t("aiInsights"),
      active: false,
      icon: (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        </svg>
      ),
    },
    {
      href: "/workspaces/archived",
      label: t("archive"),
      active: pathname === "/workspaces/archived",
      icon: (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <rect height="5" width="20" x="2" y="3" rx="1" />
          <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
          <path d="M10 12h4" />
        </svg>
      ),
    },
    {
      href: "/workspaces/trash",
      label: t("trash"),
      active: pathname === "/workspaces/trash",
      icon: (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" x2="10" y1="11" y2="17" />
          <line x1="14" x2="14" y1="11" y2="17" />
        </svg>
      ),
    },
  ];

  const upcoming = [
    {
      label: t("myTasks"),
      icon: (
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <path d="M21.801 10A10 10 0 1 1 17 3.335" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
      {links.map((item) => (
        <Link
          key={item.href}
          id={item.id}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-body-md transition-all ${
            item.active
              ? "bg-primary/10 text-primary"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
      {upcoming.map((item) => (
        <div
          key={item.label}
          aria-disabled="true"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-body-md text-on-surface-variant/40 cursor-not-allowed"
        >
          {item.icon}
          <span className="flex-1">{item.label}</span>
          <span className="text-[10px] uppercase tracking-wide bg-surface-container-high rounded px-1.5 py-0.5 text-on-surface-variant/50">
            {t("comingSoon")}
          </span>
        </div>
      ))}
    </nav>
  );
}
