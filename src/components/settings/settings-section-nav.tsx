"use client";

import { useEffect, useState } from "react";

interface SettingsSectionNavProps {
  items: { id: string; label: string }[];
}

/** Explicit scrollIntoView-based anchor nav — native fragment scrolling is
 * unreliable inside a nested `overflow-auto` container combined with a
 * `position: sticky` nav, both of which this page uses. */
export function SettingsSectionNav({ items }: SettingsSectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveId(hash);
    const el = document.getElementById(hash);
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  // Scroll-spy: highlight whichever section is currently under the sticky nav.
  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", `#${id}`);
    setActiveId(id);
  }

  return (
    <nav className="sticky top-0 z-10 -mx-8 px-8 py-3 mb-12 bg-background/95 backdrop-blur-sm border-b border-outline-variant/10">
      <div className="flex flex-wrap gap-1.5 p-3 rounded-md border border-outline-variant/20 bg-surface-container">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
