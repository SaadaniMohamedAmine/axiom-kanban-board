"use client";

import { useTranslations } from "next-intl";
import { useSidebar } from "@/contexts/sidebar-context";

export function SidebarToggleButton() {
  const { pinned, togglePinned } = useSidebar();
  const t = useTranslations("nav");

  return (
    <button
      onClick={togglePinned}
      aria-label={pinned ? t("collapseSidebar") : t("expandSidebar")}
      aria-pressed={pinned}
      className="flex p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
    >
      <svg fill="none" height="21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="21">
        <rect height="18" rx="2" width="18" x="3" y="3" />
        <path d={pinned ? "M9 3v18" : "M15 3v18"} />
      </svg>
    </button>
  );
}
