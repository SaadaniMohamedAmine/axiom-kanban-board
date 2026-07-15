"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MOTION } from "@/lib/motion";

interface SearchResult {
  tasks: { id: string; code: string; title: string; column: string; href: string }[];
  boards: { id: string; name: string; href: string }[];
  people: { id: string; name: string; email: string; role: string; href: string }[];
}

interface Membership {
  workspace: { slug: string };
}

interface CommandPaletteProps {
  memberships: Membership[];
}

const EMPTY_RESULTS: SearchResult = { tasks: [], boards: [], people: [] };

export function CommandPalette({ memberships }: CommandPaletteProps) {
  const { isOpen, close } = useCommandPalette();
  const t = useTranslations("commandPalette");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const currentSlug = pathname.split("/")[1];
  const slug = memberships.find((m) => m.workspace.slug === currentSlug)?.workspace.slug ?? memberships[0]?.workspace.slug;

  const actions = [
    ...(slug ? [{ id: "settings", label: t("openSettings"), href: `/${slug}/settings` }] : []),
    { id: "new-workspace", label: tNav("newWorkspace"), href: "/workspaces/new" },
  ];

  const isSearching = query.length >= 2;
  const searchResults = [
    ...results.boards.map((b) => ({ type: "board" as const, label: b.name, sub: t("boards"), href: b.href })),
    ...results.tasks.map((tk) => ({ type: "task" as const, label: tk.title, sub: `${tk.code} · ${tk.column}`, href: tk.href })),
    ...results.people.map((p) => ({ type: "person" as const, label: p.name, sub: p.email, href: p.href })),
  ];
  const allResults = isSearching ? searchResults : actions.map((a) => ({ type: "action" as const, label: a.label, sub: "", href: a.href }));

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults(EMPTY_RESULTS);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isSearching) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(EMPTY_RESULTS);
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
  }, [query, isSearching]);

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

  const iconBoxClass = "w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0 transition-colors";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            className="absolute inset-0 bg-surface-container-lowest/60 backdrop-blur-sm"
            variants={MOTION.variants.modalOverlay}
            initial="hidden" animate="visible" exit="exit"
            onClick={close}
          />
          <motion.div
            className="relative z-10 w-full max-w-xl bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden"
            variants={MOTION.variants.scaleIn}
            initial="hidden" animate="visible" exit="exit"
          >
            <div className="flex items-center gap-3 px-5 h-16 border-b border-outline-variant/20">
              <div className="w-6 h-6 rounded bg-[#adc6ff]/20 flex items-center justify-center shrink-0">
                <span className="text-[#adc6ff] font-bold text-[12px]">A</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("searchPlaceholder")}
                className="flex-1 bg-transparent text-body-lg text-body-lg text-on-surface placeholder:text-on-surface-variant/50 outline-none"
              />
              {loading && (
                <div className="w-3.5 h-3.5 border-[1.5px] border-[#adc6ff]/30 border-t-[#adc6ff] rounded-full animate-spin shrink-0" />
              )}
              <kbd className="text-[11px] font-mono text-on-surface-variant border border-outline-variant/60 bg-on-surface/5 rounded-md px-2 py-1 shrink-0">
                Esc
              </kbd>
            </div>

            <div className="max-h-[440px] overflow-y-auto py-2">
              {isSearching ? (
                allResults.length > 0 ? (
                  <div className="px-2 space-y-0.5">
                    {results.boards.length > 0 && (
                      <ResultSection label={t("boards")}>
                        {results.boards.map((b, i) => (
                          <ResultRow
                            key={b.id}
                            selected={selectedIndex === i}
                            onClick={() => handleSelect(b.href)}
                            iconBoxClass={iconBoxClass}
                            icon={
                              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                                <rect height="18" rx="2" width="18" x="3" y="3" />
                              </svg>
                            }
                            label={b.name}
                            sub={t("boards")}
                          />
                        ))}
                      </ResultSection>
                    )}
                    {results.tasks.length > 0 && (
                      <ResultSection label={t("tasks")}>
                        {results.tasks.map((tk, i) => {
                          const idx = results.boards.length + i;
                          return (
                            <ResultRow
                              key={tk.id}
                              selected={selectedIndex === idx}
                              onClick={() => handleSelect(tk.href)}
                              iconBoxClass={iconBoxClass}
                              icon={<span className="text-[10px] font-mono text-on-surface-variant/70">{tk.code}</span>}
                              label={tk.title}
                              sub={tk.column}
                            />
                          );
                        })}
                      </ResultSection>
                    )}
                    {results.people.length > 0 && (
                      <ResultSection label={t("people")}>
                        {results.people.map((p, i) => {
                          const idx = results.boards.length + results.tasks.length + i;
                          return (
                            <ResultRow
                              key={p.id}
                              selected={selectedIndex === idx}
                              onClick={() => handleSelect(p.href)}
                              iconBoxClass="w-9 h-9 rounded-full bg-[#adc6ff]/15 flex items-center justify-center shrink-0"
                              icon={<span className="text-[11px] font-bold text-[#adc6ff]">{p.name.slice(0, 2).toUpperCase()}</span>}
                              label={p.name}
                              sub={p.email}
                            />
                          );
                        })}
                      </ResultSection>
                    )}
                  </div>
                ) : !loading ? (
                  <div className="px-4 py-8 text-center text-[13px] text-on-surface-variant/50">
                    {t("noResultsFor", { query })}
                  </div>
                ) : null
              ) : (
                <div className="px-2">
                  <ResultSection label={t("actions")}>
                    {actions.map((a, i) => (
                      <ResultRow
                        key={a.id}
                        selected={selectedIndex === i}
                        onClick={() => handleSelect(a.href)}
                        iconBoxClass="w-9 h-9 rounded-lg bg-[#adc6ff]/10 flex items-center justify-center shrink-0 text-[#adc6ff]"
                        icon={
                          <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                            <line x1="12" x2="12" y1="5" y2="19" />
                            <line x1="5" x2="19" y1="12" y2="12" />
                          </svg>
                        }
                        label={a.label}
                        sub=""
                      />
                    ))}
                  </ResultSection>
                  <p className="px-4 pt-3 pb-1 text-center text-[12px] text-on-surface-variant/40">
                    {t("typeToSearch")}
                  </p>
                </div>
              )}
            </div>

            <div className="h-10 px-4 bg-surface-container-low/50 flex items-center justify-between border-t border-outline-variant/10">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60">
                  <kbd className="border border-outline-variant/60 rounded px-1.5 py-0.5 font-mono text-[10px]">↵</kbd> {t("select")}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60">
                  <kbd className="border border-outline-variant/60 rounded px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd> {t("navigate")}
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant/40">Axiom Search</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ResultSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-3 py-1.5 text-[10px] font-semibold text-on-surface-variant/40 uppercase tracking-widest">
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  selected,
  onClick,
  iconBoxClass,
  icon,
  label,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  iconBoxClass: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
        selected ? "bg-[#adc6ff]/10 text-[#adc6ff]" : "hover:bg-surface-container-highest text-on-surface"
      }`}
    >
      <div className={iconBoxClass}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{label}</div>
        {sub && <div className="text-[11px] text-on-surface-variant/50 truncate">{sub}</div>}
      </div>
    </button>
  );
}
