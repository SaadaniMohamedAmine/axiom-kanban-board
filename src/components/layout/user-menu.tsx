"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { SPLASH_EVENT } from "@/components/app-splash";

interface UserMenuProps {
  userName: string;
  userEmail: string;
}

export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const t = useTranslations("nav");
  const tActions = useTranslations("actions");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    window.dispatchEvent(new Event(SPLASH_EVENT));
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("myAccount")}
        className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[12px] shrink-0 cursor-pointer hover:bg-primary/25 transition-colors"
      >
        {userName.slice(0, 2).toUpperCase()}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-outline-variant/20 bg-surface-container-high shadow-lg overflow-hidden z-50"
        >
          <div className="px-3.5 py-3 border-b border-outline-variant/20">
            <p className="text-[13px] font-medium text-on-surface truncate">{userName}</p>
            <p className="text-[12px] text-on-surface-variant truncate">{userEmail}</p>
          </div>
          <button
            role="menuitem"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50 cursor-pointer"
          >
            <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="15">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            {tActions("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
