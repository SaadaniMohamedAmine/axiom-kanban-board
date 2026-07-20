"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MotionCta } from "@/components/marketing/motion-cta";
import { authClient } from "@/lib/auth-client";
import { SPLASH_EVENT } from "@/components/app-splash";

interface MobileNavProps {
  currentLocale: "fr" | "en";
  user: { name: string; email: string } | null;
  labels: {
    features: string;
    pricing: string;
    changelog: string;
    roadmap: string;
    signIn: string;
    getStarted: string;
    dashboard: string;
    signOut: string;
  };
}

const drawerVariants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { duration: MOTION.duration.moderate, ease: MOTION.ease.decelerate } },
  exit: { x: "100%", transition: { duration: MOTION.duration.normal, ease: MOTION.ease.accelerate } },
};

export function MobileNav({ currentLocale, user, labels }: MobileNavProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setOpen(false);
    window.dispatchEvent(new Event(SPLASH_EVENT));
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="w-9 h-9 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
      >
        <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* Portalled to <body> — the nav's backdrop-blur would otherwise become the
          containing block for these `fixed` elements and break their positioning. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  variants={MOTION.variants.fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 top-16 bg-black/50 z-40"
                />
                <motion.div
                  variants={drawerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="fixed top-16 right-0 bottom-0 z-50 w-72 max-w-[80vw] border-l border-outline-variant/20 bg-background px-6 py-6 flex flex-col gap-1 overflow-y-auto"
                >
                  <Link
                    href="/#features"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-md text-[14px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    {labels.features}
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-md text-[14px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    {labels.pricing}
                  </Link>
                  <Link
                    href="/changelog"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-md text-[14px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    {labels.changelog}
                  </Link>
                  <Link
                    href="/roadmap"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-md text-[14px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    {labels.roadmap}
                  </Link>

                  <div className="h-px bg-outline-variant/20 my-2" />

                  <div className="flex items-center gap-2 px-3 mb-3">
                    <ThemeToggle />
                    <LocaleSwitcher currentLocale={currentLocale} />
                  </div>

                  {!user && (
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="px-3 py-2.5 mb-4 rounded-md text-[14px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                    >
                      {labels.signIn}
                    </Link>
                  )}
                  {user ? (
                    <>
                      <div className="px-3 py-2 text-[13px] text-on-surface-variant truncate">{user.email}</div>
                      <MotionCta
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                        className="mt-2 px-4 py-2.5 bg-primary text-white rounded-md text-[14px] font-medium text-center hover:brightness-110 transition-all"
                      >
                        {labels.dashboard}
                      </MotionCta>
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="mt-2 px-4 py-2.5 border border-outline-variant rounded-md text-[14px] font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {labels.signOut}
                      </button>
                    </>
                  ) : (
                    <MotionCta
                      href="/sign-up"
                      onClick={() => setOpen(false)}
                      className="px-4 py-2.5 bg-primary text-white rounded-md text-[14px] font-medium text-center hover:brightness-110 transition-all"
                    >
                      {labels.getStarted}
                    </MotionCta>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
