---
description: "Task list for Project Setup & Foundation"
---

# Tasks: Project Setup & Foundation

**Input**: Design documents from `/specs/001-project-setup/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Not included. `plan.md`'s Technical Context explicitly defers automated
testing (Playwright) to Phase 3+; this feature's acceptance scenarios are validated
manually via `quickstart.md`, per spec.md which did not request tests.

**Organization**: Tasks are grouped by user story (from `spec.md`) to enable
independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to US1–US5 from `spec.md`
- File paths are exact and match `plan.md`'s Project Structure

## Path Conventions

Single Next.js project at the repository root, per `plan.md`'s Structure Decision:
`src/app/`, `src/lib/`, `src/types/`, `prisma/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the project and its dependencies

- [X] T001 Scaffold a Next.js 16 project (App Router, TypeScript, Tailwind CSS) at the repository root
- [X] T002 Install Prisma 7, Better Auth (+ its Prisma adapter), Pusher (`pusher` server SDK + `pusher-js` client), and Zod as dependencies; configure ESLint/Prettier per the constitution's Clean Code principle
- [X] T003 [P] Create `.env.example` documenting every required variable (`DATABASE_URL`, Better Auth provider secrets, Pusher app id/key/secret/cluster, `GROQ_API_KEY`, `GEMINI_API_KEY`) and confirm `.env.local` / `.env*.local` are listed in `.gitignore`

**Checkpoint**: Project scaffold exists, dependencies installed, no secrets can accidentally be committed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The database and Prisma layer that User Stories 2 and 3 both build on

**⚠️ CRITICAL**: T004–T008 must be complete before US2 or US3 work begins

- [ ] T004 Provision a Vercel Postgres database and obtain its `DATABASE_URL`
- [X] T005 Initialize Prisma (`prisma init`) and author `prisma/schema.prisma` with every entity from `data-model.md` (User, Account, Session, Verification, Workspace, WorkspaceMember, Invitation, Board, Column, Task, TaskAssignee, Label, TaskLabel, Comment, ActivityEvent, Sprint, AILog, Notification) plus all enums (role, priority, template, status, etc.)
- [ ] T006 Run the first migration locally (`prisma migrate dev --name init`) against `DATABASE_URL`
- [X] T007 [P] Create a Prisma client singleton in `src/lib/prisma.ts`
- [X] T008 [P] Establish the shared-types convention required by the constitution's TypeScript Strict Mode principle: create `src/types/` and an initial `src/types/auth.types.ts`

**Checkpoint**: Schema exists and migrates cleanly; US2 and US3 can now proceed.

---

## Phase 3: User Story 1 - Working local development environment (Priority: P1) 🎯 MVP

**Goal**: A developer can boot the app locally and produce a clean production build.

**Independent Test**: `pnpm install && pnpm dev` renders a page with no console errors; `pnpm build` exits 0.

### Implementation for User Story 1

- [X] T009 [US1] Create the root layout in `src/app/layout.tsx` (global styles import, base HTML structure)
- [X] T010 [P] [US1] Create a minimal home page in `src/app/page.tsx`
- [X] T011 [US1] Run `pnpm dev` and `pnpm build`; resolve any error so both succeed per `quickstart.md` US1

**Checkpoint**: Local dev and production build both succeed — SC-001 met.

---

## Phase 4: User Story 2 - Persisted data foundation (Priority: P2)

**Goal**: The database schema exactly matches the product data model, locally and in production.

**Independent Test**: Run the migration and query the schema in both environments; every `data-model.md` entity must exist.

### Implementation for User Story 2

- [ ] T012 [US2] Apply the migration to the production `DATABASE_URL` and confirm connectivity from a deployed (or deployed-equivalent) context
- [ ] T013 [US2] Verify via `prisma studio` (or an equivalent query) that every entity in `data-model.md` exists with none missing or extraneous; record the result per `quickstart.md` US2

**Checkpoint**: Schema completeness and dual-environment connectivity confirmed — SC-002 met.

---

## Phase 5: User Story 3 - Frictionless account creation (Priority: P3)

**Goal**: A user can sign up via Google, GitHub, or email/password with zero email-verification friction, and duplicate-email sign-ups across methods are blocked.

**Independent Test**: Sign up through each of the three methods and confirm an authenticated session with no verification step; attempt a duplicate-email sign-up via a different method and confirm it is blocked per `contracts/auth-conflict.md`.

### Implementation for User Story 3

- [X] T014 [US3] Configure the Better Auth server instance in `src/lib/auth.ts` (Prisma adapter; Google, GitHub, and credentials providers; email verification explicitly disabled)
- [X] T015 [P] [US3] Create the Better Auth client in `src/lib/auth-client.ts`
- [X] T016 [US3] Create the Better Auth route handler at `src/app/api/auth/[...all]/route.ts`
- [X] T017 [US3] Implement the duplicate-email conflict check from `contracts/auth-conflict.md` (query for an existing `Account` by email across providers before creation; return the `409 EMAIL_ALREADY_LINKED` contract when found)
- [X] T018 [P] [US3] Create Zod validation schemas for the credentials sign-up/sign-in forms in `src/lib/validations/auth.ts`
- [X] T019 [US3] Build the login screen in `src/app/(auth)/login/page.tsx` reusing the approved design
- [X] T020 [US3] Build the sign-up screen in `src/app/(auth)/sign-up/page.tsx`, reusing the exported design from `axiom-design/axiom_sign_up/code.html`, including the inline conflict-error state defined in `contracts/auth-conflict.md`
- [X] T021 [US3] Wire the Google/GitHub OAuth buttons and the credentials form on both screens to the Better Auth client
- [ ] T022 [US3] Manually validate all four acceptance scenarios (Google, GitHub, credentials, duplicate-email block) per `quickstart.md` US3

**Checkpoint**: Account creation works frictionlessly through all three methods, and the security-critical duplicate-email block from FR-011 is enforced — SC-003 met.

---

## Phase 6: User Story 4 - Validated realtime channel (Priority: P4)

**Goal**: Prove the Pusher integration works end-to-end before Phase 4 (realtime board updates) depends on it.

**Independent Test**: Publish on the `setup-test` channel and confirm a subscribed client receives it in under 1 second.

### Implementation for User Story 4

- [X] T023 [P] [US4] Configure the Pusher server client in `src/lib/pusher.ts`
- [X] T024 [P] [US4] Configure a Pusher browser client helper in `src/lib/pusher-client.ts`
- [ ] T025 [US4] Implement the temporary `setup-test` / `ping` publish trigger per `contracts/realtime-test-channel.md`
- [ ] T026 [US4] Manually validate that a subscribed client receives the `ping` event in under 1 second per `quickstart.md` US4
- [ ] T027 [US4] Remove the temporary publish trigger once validated, keeping the reusable `src/lib/pusher.ts` / `pusher-client.ts` helpers

**Checkpoint**: Realtime round-trip proven under 1 second — SC-004 met.

---

## Phase 7: User Story 5 - Live production environment (Priority: P5)

**Goal**: The project is publicly reachable on Vercel immediately after setup.

**Independent Test**: Visit the production URL from outside the local network; the login/sign-up screen renders.

### Implementation for User Story 5

- [ ] T028 [US5] Link the Vercel project to the Git repository
- [ ] T029 [US5] Mirror every variable from `.env.local` into Vercel's project environment settings
- [ ] T030 [US5] Deploy to Vercel and confirm the production URL is publicly reachable, rendering at minimum the functional login/sign-up screen
- [ ] T031 [US5] Run a secrets scan across the full repository history before the first public push, confirming zero secret values are committed (FR-007)
- [ ] T032 [US5] Manually validate WCAG AA (full keyboard navigation, 4.5:1 text contrast) on the deployed sign-up screen per `quickstart.md`'s accessibility check

**Checkpoint**: Public production URL live and secret-free — SC-005 and SC-006 met.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Close out the constitution's Quality Gates before this feature is considered done

- [ ] T033 [P] Remove dead code and stray `console.log` calls introduced across this feature (constitution Clean Code principle)
- [ ] T034 Run `pnpm lint` and `pnpm type-check`; resolve every reported issue
- [ ] T035 Run a final `pnpm build` to confirm a clean, zero-error production build before push (constitution Pre-Push Build Verification gate)
- [ ] T036 Update `PROGRESS.md`'s Phase 2 checklist and overall progress percentage to reflect this feature's completion (constitution Progress Documentation principle — apply once this branch merges)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS User Stories 2 and 3
- **User Story 1 (Phase 3)**: Depends only on Setup — can start in parallel with Phase 2
- **User Story 2 (Phase 4)**: Depends on Foundational
- **User Story 3 (Phase 5)**: Depends on Foundational
- **User Story 4 (Phase 6)**: Depends only on Setup (Pusher is independent of the database) — can start in parallel with Phase 2/4/5
- **User Story 5 (Phase 7)**: Depends on User Stories 1–4 being deployable (it packages and ships everything else); practically last, though it has no *technical* dependency on their internals beyond "the app builds"
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories
- **US2 (P2)**: No dependency on other stories (shares the Foundational schema with US3, not with US3's logic)
- **US3 (P3)**: No dependency on other stories (shares the Foundational schema with US2)
- **US4 (P4)**: No dependency on other stories
- **US5 (P5)**: Integrates the output of US1–US4 for deployment, but adds no new logic of its own

### Parallel Opportunities

- T003 can run in parallel with the rest of Setup once T001/T002 land
- T007 and T008 (Phase 2) can run in parallel once T006 lands
- **US1 (Phase 3) and US4 (Phase 6) can be built in parallel with Phase 2/US2/US3** — neither touches the database
- Within US3: T015 and T018 are parallel-safe
- Within US4: T023 and T024 are parallel-safe

---

## Parallel Example: Foundational + User Story 1 + User Story 4

```bash
# Once Setup (Phase 1) is done, these can proceed at the same time:
Task: "Provision Vercel Postgres, author prisma/schema.prisma, run first migration (T004-T006)"
Task: "Create root layout and home page for User Story 1 (T009-T010)"
Task: "Configure Pusher server + client helpers for User Story 4 (T023-T024)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: `pnpm dev` and `pnpm build` both succeed
4. This alone is enough to open the repository and show a live, buildable Next.js project

### Incremental Delivery

1. Setup → User Story 1 → validate (buildable app)
2. Foundational → User Story 2 → validate (schema matches data model)
3. User Story 3 → validate (frictionless, conflict-safe auth)
4. User Story 4 → validate (realtime round-trip under 1s)
5. User Story 5 → validate (public URL live) — this is the story that actually satisfies the feature's stated goal of a continuously live environment, so treat it as the true finish line even though it is P5

---

## Notes

- No `[Story]` label on Setup, Foundational, or Polish tasks — only User Story phases carry one
- Per the constitution's Commit Granularity rule, each task above needs at least one dedicated commit before the next task begins, formatted `feat: [T0XX] description`
- Per the constitution's Feature Branch Discipline rule, none of these tasks should be started until `feat-project-setup` exists and the `feat: prepare-spec-project-setup` commit (containing `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, and this `tasks.md`) is the first commit on that branch
- Verify each checkpoint before moving to the next phase
