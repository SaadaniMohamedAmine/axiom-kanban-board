"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useShortcutsPanel } from "@/contexts/shortcuts-context";
import { MOTION } from "@/lib/motion";
import { useEffect } from "react";

const SHORTCUT_CATEGORIES = [
  {
    name: "General",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["⌘", "/"], description: "Open keyboard shortcuts" },
      { keys: ["?"], description: "Open keyboard shortcuts" },
      { keys: ["Esc"], description: "Close modal / panel" },
    ],
  },
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["G", "B"], description: "Go to board" },
      { keys: ["G", "S"], description: "Go to settings" },
      { keys: ["G", "A"], description: "Go to analytics" },
    ],
  },
  {
    name: "Tasks",
    shortcuts: [
      { keys: ["N"], description: "Create new task" },
      { keys: ["E"], description: "Edit focused task" },
      { keys: ["D"], description: "Delete focused task" },
    ],
  },
  {
    name: "Axiom Intelligence",
    shortcuts: [
      { keys: ["⌘", "⇧", "P"], description: "Suggest priority for selected task" },
      { keys: ["⌘", "⇧", "E"], description: "Estimate selected task" },
    ],
  },
];

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd className="inline-flex items-center px-2 py-0.5 rounded border border-outline-variant bg-surface-container-highest text-[11px] font-mono text-on-surface-variant min-w-[24px] justify-center">
      {label}
    </kbd>
  );
}

export function ShortcutsPanel() {
  const { isOpen, close } = useShortcutsPanel();

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60"
            variants={MOTION.variants.modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={close}
          />
          <motion.div
            className="relative z-10 w-full max-w-md bg-surface-container-high border border-outline-variant rounded-2xl shadow-2xl overflow-hidden"
            variants={MOTION.variants.scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
              <div>
                <h2 className="text-[15px] font-semibold text-on-surface">
                  Keyboard Shortcuts
                </h2>
                <p className="text-[12px] text-on-surface-variant/60 mt-0.5">
                  Axiom Intelligence Engine
                </p>
              </div>
              <button
                onClick={close}
                className="p-1.5 rounded-lg hover:bg-surface-container-highest text-on-surface-variant"
              >
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-5">
              {SHORTCUT_CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <div className="text-[10px] font-semibold text-on-surface-variant/50 uppercase tracking-widest mb-2 px-2">
                    {cat.name}
                  </div>
                  <div className="space-y-1">
                    {cat.shortcuts.map((s) => (
                      <div
                        key={s.description}
                        className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-surface-container-highest/50 transition-colors"
                      >
                        <span className="text-[13px] text-on-surface-variant">
                          {s.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {s.keys.map((k) => (
                            <KeyBadge key={k} label={k} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
