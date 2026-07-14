"use client";

import { useEffect } from "react";

interface SettingsSectionNavProps {
  items: { id: string; label: string }[];
}

/** Explicit scrollIntoView-based anchor nav — native fragment scrolling is
 * unreliable inside a nested `overflow-auto` container combined with a
 * `position: sticky` nav, both of which this page uses. */
export function SettingsSectionNav({ items }: SettingsSectionNavProps) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", `#${id}`);
  }

  return (
    <nav className="sticky top-0 z-10 -mx-8 px-8 py-3 mb-12 bg-background/95 backdrop-blur-sm border-b border-outline-variant/10 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => handleClick(e, item.id)}
          className="px-3 py-1.5 rounded-lg text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
