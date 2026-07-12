"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface SettingsLinkProps {
  workspaceSlugs: string[];
  fallbackSlug: string | undefined;
}

export function SettingsLink({ workspaceSlugs, fallbackSlug }: SettingsLinkProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const currentSlug = pathname.split("/")[1];
  const slug = workspaceSlugs.includes(currentSlug) ? currentSlug : fallbackSlug;

  if (!slug) return null;

  return (
    <Link
      id="invite-team-link"
      href={`/${slug}/settings`}
      className="flex items-center gap-2 px-3 py-2 text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
    >
      <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
      {t("settings")}
    </Link>
  );
}
