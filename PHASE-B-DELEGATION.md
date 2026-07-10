# Axiom — Phase B Delegation Document
> Version 1.0 | 2026-07-10 | Délégation complète sans retour requis

Ce document est autonome. L'assistant qui le reçoit peut implémenter les 5 features de Phase B sans poser de questions.

---

## 0. Contexte du projet

**Stack** : Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Better Auth, Prisma 7, PostgreSQL (Neon), Pusher, Groq + Gemini, @dnd-kit, Framer Motion v12, Zod

**Phase A** déjà complétée : Axiom Intelligence (AI), Analytics & Sprints, Responsive Mobile.

**CSS tokens dark mode** (définis dans `globals.css`) :
```css
:root {
  --background: #0f131d;
  --surface-container: #1c1f2a;
  --surface-container-high: #262a35;
  --on-surface: #dfe2f1;
  --on-surface-variant: #c2c6d6;
  --outline-variant: #424754;
  --primary: #3B82F6;
}
```

**Règle critique** : Aucun composant ne doit avoir de couleur hardcodée qui casse en light mode. Utiliser exclusivement les tokens CSS/Tailwind.

---

## 1. Packages à installer

```bash
pnpm add next-themes react-hotkeys-hook driver.js
pnpm add -D @playwright/test
npx playwright install --with-deps chromium
```

---

## 2. Migration Prisma — ajout `onboardingCompleted`

Ajouter dans `prisma/schema.prisma`, dans le model `User` :

```prisma
model User {
  // ... champs existants ...
  onboardingCompleted Boolean  @default(false)  // ← AJOUTER
  // ... relations existantes ...
}
```

Puis exécuter :

```bash
npx prisma migrate dev --name add-onboarding-flag
```

---

## 3. Feature 016 — Dark / Light Mode

> Implémenter en premier car tous les composants suivants doivent être theme-aware.

### 3.1 Tasks

- [ ] T001 — Ajouter les variables CSS light mode dans `src/app/globals.css`
- [ ] T002 — Modifier `src/app/layout.tsx` (ThemeProvider + `suppressHydrationWarning`)
- [ ] T003 — Créer `src/components/ui/theme-toggle.tsx`
- [ ] T004 — Ajouter le toggle dans `src/app/(app)/layout.tsx` (header desktop + mobile)
- [ ] T005 — Vérifier que tous les composants existants utilisent des tokens (pas de hex hardcodé)

### 3.2 Code complet

#### Modifier `src/app/globals.css` — ajouter le light mode

```css
@import "tailwindcss";
@config "../../tailwind.config.ts";

/* Dark mode (default) */
:root,
[data-theme="dark"] {
  --background: #0f131d;
  --foreground: #dfe2f1;
  --surface: #0f131d;
  --surface-container: #1c1f2a;
  --surface-container-high: #262a35;
  --surface-container-highest: #313540;
  --surface-container-lowest: #0a0e18;
  --on-surface: #dfe2f1;
  --on-surface-variant: #c2c6d6;
  --outline: #8c909f;
  --outline-variant: #424754;
  --primary: #3B82F6;
  --on-primary: #ffffff;
}

/* Light mode */
[data-theme="light"] {
  --background: #f4f6fb;
  --foreground: #1a1d27;
  --surface: #f4f6fb;
  --surface-container: #ffffff;
  --surface-container-high: #edf0f7;
  --surface-container-highest: #e2e5f0;
  --surface-container-lowest: #fafbfe;
  --on-surface: #1a1d27;
  --on-surface-variant: #4a4f63;
  --outline: #9299b0;
  --outline-variant: #d0d4e4;
  --primary: #2563eb;
  --on-primary: #ffffff;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: Geist, system-ui, sans-serif;
}

@layer base {
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}
```

#### Modifier `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "Axiom — The intelligence layer for elite teams.",
  description: "AI-powered Kanban board for engineering teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### `src/components/ui/theme-toggle.tsx`

```typescript
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
    >
      {isDark ? (
        // Sun icon
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon icon
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
```

#### Modifier `src/app/(app)/layout.tsx` — ajouter ThemeToggle dans le header

```typescript
// Importer en haut :
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Dans le header desktop, remplacer le div flex-1 + span par :
<div className="flex-1" />
<div className="flex items-center gap-3">
  <ThemeToggle />
  <span className="text-body-md text-on-surface-variant">
    {session.user.name}
  </span>
</div>
```

---

## 4. Feature 008 — UX & Motion Design avancé

### 4.1 Tasks

- [ ] T006 — Créer `src/lib/motion.ts` (motion tokens centralisés)
- [ ] T007 — Créer `src/components/ui/skeleton.tsx`
- [ ] T008 — Créer `src/components/ui/toast.tsx` + `src/contexts/toast-context.tsx`
- [ ] T009 — Créer `src/components/ui/page-transition.tsx`
- [ ] T010 — Modifier `src/components/board/task-card.tsx` (micro-interactions Framer Motion)
- [ ] T011 — Modifier `src/components/board/column.tsx` (hover state + task enter/exit animation)
- [ ] T012 — Modifier `src/components/task-detail/task-detail-modal.tsx` (entrée animée)
- [ ] T013 — Créer `src/components/ui/board-skeleton.tsx` (remplace spinner dans board)
- [ ] T014 — Ajouter ToastProvider dans `src/app/(app)/layout.tsx`

### 4.2 Code complet

#### `src/lib/motion.ts`

```typescript
// Motion tokens centralisés — source de vérité pour toutes les animations Axiom.
// Ne jamais définir duration/easing ad hoc dans les composants.

export const MOTION = {
  // Durées
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.2,
    moderate: 0.3,
    slow: 0.4,
  },

  // Courbes d'easing — "Conseiller premium discret" = précis, jamais enjoué
  ease: {
    standard: [0.4, 0, 0.2, 1] as const,       // Material standard
    decelerate: [0, 0, 0.2, 1] as const,         // Elements entering
    accelerate: [0.4, 0, 1, 1] as const,          // Elements leaving
    spring: { type: "spring" as const, stiffness: 380, damping: 30 },
    springGentle: { type: "spring" as const, stiffness: 200, damping: 25 },
  },

  // Variants réutilisables
  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
    },
    slideUp: {
      hidden: { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } },
      exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.96 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } },
      exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
    },
    modalOverlay: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.15 } },
      exit: { opacity: 0, transition: { duration: 0.12 } },
    },
    modalContent: {
      hidden: { opacity: 0, scale: 0.97, y: 8 },
      visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } },
      exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
    },
    listItem: {
      hidden: { opacity: 0, x: -6 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 6 },
    },
  },
} as const;
```

#### `src/components/ui/skeleton.tsx`

```typescript
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-surface-container-high animate-pulse",
        className
      )}
    />
  );
}

// Note: add to tailwind.config.ts if not present:
// cn utility: create src/lib/utils.ts with:
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
// pnpm add clsx tailwind-merge
```

> **Important** : Ajouter `pnpm add clsx tailwind-merge` si pas encore installé, et créer `src/lib/utils.ts` :
> ```typescript
> import { clsx, type ClassValue } from "clsx";
> import { twMerge } from "tailwind-merge";
> export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
> ```

#### `src/components/ui/board-skeleton.tsx`

```typescript
import { Skeleton } from "./skeleton";

export function BoardSkeleton() {
  return (
    <div className="flex gap-3 p-6 overflow-x-auto">
      {[1, 2, 3].map((col) => (
        <div key={col} className="shrink-0 w-[300px] md:w-72">
          <Skeleton className="h-8 w-32 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="rounded-xl border border-outline-variant/20 bg-surface-container p-4 space-y-2"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### `src/contexts/toast-context.tsx`

```typescript
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MOTION } from "@/lib/motion";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TYPE_STYLES: Record<ToastType, string> = {
  success: "border-green-500/30 bg-green-500/10 text-green-400",
  error: "border-red-500/30 bg-red-500/10 text-red-400",
  info: "border-primary/30 bg-primary/10 text-primary",
};

const TYPE_ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  ),
  info: (
    <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  ),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast portal */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              variants={MOTION.variants.slideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px] font-medium shadow-xl backdrop-blur-md ${TYPE_STYLES[t.type]}`}
            >
              {TYPE_ICONS[t.type]}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
```

#### Modifier `src/app/(app)/layout.tsx` — ajouter ToastProvider

```typescript
import { ToastProvider } from "@/contexts/toast-context";

// Wrapper le return avec ToastProvider :
return (
  <ToastProvider>
    <div className="flex h-screen bg-background">
      {/* ...contenu existant... */}
    </div>
  </ToastProvider>
);
```

#### Modifier `src/components/task-detail/task-detail-modal.tsx` — animation d'entrée

```typescript
// Ajouter en haut :
import { motion, AnimatePresence } from "framer-motion";
import { MOTION } from "@/lib/motion";

// Wrapper le contenu du modal avec AnimatePresence + motion.div :
return (
  <AnimatePresence>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/60"
        variants={MOTION.variants.modalOverlay}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      />
      <motion.main
        className="relative z-10 w-full md:max-w-5xl bg-surface-container-high md:bg-surface-container-high/85 backdrop-blur-xl border-0 md:border border-outline-variant rounded-none md:rounded-2xl overflow-hidden flex flex-col h-[100dvh] md:h-[85vh] md:max-h-[800px] shadow-2xl"
        variants={MOTION.variants.modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* ...contenu existant inchangé... */}
      </motion.main>
    </div>
  </AnimatePresence>
);
```

#### Modifier `src/components/board/task-card.tsx` — micro-interactions

```typescript
// Ajouter en haut :
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";

// Wrapper la card principale avec motion.div :
// Remplacer le div container de la card par :
<motion.div
  whileHover={{ y: -1, transition: { duration: MOTION.duration.fast } }}
  whileTap={{ scale: 0.98, transition: { duration: MOTION.duration.instant } }}
  className={/* classes existantes */}
>
  {/* contenu existant */}
</motion.div>
```

#### `src/components/ui/page-transition.tsx`

```typescript
"use client";

import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={MOTION.variants.fadeIn}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
```

> Wrapper chaque `page.tsx` significative avec `<PageTransition>` autour du contenu du return.

---

## 5. Feature 014 — Keyboard Shortcuts Reference Card

### 5.1 Tasks

- [ ] T015 — Créer `src/hooks/use-keyboard-shortcuts.ts`
- [ ] T016 — Créer `src/components/keyboard/shortcuts-panel.tsx`
- [ ] T017 — Créer `src/contexts/shortcuts-context.tsx`
- [ ] T018 — Ajouter ShortcutsProvider dans `src/app/(app)/layout.tsx`

### 5.2 Code complet

#### `src/contexts/shortcuts-context.tsx`

```typescript
"use client";

import { createContext, useContext, useState } from "react";

interface ShortcutsContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export function useShortcutsPanel() {
  return useContext(ShortcutsContext);
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ShortcutsContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((v) => !v),
      }}
    >
      {children}
    </ShortcutsContext.Provider>
  );
}
```

#### `src/hooks/use-keyboard-shortcuts.ts`

```typescript
"use client";

import { useEffect } from "react";

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Never fire when user is typing
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Allow Escape even in inputs
        if (e.key !== "Escape") return;
      }

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? e.metaKey || e.ctrlKey : true;
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : true;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && metaMatch && shiftMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
```

#### `src/components/keyboard/shortcuts-panel.tsx`

```typescript
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
            {/* Header */}
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

            {/* Shortcuts list */}
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
```

#### Modifier `src/app/(app)/layout.tsx` — ajouter providers + panel

```typescript
import { ShortcutsProvider } from "@/contexts/shortcuts-context";
import { ShortcutsPanel } from "@/components/keyboard/shortcuts-panel";

// Wrapper le return avec ShortcutsProvider et ajouter <ShortcutsPanel /> :
return (
  <ToastProvider>
    <ShortcutsProvider>
      <div className="flex h-screen bg-background">
        {/* ...contenu existant... */}
      </div>
      <ShortcutsPanel />
    </ShortcutsProvider>
  </ToastProvider>
);
```

Dans `src/app/(app)/[workspaceSlug]/boards/[boardId]/board-view-with-modal.tsx` (client component), ajouter le hook :

```typescript
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useShortcutsPanel } from "@/contexts/shortcuts-context";

// Dans le composant :
const { toggle: toggleShortcuts } = useShortcutsPanel();

useKeyboardShortcuts([
  {
    key: "/",
    meta: true,
    handler: toggleShortcuts,
    description: "Open keyboard shortcuts",
  },
  {
    key: "?",
    handler: toggleShortcuts,
    description: "Open keyboard shortcuts",
  },
  {
    key: "Escape",
    handler: () => setSelectedTaskId(null), // ou équivalent pour fermer le modal
    description: "Close modal",
  },
]);
```

---

## 6. Feature 013 — Onboarding Tour interactif

### 6.1 Tasks

- [ ] T019 — Migration Prisma (ajouter `onboardingCompleted` sur User — voir section 2)
- [ ] T020 — Créer `src/lib/actions/onboarding.actions.ts`
- [ ] T021 — Créer `src/components/onboarding/onboarding-tour.tsx`
- [ ] T022 — Ajouter `<OnboardingTour>` dans `src/app/(app)/layout.tsx` (conditionnel)

### 6.2 Code complet

#### `src/lib/actions/onboarding.actions.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function completeOnboarding() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true },
  });

  revalidatePath("/", "layout");
}
```

#### `src/components/onboarding/onboarding-tour.tsx`

```typescript
"use client";

import { useEffect, useRef } from "react";
import { completeOnboarding } from "@/lib/actions/onboarding.actions";

interface OnboardingTourProps {
  boardId?: string; // First board ID, if exists
}

const TOUR_STEPS = [
  {
    element: "#sidebar-workspaces",
    popover: {
      title: "Your workspaces",
      description:
        "Workspaces group your boards and team. Each workspace has its own members and permissions.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: "#board-columns",
    popover: {
      title: "Your board",
      description:
        "Tasks move through columns as work progresses. Drag and drop, or use the context menu.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#create-task-btn",
    popover: {
      title: "Create your first task",
      description:
        "Add a task to any column. Each task gets a unique AX-XXXX identifier.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#axiom-intelligence-panel",
    popover: {
      title: "Axiom Intelligence",
      description:
        "Open any task to access AI-powered suggestions: priority, estimation, blocker detection, and more.",
      side: "left" as const,
      align: "start" as const,
    },
  },
  {
    element: "#invite-team-link",
    popover: {
      title: "Invite your team",
      description:
        "Go to Settings → Members to invite colleagues. Set roles: Owner, Admin, Member, or Viewer.",
      side: "right" as const,
      align: "start" as const,
    },
  },
];

export function OnboardingTour({ boardId }: OnboardingTourProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Dynamically import driver.js (no SSR)
    void (async () => {
      const { driver } = await import("driver.js");
      await import("driver.js/dist/driver.css");

      // Filter steps whose elements exist in the DOM
      const existingSteps = TOUR_STEPS.filter((step) => {
        if (step.element === "#board-columns" && !boardId) return false;
        if (step.element === "#axiom-intelligence-panel") return false; // Skip if no task open
        return true;
      });

      const driverObj = driver({
        showProgress: true,
        steps: existingSteps,
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Done",
        progressText: "{{current}} of {{total}}",
        popoverClass: "axiom-driver-popover",
        onDestroyed: () => {
          void completeOnboarding();
        },
      });

      // Small delay to let the DOM settle
      setTimeout(() => {
        driverObj.drive();
      }, 800);
    })();
  }, [boardId]);

  return null;
}
```

> **CSS override pour driver.js** — ajouter dans `globals.css` :
> ```css
> .axiom-driver-popover {
>   background: var(--surface-container-high) !important;
>   border: 1px solid var(--outline-variant) !important;
>   border-radius: 12px !important;
>   color: var(--on-surface) !important;
>   font-family: Geist, system-ui, sans-serif !important;
>   box-shadow: 0 24px 48px rgba(0,0,0,0.4) !important;
> }
> .axiom-driver-popover .driver-popover-title {
>   color: var(--on-surface) !important;
>   font-size: 14px !important;
>   font-weight: 600 !important;
> }
> .axiom-driver-popover .driver-popover-description {
>   color: var(--on-surface-variant) !important;
>   font-size: 13px !important;
> }
> .axiom-driver-popover .driver-popover-footer button {
>   background: var(--primary) !important;
>   color: #fff !important;
>   border-radius: 8px !important;
>   font-size: 13px !important;
>   border: none !important;
> }
> .driver-overlay { background: rgba(0,0,0,0.6) !important; }
> ```

#### Ajouter `id` attributes aux éléments cibles dans les composants existants

Dans `src/app/(app)/layout.tsx` :
```typescript
// Sur le div "Workspaces" :
<div id="sidebar-workspaces" className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
  Workspaces
</div>

// Sur le lien "Settings > Members" :
<Link id="invite-team-link" href={`/${membership.workspace.slug}/settings/members`} ...>
```

Dans `src/app/(app)/[workspaceSlug]/boards/[boardId]/page.tsx` :
```typescript
// Wrapper le board avec un id :
<div id="board-columns">
  <BoardViewWithModal ... />
</div>
```

#### Modifier `src/app/(app)/layout.tsx` — déclencher le tour conditionnel

```typescript
// Dans la query session + memberships existante, ajouter :
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { onboardingCompleted: true },
});

const firstBoard = memberships[0]?.workspace?.boards?.[0];

// Dans le return, avant </main> :
{!user?.onboardingCompleted && (
  <OnboardingTour boardId={firstBoard?.id} />
)}
```

---

## 7. Feature 007 — Polish & Deploy final

### 7.1 Tasks

- [ ] T023 — Créer `src/app/not-found.tsx` (page 404 on-brand)
- [ ] T024 — Créer `src/app/(app)/[workspaceSlug]/settings/page.tsx` (Settings Account)
- [ ] T025 — Créer `src/app/(app)/[workspaceSlug]/notifications/page.tsx`
- [ ] T026 — Créer `src/lib/actions/notification.actions.ts`
- [ ] T027 — Créer `src/components/command-palette/command-palette.tsx`
- [ ] T028 — Créer `src/contexts/command-palette-context.tsx`
- [ ] T029 — Créer `src/app/api/search/route.ts` (search API pour command palette)
- [ ] T030 — Ajouter CommandPalette dans `src/app/(app)/layout.tsx`
- [ ] T031 — Créer `tests/e2e/auth.spec.ts`
- [ ] T032 — Créer `tests/e2e/board.spec.ts`
- [ ] T033 — Créer `playwright.config.ts`

### 7.2 Code complet

#### `src/app/not-found.tsx`

```typescript
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="mb-6">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-widest mb-3">
          Axiom
        </div>
        <h1 className="text-[80px] font-semibold text-on-surface leading-none tracking-tight mb-2">
          404
        </h1>
        <p className="text-[18px] text-on-surface-variant">
          This page does not exist.
        </p>
        <p className="text-[14px] text-on-surface-variant/60 mt-2 max-w-sm mx-auto">
          The resource you requested may have been moved, deleted, or never existed.
        </p>
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:brightness-110 transition-all"
      >
        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
        Back to Axiom
      </Link>
    </div>
  );
}
```

#### `src/app/(app)/[workspaceSlug]/settings/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
  });

  if (!workspace) redirect("/");

  const SETTINGS_SECTIONS = [
    { label: "Account", href: `/${workspaceSlug}/settings/account`, description: "Profile, avatar, password" },
    { label: "Members", href: `/${workspaceSlug}/settings/members`, description: "Invite and manage team members" },
    { label: "Workspace", href: `/${workspaceSlug}/settings/workspace`, description: "Name, slug, preferences" },
    { label: "Notifications", href: `/${workspaceSlug}/notifications`, description: "Notification center and preferences" },
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          {workspace.name}
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Settings</h1>
      </div>

      <div className="space-y-2">
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center justify-between p-5 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high transition-colors group"
          >
            <div>
              <div className="text-[14px] font-medium text-on-surface group-hover:text-primary transition-colors">
                {section.label}
              </div>
              <div className="text-[12px] text-on-surface-variant/60 mt-0.5">
                {section.description}
              </div>
            </div>
            <svg className="text-on-surface-variant/40 group-hover:text-primary transition-colors" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

#### `src/lib/actions/notification.actions.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await prisma.notification.update({
    where: {
      id: notificationId,
      userId: session.user.id, // workspaceId scoping via userId
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.id !== userId) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/", "layout");
}
```

#### `src/app/(app)/[workspaceSlug]/notifications/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notification.actions";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  task_assigned: "👤",
  comment_added: "💬",
  ai_suggestion: "◈",
  sprint_started: "▶",
  blocker_detected: "⚠",
};

export default async function NotificationsPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-[13px] text-on-surface-variant/60 mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <form
            action={markAllNotificationsRead.bind(null, session.user.id)}
          >
            <button
              type="submit"
              className="text-[13px] text-primary hover:text-primary/80 transition-colors"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
            <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20" className="text-on-surface-variant/40">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-[14px] text-on-surface-variant">Nothing here yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => {
            const payload = n.payload as { title?: string; message?: string };
            return (
              <form
                key={n.id}
                action={markNotificationRead.bind(null, n.id)}
              >
                <button
                  type="submit"
                  className={`w-full text-left flex items-start gap-3 p-4 rounded-xl transition-colors ${
                    n.readAt
                      ? "opacity-50 hover:opacity-70"
                      : "bg-primary/5 hover:bg-primary/8"
                  }`}
                >
                  <span className="text-[18px] shrink-0 mt-0.5">
                    {NOTIFICATION_ICONS[n.type] ?? "◆"}
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-medium text-on-surface">
                      {payload.title ?? n.type}
                    </p>
                    {payload.message && (
                      <p className="text-[12px] text-on-surface-variant/70 mt-0.5 truncate">
                        {payload.message}
                      </p>
                    )}
                    <p className="text-[11px] text-on-surface-variant/40 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.readAt && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

#### `src/app/api/search/route.ts`

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ tasks: [], boards: [] }));
  }

  // Get user's workspace IDs for scoping
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const [tasks, boards] = await Promise.all([
    prisma.task.findMany({
      where: {
        board: { workspaceId: { in: workspaceIds } },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        board: { include: { workspace: { select: { slug: true } } } },
        column: { select: { name: true } },
      },
      take: 8,
    }),
    prisma.board.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        name: { contains: q, mode: "insensitive" },
      },
      include: { workspace: { select: { slug: true } } },
      take: 4,
    }),
  ]);

  return new Response(
    JSON.stringify({
      tasks: tasks.map((t) => ({
        id: t.id,
        code: t.code,
        title: t.title,
        column: t.column.name,
        href: `/${t.board.workspace.slug}/boards/${t.boardId}?task=${t.id}`,
      })),
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        href: `/${b.workspace.slug}/boards/${b.id}`,
      })),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
```

#### `src/contexts/command-palette-context.tsx`

```typescript
"use client";

import { createContext, useContext, useState } from "react";

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  );
}
```

#### `src/components/command-palette/command-palette.tsx`

```typescript
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { useEffect, useRef, useState, useTransition } from "react";
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
            {/* Search input */}
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

            {/* Results */}
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
                No results for "{query}"
              </div>
            ) : query.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-on-surface-variant/40">
                Type to search tasks and boards
              </div>
            ) : null}

            {/* Footer */}
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
```

#### Modifier `src/app/(app)/layout.tsx` — ajouter CommandPalette + provider

```typescript
import { CommandPaletteProvider } from "@/contexts/command-palette-context";
import { CommandPalette } from "@/components/command-palette/command-palette";

// Wrapper complet du layout :
return (
  <ToastProvider>
    <ShortcutsProvider>
      <CommandPaletteProvider>
        <div className="flex h-screen bg-background">
          {/* ...sidebar et main existants... */}
        </div>
        <ShortcutsPanel />
        <CommandPalette />
        {!user?.onboardingCompleted && <OnboardingTour boardId={firstBoard?.id} />}
      </CommandPaletteProvider>
    </ShortcutsProvider>
  </ToastProvider>
);
```

Dans `board-view-with-modal.tsx` ou le layout, ajouter le raccourci ⌘K :

```typescript
import { useCommandPalette } from "@/contexts/command-palette-context";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Dans le composant :
const { open: openCommandPalette } = useCommandPalette();
const { toggle: toggleShortcuts } = useShortcutsPanel();

useKeyboardShortcuts([
  { key: "k", meta: true, handler: openCommandPalette, description: "Open command palette" },
  { key: "/", meta: true, handler: toggleShortcuts, description: "Keyboard shortcuts" },
  { key: "?", handler: toggleShortcuts, description: "Keyboard shortcuts" },
]);
```

#### `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

#### `tests/e2e/auth.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

const TEST_EMAIL = `test-${Date.now()}@axiom-e2e.dev`;
const TEST_PASSWORD = "Axiom@Test123!";
const TEST_NAME = "E2E Tester";

test.describe("Authentication", () => {
  test("User can sign up with credentials", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByPlaceholder(/name/i).fill(TEST_NAME);
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign up/i }).click();

    // Should redirect to app after signup
    await expect(page).toHaveURL(/\/(workspaces\/new|[a-z])/);
  });

  test("User can log in", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await expect(page).not.toHaveURL("/login");
  });

  test("Invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill("wrong@example.com");
    await page.getByPlaceholder(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await expect(page.locator("text=/error|invalid|incorrect/i")).toBeVisible();
  });
});
```

#### `tests/e2e/board.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

// Requires a seeded demo workspace — run `pnpm seed` before e2e tests
// OR use environment variables for test credentials

test.describe("Board Kanban", () => {
  test.beforeEach(async ({ page }) => {
    // Login with demo/seed credentials
    await page.goto("/login");
    await page.getByPlaceholder(/email/i).fill(process.env.E2E_EMAIL ?? "demo@axiom.dev");
    await page.getByPlaceholder(/password/i).fill(process.env.E2E_PASSWORD ?? "Demo@Axiom123!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/[a-z]/);
  });

  test("Board loads with columns", async ({ page }) => {
    // Navigate to first board
    await page.locator("a[href*='/boards/']").first().click();
    await expect(page.locator("[data-column]").first()).toBeVisible({ timeout: 5000 });
  });

  test("Can create a task", async ({ page }) => {
    await page.locator("a[href*='/boards/']").first().click();
    await page.getByRole("button", { name: /add task|new task|\+/i }).first().click();
    await page.getByPlaceholder(/task title|title/i).fill("E2E Test Task");
    await page.getByRole("button", { name: /create|save|add/i }).click();

    await expect(page.locator("text=E2E Test Task")).toBeVisible({ timeout: 3000 });
  });

  test("Command palette opens with Ctrl+K", async ({ page }) => {
    await page.locator("a[href*='/boards/']").first().click();
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder(/search tasks/i)).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder(/search tasks/i)).not.toBeVisible();
  });

  test("Keyboard shortcuts panel opens with ?", async ({ page }) => {
    await page.locator("a[href*='/boards/']").first().click();
    await page.keyboard.press("?");
    await expect(page.locator("text=Keyboard Shortcuts")).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("Escape");
  });
});
```

---

## 8. Ordre d'exécution recommandé

```
# 1. Migration Prisma d'abord
npx prisma migrate dev --name add-onboarding-flag

# 2. Dark/Light mode (base pour tout)
git checkout main && git pull
git checkout -b feat-016-dark-light-mode
# → T001 à T005
pnpm build && pnpm lint && pnpm type-check
# → PR + squash merge

# 3. UX & Motion
git checkout main && git pull
git checkout -b feat-008-ux-motion
# → T006 à T014
pnpm build && pnpm lint && pnpm type-check
# → PR + squash merge

# 4. Keyboard Shortcuts
git checkout main && git pull
git checkout -b feat-014-keyboard-shortcuts
# → T015 à T018
pnpm build && pnpm lint && pnpm type-check
# → PR + squash merge

# 5. Onboarding Tour
git checkout main && git pull
git checkout -b feat-013-onboarding-tour
# → T019 à T022
pnpm build && pnpm lint && pnpm type-check
# → PR + squash merge

# 6. Polish & Deploy (settings, notifications, command palette, tests)
git checkout main && git pull
git checkout -b feat-007-polish-deploy
# → T023 à T033
pnpm build && pnpm lint && pnpm type-check
npx playwright test  # doit passer à 100%
# → PR + squash merge
```

---

## 9. Checklist de validation finale

- [ ] ThemeToggle présent dans le header, fonctionne sans flash de page
- [ ] Aucune couleur hardcodée (`#...`) dans les composants — uniquement des tokens CSS
- [ ] Contraste WCAG AA maintenu en light mode (vérifier avec browser devtools)
- [ ] `MOTION` importé partout où des animations sont définies (pas de valeur ad hoc)
- [ ] Aucun spinner générique — tous remplacés par des skeletons
- [ ] Command palette répond en < 500ms
- [ ] Raccourci `⌘K` ouvre la command palette depuis n'importe quel écran authentifié
- [ ] `?` ouvre le panel de raccourcis
- [ ] Onboarding se déclenche uniquement à la première connexion
- [ ] `PROGRESS.md` mis à jour après chaque merge
