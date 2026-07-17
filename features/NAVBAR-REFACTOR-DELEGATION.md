# Axiom — Navbar Refactor Delegation
> UX Premium : un seul rôle par barre de navigation

---

## 0. Contexte & Objectif

**Problème** : deux navbars naviguent en parallèle → confusion UX.
- Top bar : Dashboard / Projects / Team / Analytics + utilitaires
- Sidebar : Overview / Workspaces / AI Insights / Archive / Trash

**Solution** : donner un rôle unique à chaque barre.
- **Sidebar** = navigation (unique source de vérité)
- **Top bar** = contexte courant + utilitaires (ce qui est cerclé en rouge sur la capture)

**Référence** : Linear, Vercel dashboard, Supabase.

---

## 1. Résultat attendu

### Top bar (APRÈS)
```
[Axiom]  [breadcrumb : Demo Workspace › Sprint Planning]      [+ Add task]  [🔍 Search ⌘K]  [EN]  [☀]  [🔔]  [⚙]  [TE]
```
→ Le bloc cerclé en rouge (Add task, Search, EN, ☀, 🔔, ⚙, Avatar) **ne bouge pas**.
→ On retire uniquement les liens de navigation (Dashboard / Projects / Team / Analytics).
→ On ajoute un breadcrumb contextuel à leur place.

### Sidebar (APRÈS)
```
────────────────────────────
  Overview
  Projects         ← NOUVEAU (était dans top bar)
  Team             ← NOUVEAU (était dans top bar)
  Analytics        ← NOUVEAU (était dans top bar)
────────────────────────────
  ✦ AI Insights
  Workspaces
────────────────────────────
  Archive
  Trash
  My Tasks         SOON
────────────────────────────
  [Plan card]
```

---

## 2. Fichiers à modifier

| Fichier | Action |
|---|---|
| `src/components/layout/top-navbar.tsx` | Supprimer `<nav>`, ajouter breadcrumb |
| `src/components/layout/workspace-sidebar-nav.tsx` | Ajouter Projects / Team / Analytics, restructurer sections |

**Aucun autre fichier ne change.** Le layout.tsx, les contextes, les providers restent intacts.

---

## 3. Modification 1 — `src/components/layout/top-navbar.tsx`

**Remplacer le fichier complet par ce code :**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { useCreateTask } from "@/contexts/create-task-context";
import { NotificationBell } from "@/components/layout/notification-bell";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

interface NotificationItem {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

interface Membership {
  role: string;
  workspace: {
    slug: string;
    name: string;
    boards: { id: string; name: string }[];
  };
}

interface TopNavbarProps {
  memberships: Membership[];
  unreadCount: number;
  notifications: NotificationItem[];
  userId: string;
  userName: string;
  userEmail: string;
  locale: "fr" | "en";
  notificationLabels: {
    title: string;
    markAllRead: string;
    nothingHereYet: string;
    seeAllActivity: string;
  };
}

export function TopNavbar({
  memberships,
  unreadCount,
  notifications,
  userId,
  userName,
  userEmail,
  locale,
  notificationLabels,
}: TopNavbarProps) {
  const t = useTranslations("nav");
  const tBoard = useTranslations("board");
  const pathname = usePathname();
  const { open: openCommandPalette } = useCommandPalette();
  const { open: openCreateTask } = useCreateTask();

  const isOnBoardPage = /^\/[^/]+\/boards\/[^/]+$/.test(pathname);
  const workspaceSlugs = memberships.map((m) => m.workspace.slug);

  // Workspace courant
  const currentSlug = pathname.split("/")[1];
  const current =
    memberships.find((m) => m.workspace.slug === currentSlug) ?? memberships[0];
  const slug = current?.workspace.slug;

  // Breadcrumb : construire les segments lisibles
  const breadcrumb = buildBreadcrumb(pathname, current);

  return (
    <header className="hidden md:flex h-14 bg-surface-container/95 backdrop-blur-md border-b border-outline-variant/30 items-center px-5 shrink-0 gap-4">
      {/* Logo */}
      <Link
        href="/workspaces"
        className="text-[18px] font-black text-primary tracking-tight shrink-0"
      >
        Axiom
      </Link>

      {/* Séparateur vertical */}
      {breadcrumb.length > 0 && (
        <div className="h-4 w-px bg-outline-variant/40 shrink-0" />
      )}

      {/* Breadcrumb contextuel */}
      {breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[13px] min-w-0">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <svg
                  className="text-on-surface-variant/30 shrink-0"
                  fill="none"
                  height="12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="12"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className={`truncate transition-colors ${
                    i === breadcrumb.length - 1
                      ? "text-on-surface font-medium"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${
                    i === breadcrumb.length - 1
                      ? "text-on-surface font-medium"
                      : "text-on-surface-variant"
                  }`}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Utilitaires — côté droit (inchangé) */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Add task — visible uniquement sur une page board */}
        {isOnBoardPage && current?.role !== "VIEWER" && (
          <button
            onClick={openCreateTask}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            {tBoard("addTask")}
          </button>
        )}

        {/* Search ⌘K */}
        <button
          onClick={openCommandPalette}
          className="w-56 flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant/60 hover:border-outline-variant/50 hover:text-on-surface-variant transition-colors cursor-pointer text-left"
        >
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            width="14"
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="text-[13px] flex-1 truncate">{t("searchPlaceholder")}</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant/50 shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Locale */}
        <LocaleSwitcher currentLocale={locale} />

        {/* Theme */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationBell
          workspaceSlugs={workspaceSlugs}
          fallbackSlug={memberships[0]?.workspace.slug}
          unreadCount={unreadCount}
          notifications={notifications}
          userId={userId}
          labels={notificationLabels}
        />

        {/* Settings */}
        {slug && (
          <Link
            id="invite-team-link"
            href={`/${slug}/settings`}
            aria-label={t("settings")}
            className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              width="16"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        )}

        {/* User avatar */}
        <UserMenu userName={userName} userEmail={userEmail} />
      </div>
    </header>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function buildBreadcrumb(
  pathname: string,
  current: Membership | undefined
): BreadcrumbItem[] {
  if (!current) return [];

  const slug = current.workspace.slug;
  const workspaceName = current.workspace.name;
  const segments = pathname.split("/").filter(Boolean);

  // /workspaces
  if (pathname === "/workspaces") return [{ label: "Workspaces" }];

  // /workspaces/archived | /workspaces/trash
  if (pathname === "/workspaces/archived")
    return [
      { label: "Workspaces", href: "/workspaces" },
      { label: "Archive" },
    ];
  if (pathname === "/workspaces/trash")
    return [
      { label: "Workspaces", href: "/workspaces" },
      { label: "Trash" },
    ];

  // /dashboard
  if (pathname === "/dashboard") return [{ label: "Dashboard" }];

  // rien de reconnu sans slug workspace
  if (!slug || !segments[0]) return [];

  const wsItem: BreadcrumbItem = {
    label: workspaceName,
    href: `/${slug}`,
  };

  // /[slug] — overview
  if (pathname === `/${slug}`) return [wsItem];

  // /[slug]/team
  if (pathname === `/${slug}/team`)
    return [wsItem, { label: "Team" }];

  // /[slug]/settings*
  if (pathname.startsWith(`/${slug}/settings`))
    return [wsItem, { label: "Settings" }];

  // /[slug]/audit-log
  if (pathname.startsWith(`/${slug}/audit-log`))
    return [wsItem, { label: "Audit Log" }];

  // /[slug]/boards/[boardId]  or  /[slug]/boards/[boardId]/analytics
  const boardMatch = pathname.match(
    /^\/[^/]+\/boards\/([^/]+)(\/analytics)?$/
  );
  if (boardMatch) {
    const boardId = boardMatch[1];
    const isAnalytics = !!boardMatch[2];
    const board = current.workspace.boards.find((b) => b.id === boardId);
    const boardLabel = board?.name ?? "Board";
    const boardItem: BreadcrumbItem = {
      label: boardLabel,
      href: `/${slug}/boards/${boardId}`,
    };
    if (isAnalytics)
      return [wsItem, boardItem, { label: "Analytics" }];
    return [wsItem, boardItem];
  }

  // fallback : juste workspace
  return [wsItem];
}
```

---

## 4. Modification 2 — `src/components/layout/workspace-sidebar-nav.tsx`

**Remplacer le fichier complet par ce code :**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface Membership {
  workspace: {
    slug: string;
    boards: { id: string; name: string }[];
  };
}

interface WorkspaceSidebarNavProps {
  memberships: Membership[];
}

export function WorkspaceSidebarNav({ memberships }: WorkspaceSidebarNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const currentSlug = pathname.split("/")[1];
  const current =
    memberships.find((m) => m.workspace.slug === currentSlug) ?? memberships[0];
  const slug = current?.workspace.slug;
  const firstBoardId = current?.workspace.boards[0]?.id;

  // ─── Section 1 : Navigation workspace principale ───────────────────────
  const mainLinks = slug
    ? [
        {
          href: `/${slug}`,
          label: t("overview"),
          active: pathname === `/${slug}`,
          icon: iconOverview,
        },
        {
          id: "sidebar-projects",
          href: `/${slug}`,      // pointe vers le workspace (liste des boards)
          label: t("projects"),
          active:
            pathname.startsWith(`/${slug}/boards`) &&
            !pathname.endsWith("/analytics"),
          icon: iconProjects,
        },
        {
          href: `/${slug}/team`,
          label: t("team"),
          active: pathname === `/${slug}/team`,
          icon: iconTeam,
        },
        ...(firstBoardId
          ? [
              {
                href: `/${slug}/boards/${firstBoardId}/analytics`,
                label: t("analytics"),
                active: pathname.endsWith("/analytics"),
                icon: iconAnalytics,
              },
            ]
          : []),
      ]
    : [];

  // ─── Section 2 : IA & global ──────────────────────────────────────────
  const secondaryLinks = [
    ...(slug
      ? [
          {
            href: `/${slug}/settings#ai-quota`,
            label: t("aiInsights"),
            active: false,
            icon: iconAI,
          },
        ]
      : []),
    {
      id: "sidebar-workspaces",
      href: "/workspaces",
      label: t("workspaces"),
      active: pathname === "/workspaces",
      icon: iconWorkspaces,
    },
  ];

  // ─── Section 3 : Utilitaires ──────────────────────────────────────────
  const utilityLinks = [
    {
      href: "/workspaces/archived",
      label: t("archive"),
      active: pathname === "/workspaces/archived",
      icon: iconArchive,
    },
    {
      href: "/workspaces/trash",
      label: t("trash"),
      active: pathname === "/workspaces/trash",
      icon: iconTrash,
    },
  ];

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto flex flex-col gap-1">
      {/* Section 1 — Navigation principale */}
      <div className="space-y-0.5">
        {mainLinks.map((item) => (
          <NavLink key={item.href + item.label} {...item} />
        ))}
      </div>

      {/* Séparateur */}
      <div className="my-2 h-px bg-outline-variant/20" />

      {/* Section 2 — IA & workspaces */}
      <div className="space-y-0.5">
        {secondaryLinks.map((item) => (
          <NavLink key={item.href + item.label} {...item} />
        ))}
      </div>

      {/* Séparateur */}
      <div className="my-2 h-px bg-outline-variant/20" />

      {/* Section 3 — Utilitaires */}
      <div className="space-y-0.5">
        {utilityLinks.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* My Tasks — coming soon */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant/40 cursor-default select-none">
          {iconMyTasks}
          <span className="text-[13px]">{t("myTasks")}</span>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/30">
            Soon
          </span>
        </div>
      </div>
    </nav>
  );
}

// ─── Composant NavLink ───────────────────────────────────────────────────────

interface NavLinkProps {
  id?: string;
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}

function NavLink({ id, href, label, active, icon }: NavLinkProps) {
  return (
    <Link
      id={id}
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all ${
        active
          ? "bg-primary/10 text-primary"
          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

// ─── Icônes SVG ──────────────────────────────────────────────────────────────

const iconOverview = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <rect height="7" width="7" x="3" y="3" />
    <rect height="7" width="7" x="14" y="3" />
    <rect height="7" width="7" x="14" y="14" />
    <rect height="7" width="7" x="3" y="14" />
  </svg>
);

const iconProjects = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
    <line x1="3" x2="21" y1="9" y2="9" />
    <line x1="9" x2="9" y1="21" y2="9" />
  </svg>
);

const iconTeam = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const iconAnalytics = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <line x1="18" x2="18" y1="20" y2="10" />
    <line x1="12" x2="12" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="14" />
  </svg>
);

const iconAI = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const iconWorkspaces = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

const iconArchive = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <rect height="5" rx="1" width="20" x="2" y="3" />
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </svg>
);

const iconTrash = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

const iconMyTasks = (
  <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
```

---

## 5. Clés i18n à ajouter si manquantes

Vérifier que `messages/fr.json` et `messages/en.json` contiennent bien ces clés dans le namespace `"nav"` :

```json
// fr.json → "nav"
"overview": "Vue d'ensemble",
"projects": "Projets",
"team": "Équipe",
"analytics": "Analytiques",
"aiInsights": "IA Insights",
"workspaces": "Espaces",
"archive": "Archive",
"trash": "Corbeille",
"myTasks": "Mes tâches",
"settings": "Paramètres",
"searchPlaceholder": "Rechercher..."

// en.json → "nav"
"overview": "Overview",
"projects": "Projects",
"team": "Team",
"analytics": "Analytics",
"aiInsights": "AI Insights",
"workspaces": "Workspaces",
"archive": "Archive",
"trash": "Trash",
"myTasks": "My Tasks",
"settings": "Settings",
"searchPlaceholder": "Search boards and tasks..."
```

---

## 6. Checklist de validation

- [ ] Top bar ne contient plus Dashboard / Projects / Team / Analytics
- [ ] Top bar affiche : `Axiom | breadcrumb | [Add task] [Search] [EN] [☀] [🔔] [⚙] [Avatar]`
- [ ] Breadcrumb sur `/demo-workspace/boards/xxx` → `Demo Workspace › Sprint Planning`
- [ ] Breadcrumb sur `/demo-workspace/team` → `Demo Workspace › Team`
- [ ] Breadcrumb sur `/workspaces` → `Workspaces`
- [ ] Sidebar : 3 sections séparées par des dividers
- [ ] Sidebar section 1 : Overview / Projects / Team / Analytics (actif selon route)
- [ ] Sidebar section 2 : AI Insights / Workspaces
- [ ] Sidebar section 3 : Archive / Trash / My Tasks (Soon)
- [ ] Aucune régression sur mobile (MobileSidebar non modifié)
- [ ] `pnpm type-check` sans erreur
- [ ] `pnpm build` sans erreur
