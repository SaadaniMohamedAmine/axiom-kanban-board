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
## Phase 5 — AI Features / Axiom Intelligence (0%)
## Phase 6 — Analytics & Sprints (0%)
## Phase 7 — Responsive Mobile Design (0%)
- [ ] Breakpoints définis (mobile/tablette/desktop) sur le design system
- [ ] Navigation mobile (menu, switch workspace/board adapté petit écran)
- [ ] Board Kanban responsive (colonnes en scroll horizontal ou vue liste mobile)
- [ ] Drag & drop tactile (touch) + alternative "Move to..." sur mobile
- [ ] Task detail modal en plein écran sur mobile
- [ ] Command palette adaptée mobile
- [ ] Audit perf/Core Web Vitals sur mobile (réseau lent inclus)

**Phase 7 : 0/7 — 0%**

## Phase 8 — Polish & Deploy final (0%)
*(le projet est déjà live sur Vercel depuis la Phase 2 — cette phase couvre la mise en prod finale, le polish, et la revue de lancement)*

## Phase 9 — UX & Motion Design avancé (0%)
- [ ] Audit heuristique UX complet (parcours bout en bout, friction points)
- [ ] Micro-interactions avancées (hover, focus, états de chargement)
- [ ] Transitions entre écrans/pages cohérentes (Framer Motion, courbes d'easing de marque)
- [ ] Skeletons/loaders premium (jamais de spinner générique)
- [ ] Feedback visuel sur actions clés (drag&drop, suggestion IA appliquée, sauvegarde)
- [ ] Cohérence motion desktop ↔ mobile
- [ ] Revue finale "feel" par un regard UX externe (ou check-list expert UX)

**Phase 9 : 0/7 — 0%**

## Phase 10 — Recruiter-Ready Packaging (0%)
- [ ] README / case study : décisions techniques expliquées (pourquoi Better Auth, pourquoi Groq+Gemini, pourquoi tout-Next.js)
- [ ] Données de démo crédibles + accès démo sans friction (zéro étape cassée au premier clic)
- [ ] Tests Playwright verts + badge CI visible sur le repo
- [ ] Score Lighthouse/Core Web Vitals affiché (README ou landing)
- [ ] Vidéo/GIF démo courte (reasoning stream IA, drag & drop, mobile)
- [ ] Screenshots premium pour portfolio externe (site perso, LinkedIn)

**Phase 10 : 0/6 — 0%**

---

**Progression globale du projet : 12/~60 tâches estimées — ~20%** *(estimation grossière, à raffiner une fois Speckit aura généré le détail des phases 3-10)*
