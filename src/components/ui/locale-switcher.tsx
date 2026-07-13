"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateLocale } from "@/lib/actions/locale.actions";

interface Props {
  currentLocale: "fr" | "en";
}

const LOCALES = [
  { code: "en", flag: "🇬🇧", short: "EN", label: "English" },
  { code: "fr", flag: "🇫🇷", short: "FR", label: "Français" },
] as const;

export function LocaleSwitcher({ currentLocale }: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(locale: "fr" | "en") {
    setOpen(false);
    if (locale !== currentLocale) startTransition(() => updateLocale(locale));
  }

  const current = LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-outline-variant/20 bg-surface-container text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all disabled:opacity-50 cursor-pointer"
      >
        <span className="text-[13px]">{current.flag}</span>
        <span className="uppercase tracking-wide">{current.short}</span>
        {isPending ? (
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg
            fill="none"
            height="10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="10"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-36 rounded-lg border border-outline-variant/20 bg-surface-container-high shadow-lg overflow-hidden z-50"
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === currentLocale}
              onClick={() => select(l.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-surface-container-highest transition-colors cursor-pointer ${
                l.code === currentLocale ? "text-on-surface font-medium" : "text-on-surface-variant"
              }`}
            >
              <span className="text-[13px]">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
