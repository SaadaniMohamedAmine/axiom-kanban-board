"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MotionCta } from "@/components/marketing/motion-cta";

interface MobileNavProps {
  currentLocale: "fr" | "en";
  labels: {
    features: string;
    pricing: string;
    changelog: string;
    roadmap: string;
    signIn: string;
    getStarted: string;
  };
}

const drawerVariants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { duration: MOTION.duration.moderate, ease: MOTION.ease.decelerate } },
  exit: { x: "100%", transition: { duration: MOTION.duration.normal, ease: MOTION.ease.accelerate } },
};

export function MobileNav({ currentLocale, labels }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

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

                  <div className="flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <LocaleSwitcher currentLocale={currentLocale} />
                    </div>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="text-[14px] text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {labels.signIn}
                    </Link>
                  </div>
                  <MotionCta
                    href="/sign-up"
                    onClick={() => setOpen(false)}
                    className="mt-2 px-4 py-2.5 bg-primary text-white rounded-md text-[14px] font-medium text-center hover:brightness-110 transition-all"
                  >
                    {labels.getStarted}
                  </MotionCta>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
