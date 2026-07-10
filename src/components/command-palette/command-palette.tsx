"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MOTION } from "@/lib/motion";

interface SearchResult {
  tasks: { id: string; code: string; title: string; column: string; href: string }[];
  boards: { id: string; name: string; href: string }[];
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ tasks: [], boards: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allResults = [
    ...results.boards.map((b) => ({ type: "board" as const, label: b.name, sub: "Board", href: b.href })),
    ...results.tasks.map((t) => ({ type: "task" as const, label: t.title, sub: `${t.code} · ${t.column}`, href: t.href })),
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults({ tasks: [], boards: [] });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ tasks: [], boards: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as SearchResult;
        setResults(data);
        setSelectedIndex(0);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(href: string) {
    router.push(href);
    close();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { close(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && allResults[selectedIndex]) {
      handleSelect(allResults[selectedIndex].href);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            className="absolute inset-0 bg-black/60"
            variants={MOTION.variants.modalOverlay}
            initial="hidden" animate="visible" exit="exit"
            onClick={close}
          />
          <motion.div
            className="relative z-10 w-full max-w-xl bg-surface-container-high border border-outline-variant rounded-2xl shadow-2xl overflow-hidden"
            variants={MOTION.variants.scaleIn}
            initial="hidden" animate="visible" exit="exit"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/30">
              <svg className="text-on-surface-variant/50 shrink-0" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tasks, boards..."
                className="flex-1 bg-transparent text-[14px] text-on-surface placeholder:text-on-surface-variant/40 outline-none"
              />
              {loading && (
                <div className="w-3.5 h-3.5 border-[1.5px] border-primary/30 border-t-primary rounded-full animate-spin" />
              )}
              <kbd className="text-[10px] text-on-surface-variant/40 border border-outline-variant rounded px-1.5 py-0.5">
                Esc
              </kbd>
            </div>

            {allResults.length > 0 ? (
              <div className="p-2 max-h-80 overflow-y-auto">
                {results.boards.length > 0 && (
                  <div className="mb-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-on-surface-variant/40 uppercase tracking-widest">
                      Boards
                    </div>
                    {results.boards.map((b, i) => {
                      const idx = i;
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleSelect(b.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            selectedIndex === idx ? "bg-primary/10 text-primary" : "hover:bg-surface-container-highest text-on-surface"
                          }`}
                        >
                          <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14" className="shrink-0">
                            <rect height="18" rx="2" width="18" x="3" y="3" />
                          </svg>
                          <span className="text-[13px] font-medium">{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {results.tasks.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-on-surface-variant/40 uppercase tracking-widest">
                      Tasks
                    </div>
                    {results.tasks.map((t, i) => {
                      const idx = results.boards.length + i;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleSelect(t.href)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            selectedIndex === idx ? "bg-primary/10" : "hover:bg-surface-container-highest"
                          }`}
                        >
                          <span className="text-[11px] font-mono text-on-surface-variant/60 shrink-0 w-14">
                            {t.code}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-on-surface truncate">{t.title}</div>
                            <div className="text-[11px] text-on-surface-variant/50">{t.column}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : query.length >= 2 && !loading ? (
              <div className="px-4 py-8 text-center text-[13px] text-on-surface-variant/50">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : query.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-on-surface-variant/40">
                Type to search tasks and boards
              </div>
            ) : null}

            <div className="px-4 py-2.5 border-t border-outline-variant/20 flex items-center gap-4 text-[11px] text-on-surface-variant/40">
              <span className="flex items-center gap-1"><kbd className="border border-outline-variant rounded px-1">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="border border-outline-variant rounded px-1">↵</kbd> open</span>
              <span className="flex items-center gap-1"><kbd className="border border-outline-variant rounded px-1">Esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
