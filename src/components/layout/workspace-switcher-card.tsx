"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface Membership {
  workspace: {
    id: string;
    slug: string;
    name: string;
    _count: { members: number };
  };
}

interface WorkspaceSwitcherCardProps {
  memberships: Membership[];
}

export function WorkspaceSwitcherCard({ memberships }: WorkspaceSwitcherCardProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSlug = pathname.split("/")[1];
  const current = memberships.find((m) => m.workspace.slug === currentSlug) ?? memberships[0];

  if (!current) return null;

  const others = memberships.filter((m) => m.workspace.id !== current.workspace.id);

  return (
    <div ref={ref} className="relative p-4 border-b border-outline-variant/50">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-3 w-full text-left cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-[13px] shrink-0">
          {current.workspace.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-md text-on-surface font-semibold truncate">{current.workspace.name}</p>
          <p className="text-[12px] text-on-surface-variant truncate">
            {t("membersCount", { count: current.workspace._count.members })}
          </p>
        </div>
        <svg
          className={`text-on-surface-variant/50 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("switchWorkspace")}
          className="absolute left-4 right-4 top-full mt-1.5 rounded-xl border border-outline-variant/20 bg-surface-container-high shadow-lg overflow-hidden z-50"
        >
          {others.map((m) => (
            <Link
              key={m.workspace.id}
              href={`/${m.workspace.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                {m.workspace.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="truncate">{m.workspace.name}</span>
            </Link>
          ))}
          <Link
            href="/workspaces/new"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-primary hover:bg-surface-container-highest transition-colors ${others.length > 0 ? "border-t border-outline-variant/20" : ""}`}
          >
            <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14" className="shrink-0 ml-1">
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            {t("newWorkspace")}
          </Link>
        </div>
      )}
    </div>
  );
}
