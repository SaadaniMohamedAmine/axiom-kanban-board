"use client";

import { useTransition } from "react";
import { updateLocale } from "@/lib/actions/locale.actions";

interface Props {
  currentLocale: "fr" | "en";
}

export function LocaleSwitcher({ currentLocale }: Props) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = currentLocale === "fr" ? "en" : "fr";
    startTransition(() => updateLocale(next));
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-outline-variant/20 bg-surface-container text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all disabled:opacity-50"
      title={currentLocale === "fr" ? "Switch to English" : "Passer en français"}
    >
      <span className="text-[13px]">{currentLocale === "fr" ? "🇫🇷" : "🇬🇧"}</span>
      <span className="uppercase tracking-wide">{currentLocale}</span>
      {isPending && (
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </button>
  );
}
