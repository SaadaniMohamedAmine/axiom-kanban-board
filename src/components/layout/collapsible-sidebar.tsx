"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from "@/contexts/sidebar-context";
import { MOTION } from "@/lib/motion";

// Same navy + blue tint as .onboarding-glass-card, instead of the neutral
// --surface-container token, so the app chrome doesn't read as flat grey.
const NAVY_PANEL_BG = "linear-gradient(180deg, rgba(17,24,39,0.97) 0%, rgba(13,17,30,0.97) 100%)";

export function CollapsibleSidebar({ children }: { children: React.ReactNode }) {
  const { pinned } = useSidebar();
  const [peeking, setPeeking] = useState(false);

  return (
    <>
      <motion.aside
        animate={{ width: pinned ? 260 : 0 }}
        transition={{ duration: 0.2, ease: MOTION.ease.standard }}
        className="hidden md:flex backdrop-blur-sm border-r border-primary/10 overflow-hidden shrink-0"
        style={{ background: NAVY_PANEL_BG }}
      >
        <AnimatePresence>
          {pinned && (
            <motion.div
              key="sidebar-content"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: MOTION.ease.standard }}
              className="w-[260px] flex flex-col h-full"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {!pinned && (
        <div
          className="hidden md:block relative w-0 shrink-0"
          onMouseEnter={() => setPeeking(true)}
          onMouseLeave={() => setPeeking(false)}
        >
          <div className="absolute top-0 left-0 w-3 h-full z-30" />
          <AnimatePresence>
            {peeking && (
              <motion.aside
                className="absolute top-0 left-0 h-full w-[260px] backdrop-blur-sm border-r border-primary/10 shadow-2xl flex flex-col z-30"
                style={{ background: NAVY_PANEL_BG }}
                variants={MOTION.variants.panelLeft}
                initial="hidden" animate="visible" exit="exit"
              >
                {children}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
