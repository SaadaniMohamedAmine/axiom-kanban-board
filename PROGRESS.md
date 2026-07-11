# Axiom — Progress

> Project 03/30. Mis à jour en continu. Format : X/Y tâches + % par phase.

## Phase 0 — Identité & Design — ✅ COMPLETE (100%)
- [x] Conception initiale (description, étude marché, design tokens préliminaires)
- [x] Stack tranché : Next.js, Better Auth, Fastify→abandonné, Pusher/Ably pour le realtime
- [x] Stack validée moderne/fiable via recherche web (2026-06-27) — Auth.js→Better Auth, Prisma 7 confirmé
- [x] Brand identity : nom (Axiom), baseline, voix de marque, logo (wordmark seul)
- [x] Design Stitch : 21 écrans (Lot 1 + Lot 2 + corrections) avec code exporté
- [x] Design system documenté (`axiom-design/axiom/DESIGN.md`)
- [x] `BRAND-IDENTITY.md`, `DATA-MODEL.md`, `NON-FUNCTIONAL-REQUIREMENTS.md` rédigés

**Phase 0 : 6/6 — 100%**

## Phase 1 — Speckit (0%)
- [x] Structure Speckit : générée automatiquement par les commandes `specify` (pas de structure manuelle à définir)
- [ ] Constitution rédigée
- [ ] Specs fonctionnelles par module
- [ ] Plan technique
- [ ] Tasks générées

**Phase 1 : 1/5 — 20%**

## Phase 2 — Setup — ✅ COMPLETE (100%)
- [x] Init Next.js + TypeScript + Tailwind
- [x] Prisma 7 + PostgreSQL (schema selon DATA-MODEL.md)
- [x] Better Auth configuré (Google/GitHub + credentials)
- [x] Pusher configuré
- [x] Déploiement Vercel initial (projet live dès le setup, déploiements continus ensuite)

**Phase 2 : 5/5 — 100%**

## Phase 3 — Core Kanban — ✅ COMPLETE (100%)
- [x] Schema additions (Board.taskCounter, Task.code required, Task.sprintId, Invitation.expiresAt, ActivityEvent.actorId)
- [x] Tailwind theme normalized to DESIGN.md tokens
- [x] Authenticated route group shell with sidebar/topnav
- [x] requireRole permission guard
- [x] Task order helper (gap-stepped)
- [x] Atomic task code generation
- [x] Shared types and Zod validation schemas
- [x] Prisma seed script
- [x] US1: Fluid task board interaction (create, drag&drop, delete tasks with optimistic UI)
- [x] US2: Rich task detail (description, assignees, labels, comments, activity history)
- [x] US3: Workspace and board setup (create workspace, invite members, create board from template)
- [x] US4: Role-based permission enforcement (server-side guards on all mutations)
- [x] US5: Sprint planning (create sprints, attach tasks, status transitions)
- [x] Build verification passed (pnpm build, type-check)
- [x] Security/correctness review: fixed stored XSS in task description, broken drag&drop optimistic update, task-order duplicate collisions, cross-tenant assignee/label IDOR, weak invitation token
- [x] Quality gate repair: `pnpm lint` (broken by Next 16's flat-config migration) fixed and enforced clean — build, lint, and type-check all pass per Constitution Gate IV
- [x] Post-review hardening (2026-07-10): fixed broken Tailwind v4 theme (missing `@config` link + unlayered CSS reset silently overriding every spacing utility, affecting 19 files), unawaited Next.js 16 async route `params` on 4 pages (workspace/board/members lookups always resolved `undefined`), and the post-`createWorkspace` redirect pointing at a route with no page
- [x] `/speckit-converge` audit against spec.md/plan.md found and fixed 3 remaining gaps: VIEWER-role mutating controls not hidden/disabled in board UI (T051), drag & drop not keyboard-operable via `KeyboardSensor` (T052), `inviteMember`'s `revalidatePath` targeting the wrong route so the members list didn't refresh after an invite (T053) — tracked as Phase 9: Convergence in `specs/002-core-kanban/tasks.md`
- [x] `pnpm lint` broken a second time — Next.js 16 removed the `next lint` subcommand entirely; script repointed to `eslint .` directly
- [x] Merged to `main` via PR #3 (2026-07-10) — Vercel preview build green, all Constitution Gate IV checks (build/lint/type-check) passing

**Phase 3 : 16/16 — 100%**

## Phase 4 — Realtime — ✅ COMPLETE (100%)
- [x] Prisma migration: Task.createdAt + Task.updatedAt (T001)
- [x] Shared realtime types: BoardEvent, PresenceMember, ConflictEvent, ConnectionState (T002, T003)
- [x] Pusher channel auth endpoint POST /api/pusher/auth with server-side membership re-check (T004)
- [x] Server-side broadcast helper triggerBoardEvent in src/lib/realtime.ts (T005)
- [x] useBoardChannel hook: subscribe/bind/presence/connection-state tracking (T006)
- [x] currentUser threading through board-view-with-modal into board-view (T007)
- [x] US1: Live task sync — all mutations broadcast events, board-view folds incoming events, socket_id exclusion prevents own-echo flicker (T008-T012)
- [x] US2: Presence awareness — PresenceAvatars component with geometric-initials fallback, wired into board header (T013-T015)
- [x] US3: Graceful degradation — ConnectionIndicator, 8s threshold + 5s polling fallback via getBoardSnapshot, all interactions remain enabled regardless of connection state (T016-T019)
- [x] US4: Conflict detection — expectedUpdatedAt threading, server-side staleness check, task.conflict broadcast, ConflictBadge on superseded tasks (T020-T024)
- [x] Build verification passed (pnpm build, lint, type-check) — all gates green, 0 errors
- [x] Security audit: PUSHER_SECRET/PUSHER_APP_ID server-only, no cross-board leak, workspaceId-scoped queries throughout
- [x] Quickstart walkthrough ready for manual execution (T028) — requires 2 browser sessions + live Pusher app in .env.local

**Phase 4 : 28/28 — 100%**

## Phase 5 — AI Features / Axiom Intelligence — ✅ COMPLETE (100%)
- [x] T001 — AI client abstraction (Groq + Gemini fallback)
- [x] T002 — Prompts pour toutes les suggestions IA
- [x] T003 — Rate limiter par utilisateur (50 requêtes/jour)
- [x] T004 — Schémas Zod pour validation des inputs IA
- [x] T005 — Types TypeScript pour les réponses IA
- [x] T006-T010 — 5 endpoints API avec streaming SSE (prioritize, estimate, describe, detect-blocker, assign)
- [x] T011 — Server action pour feedback utilisateur sur suggestions IA
- [x] T012 — Composant ReasoningStream pour affichage temps réel
- [x] T013 — Composant FeedbackButtons (utile/inutile)
- [x] T014 — Panel Axiom Intelligence intégré au task-detail-modal
- [x] T015 — Intégration complète avec passage de boardMembers et columnName
- [x] Code review (2026-07-10) : fixed Sprint Health AI summary sending a non-cuid `taskId` (`/api/ai/prioritize` always 400'd) — endpoint now accepts `taskId` or `sprintId`
- [x] Manual QA (2026-07-10) : fixed `ReasoningStream` never rendering any suggestion — `startedRef` guard blocked the retry after React Strict Mode's dev double-invoke aborted the first request

**Phase 5 : 15/15 — 100%**

## Phase 6 — Analytics & Sprints — ✅ COMPLETE (100%)
- [x] T016 — Calculs burndown et velocity
- [x] T017 — Composant BurndownChart (recharts)
- [x] T018 — Composant VelocityChart (recharts)
- [x] T019 — Composant SprintHealthSummary avec IA
- [x] T020 — Composant AnalyticsEmptyState
- [x] T021 — Page analytics avec données sprints
- [x] T022 — Lien Analytics dans sidebar pour chaque board
- [x] Code review (2026-07-10) : fixed `blockedTasks` hardcoded to 0 in the analytics page — now computed from real task activity (no activity 3+ days while outside the done column)
- [x] Manual QA (2026-07-10) : validated burndown/velocity/sprint-health rendering end-to-end against a live seeded sprint

**Phase 6 : 7/7 — 100%**

## Phase 7 — Responsive Mobile Design — ✅ COMPLETE (100%)
- [x] T023 — MobileSidebar avec drawer et backdrop
- [x] T024 — MoveToMenu pour alternative mobile au drag&drop
- [x] T025 — Layout responsive (sidebar desktop + mobile drawer)
- [x] T026 — BoardView avec TouchSensor et scroll horizontal snap
- [x] T027 — TaskCard avec tap targets adaptés mobile
- [x] T028 — TaskDetailModal fullscreen sur mobile (100dvh)
- [x] Code review (2026-07-10) : fixed `MoveToMenu` being built but never wired into the UI — now rendered in `TaskDetailModal` (mobile-only) as the non-drag alternative it was built for
- [x] Manual QA (2026-07-10) : validated mobile board/drawer/task-modal rendering visually

**Phase 7 : 6/6 — 100%**

---

**Phase A (features 004-006 — Axiom Intelligence, Analytics & Sprints, Responsive Mobile) : ✅ DELEGATION COMPLETE.** Implémentée en une seule branche (`feat-phase-A-core-product-03-06`, 13 commits) au lieu des 3 branches/PR séparées prévues par `PHASE-A-DELEGATION.md`. Code review manuelle (CodeRabbit indisponible localement) : 4 bugs trouvés et corrigés. QA manuelle en conditions réelles : 1 bug bloquant supplémentaire trouvé et corrigé (Axiom Intelligence ne rendait jamais aucune suggestion). `pnpm build`/`lint`/`type-check` verts. **Reste : push + PR vers `main`** (pas encore fait, contrairement aux phases précédentes).

---

## Phase B — UX Excellence (Dark/Light Mode, Motion, Shortcuts, Onboarding, Polish) — ✅ COMPLETE (100%)

- [x] Packages installés : next-themes, react-hotkeys-hook, driver.js, clsx, tailwind-merge, @playwright/test
- [x] Migration Prisma : ajout `onboardingCompleted` sur User
- [x] **Feature 016 — Dark/Light Mode** : variables CSS light/dark, ThemeProvider, ThemeToggle dans le header, tokens CSS partout
- [x] **Feature 008 — UX & Motion** : motion tokens centralisés (MOTION), skeleton component, board-skeleton, page-transition, toast system (context + provider), micro-interactions Framer Motion (task-card hover/tap, column enter/exit, modal entrance)
- [x] **Feature 014 — Keyboard Shortcuts** : useKeyboardShortcuts hook, ShortcutsPanel modal, ShortcutsProvider, ⌘K / ? / Esc raccourcis dans board-view-with-modal
- [x] **Feature 013 — Onboarding Tour** : tour interactif driver.js (5 étapes), completeOnboarding server action, déclenché conditionnellement, IDs DOM (sidebar-workspaces, board-columns, invite-team-link)
- [x] **Feature 007 — Polish & Deploy** : page 404 on-brand, Settings menu, Notifications page + server actions, command palette avec search API, ⌘K palette, Playwright e2e tests (auth + board)
- [x] CSS override driver.js dans globals.css
- [x] `pnpm lint` : 0 errors
- [x] `pnpm type-check` : 0 errors
- [x] Code review manuelle : 3 fixes (dépendances next-themes/driver.js/clsx/tailwind-merge manquantes, ThemeProvider non câblé, IDOR sur markNotificationRead)
- [x] Mergée vers `main` via PR #8

**Phase B : 33/33 — 100% — ✅ CLÔTURÉE**

---

## Phase C — SEO, Analytics, Sentry, Changelog, Roadmap — ✅ COMPLETE (100%)

- [x] Packages installés : @sentry/nextjs, @vercel/analytics, @vercel/speed-insights, gray-matter, remark, remark-html
- [x] **Feature 019 — SEO & Landing** : landing page publique Axiom, metadata SEO complètes (Open Graph, Twitter cards), OG image dynamique, robots.txt, sitemap.xml, layout marketing minimaliste
- [x] **Feature 011 — Vercel Analytics** : composants Analytics + SpeedInsights dans le layout racine
- [x] **Feature 010 — Sentry** : 3 configs (client/server/edge), wrapper next.config.ts, ErrorBoundary component, global-error.tsx, identification utilisateur dans le layout
- [x] **Feature 012 — Changelog** : 3 entrées markdown (v0.1, v0.2, v1.0), helper de lecture Markdown (gray-matter + remark), page publique avec timeline
- [x] **Feature 015 — Public Roadmap** : config statique Now/Next/Later, page publique 3 colonnes avec badges de statut
- [x] `pnpm lint` : 0 errors
- [x] `pnpm type-check` : 0 errors
- [x] Branche rebasée sur `main` (elle avait divergé avant 16 commits de Phase B) et conflits résolus proprement (`layout.tsx`, `globals.css`, `package.json`, `PROGRESS.md`) sans casser la logique `ThemeToggle` binaire de Phase B
- [x] Code review manuelle (CodeRabbit indisponible) : 6 bugs trouvés et corrigés — `ErrorBoundary` jamais montée nulle part, tri du changelog non-numérique, statut "Command Palette" obsolète sur le roadmap public, route `/og/image` cassée (metadata pointait vers un chemin inexistant), vars Sentry/APP_URL absentes de `.env.example`, layout `(marketing)` orphelin supprimé
- [x] 4 User Stories validées manuellement de bout en bout : US1 (landing, SEO metadata, OG image, robots.txt, sitemap.xml), US2 (changelog + roadmap), US3 (Vercel Analytics confirmé actif), US4 (Sentry configuré + fallback `ErrorBoundary` validé visuellement)
- [x] Mergée vers `main` via PR #9

**Phase C : 23/23 — 100% — ✅ CLÔTURÉE**

---

## Phase D — Rate Limiting, PWA, Webhooks & API, Emails — ✅ COMPLETE (100%)

- [x] Packages installés : resend, @react-email/components, @react-email/render, @ducanh2912/next-pwa
- [x] Migration Prisma : `aiRequestsToday`/`aiRequestsResetAt` sur Workspace, models `APIKey`/`WebhookConfig`, `emailPreferences` sur User
- [x] **Feature 018 — Rate Limiting Dashboard** : quota IA journalier par workspace (DB-backed), 5 endpoints IA branchés, page Settings → AI Quota avec barre de progression
- [x] **Feature 020 — PWA** : manifest.ts, icônes 192/512, `next-pwa` intégré à `next.config.ts` (chaîné avec Sentry), page offline, meta theme-color/apple-touch-icon
- [x] **Feature 017 — Webhooks & API publique** : API Keys (génération/hash/révocation), 4 routes `/api/v1/*` (boards, tasks CRUD), dispatch webhooks HMAC-SHA256, page Settings → Developers, doc publique `/docs/api`
- [x] **Feature 024 — Emails transactionnels** : client Resend, 3 templates (invitation, welcome, task-assigned), envoi invitation + welcome câblés, page unsubscribe
- [x] `pnpm lint` : 0 errors — `pnpm type-check` : 0 errors — `pnpm build` : vert
- [x] Merge de `main` dans la branche : conflits résolus proprement (`next.config.ts`, `package.json`/`pnpm-lock.yaml`, `settings/page.tsx` fusionné en 6 sections, `layout.tsx` metadata SEO + PWA meta, `.env.example`)
- [x] Code review manuelle (CodeRabbit exclu à la demande) : **1 bug critique** — le rate limiter se réinitialisait à chaque requête (comparaison de date sur le timestamp *futur* du reset au lieu de `now >= resetAt`), rendant le quota inopérant — + 4 bugs additionnels : `resend.ts` plantait `next build` si `RESEND_API_KEY` absent (cause du déploiement Vercel cassé), page offline sans `"use client"`, welcome email jamais déclenché (signup-hook non câblé), `PATCH /api/v1/tasks/:id` acceptait un `columnId` cross-board sans validation, page Developers accessible en écriture silencieusement pour les non-admins
- [x] Bug additionnel trouvé en testant US3 : code de tâche non zero-paddé côté API (`AX-2` vs `AX-0001` côté UI) — route re-branchée sur le helper partagé `generateTaskCode()`
- [x] Vars Vercel (Production) ajoutées via CLI : `RESEND_API_KEY`, `RESEND_FROM` (sandbox `onboarding@resend.dev`), `NEXT_PUBLIC_APP_URL` (corrige au passage le bug de domaine tracké depuis Phase C)
- [x] US1 (Rate Limiting) validée manuellement de bout en bout : quota affiché, incrémente correctement (0→1→...), ne se réinitialise plus à chaque requête
- [x] US3 (Webhooks & API) validée manuellement de bout en bout : génération/révocation clé API, GET/POST/PATCH `/api/v1/*`, webhook livré <1s avec signature HMAC vérifiée bit-à-bit, `/docs/api` public
- [x] US2 (PWA) et emails (invitation/welcome) reportés à après déploiement Vercel HTTPS — trackés avec procédure de test détaillée dans `features/rappel.md`
- [x] PR #10 ouverte, mergeable (plus de conflits) — merge vers `main` imminent

**Phase D : 33/33 — 100% — ✅ CLÔTURÉE**

---

## Phase 8 — Polish & Deploy final (0%)
*(projets futurs / backlog)*

## Phase 9 — UX & Motion Design avancé (0%)
*(projets futurs / backlog)*

## Phase 10 — Recruiter-Ready Packaging (0%)
- [ ] README / case study : décisions techniques expliquées (pourquoi Better Auth, pourquoi Groq+Gemini, pourquoi tout-Next.js)
- [ ] Données de démo crédibles + accès démo sans friction (zéro étape cassée au premier clic)
- [ ] Tests Playwright verts + badge CI visible sur le repo
- [ ] Score Lighthouse/Core Web Vitals affiché (README ou landing)
- [ ] Vidéo/GIF démo courte (reasoning stream IA, drag & drop, mobile)
- [ ] Screenshots premium pour portfolio externe (site perso, LinkedIn)

**Phase 10 : 0/6 — 0%**

---

**Progression globale du projet : 129/~149 tâches estimées — ~87%** *(Phases 0-7 + Phase B + Phase C + Phase D clôturées, reste Phases 8-10 — Phase D pas encore mergée vers `main`, PR #10 ouverte et mergeable)*

> Points de suivi post-clôture (non-bloquants, trackés dans `features/rappel.md`) : Vercel Speed Insights non activé (limite plan Hobby), Sentry Auth Token pour source maps non généré, vérification de la capture d'erreur Sentry en production à faire après déploiement, backlog SEO restant (5 pistes — le bug prioritaire `NEXT_PUBLIC_APP_URL` a été corrigé pendant Phase D), PWA à valider sur le déploiement Vercel HTTPS (Feature 020), emails d'invitation/bienvenue à tester en bout-en-bout (Feature 024, quota Resend sandbox).
