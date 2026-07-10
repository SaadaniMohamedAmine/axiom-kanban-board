# Implementation Plan: Core Kanban

**Branch**: `feat-core-kanban` (created before `/speckit-specify`, per Constitution
§III) | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-core-kanban/spec.md`

## Summary

Build the product's core loop on top of the Feature 001 foundation (auth, full
Prisma schema, design tokens): Workspace/Board/Column/Task CRUD, a `@dnd-kit/core`
board with optimistic drag & drop and clean failure rollback, a rich task detail
modal (fields, assignees, labels, comments, activity history), Sprint planning, and
workspace-role permission enforcement verified server-side on every mutation. UI is
converted from the existing `axiom-design/` Stitch exports where one exists (board,
task modal, empty state, workspace onboarding, team management); the task detail's
metadata panel, board/column management controls, and sprint UI — none of which have
an export — are built directly from `axiom-design/axiom/DESIGN.md`'s token system.
The schema gains five small additions (task counter, required task code, invitation
expiry, activity actor, task-sprint link) rather than new entities — everything this
feature needs was already modeled in Feature 001's up-front schema.

## Technical Context

**Language/Version**: TypeScript on Next.js 16 (App Router), continuing Feature 001

**Primary Dependencies**: Next.js 16, Tailwind CSS, Prisma ORM 7, Zod (existing);
**new to this feature**: `@dnd-kit/core` (+ `@dnd-kit/sortable`, `@dnd-kit/utilities`)
for drag & drop, Framer Motion for transitions — both already declared as the
project's chosen stack in `TECH-STACK.md` but not yet installed since Feature 001
had no UI to animate/drag

**Storage**: PostgreSQL via Prisma 7 (existing connection/adapter from Feature 001);
this feature adds one migration for the five field additions in `data-model.md`
(`Board.taskCounter`, `Task.code` required, `Task.sprintId`, `Invitation.expiresAt`,
`ActivityEvent.actorId`) — no new tables, every entity already exists

**Testing**: No automated test suite is introduced for this feature (unchanged from
Feature 001's decision) — acceptance scenarios are validated manually via
`quickstart.md`, gated by `pnpm build`/`lint`/`type-check` per Constitution §IV.
Playwright remains the project's standard e2e tool per `TECH-STACK.md`, to be
introduced starting the phase that most benefits from regression coverage —
revisit that decision if this feature's manual QA surface (drag & drop, permission
matrix, concurrent creation) proves too large to re-validate by hand each change.

**Target Platform**: Vercel (serverless Next.js hosting), same production
environment as Feature 001 — no new environment

**Project Type**: Web application — single Next.js project, unchanged from Feature
001 (no separate backend service)

**Performance Goals**: Drag/reorder visual feedback in <100ms regardless of server
round-trip (SC-002); 0% task-code collisions under 10 concurrent creations on one
board (SC-003)

**Constraints**: Server-side role check on every mutation, independent of client UI
(FR-011, FR-012 — Constitution §V); every task/board/column/sprint query scoped
through its owning workspace (Constitution §V's `workspaceId` scoping rule — this
feature is where that rule first has real queries to apply to); no raw SQL — task
counter uses Prisma's atomic `increment`, not hand-written SQL (research.md §1);
WCAG AA carried forward from Feature 001 (full keyboard operability, 4.5:1 contrast)
now applies to interactive surfaces with materially higher complexity than a login
form — drag & drop needs a keyboard-operable fallback (`@dnd-kit/core` ships
built-in keyboard sensor support, used rather than a custom implementation)

**Scale/Scope**: Single developer, single environment, portfolio-scale traffic —
same as Feature 001; concurrency targets (SC-003) are about correctness under
simultaneous requests, not high-throughput scale

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Clean Code | No dead code / `console.log` / magic strings in delivered code | ✅ Enforced at implementation/review time; nothing in this plan conflicts |
| II. TypeScript Strict Mode | Strict `tsconfig.json`, no untyped `any`, shared types in `*.types.ts` | ✅ Continues Feature 001's convention — task/board/column/sprint types added to `src/types/*.types.ts` |
| III. Feature Branch Discipline | `feat-<name>` branch MUST exist **before any speckit step** | ✅ `feat-core-kanban` created before `/speckit-specify` ran (unlike Feature 001, which had to remediate this after the fact) |
| IV. Pre-Push Build Verification | `pnpm build`/`lint`/`type-check` pass before push | ✅ Not yet applicable (nothing pushed) — will gate the first push |
| V. Security & Scope Integrity | No secrets committed; Prisma-only queries; server-side permission checks; `workspaceId` scoping | ✅ `contracts/permission-enforcement.md` defines the single `requireRole` guard used by every mutation; `contracts/task-code-generation.md` uses Prisma's atomic `increment`, not raw SQL; every Board/Column/Task/Sprint query filters through its `workspaceId` (directly or via its parent `Board`) |
| VI. Progress Documentation | `PROGRESS.md` updated after merge | ⏳ Deferred to post-merge, tracked as a task |

**Gate result**: All gates pass. No violations to justify — Complexity Tracking below
is empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-core-kanban/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/             # Phase 1 output
│   ├── permission-enforcement.md
│   ├── task-code-generation.md
│   ├── task-move-optimistic-ui.md
│   ├── task-detail-activity.md
│   └── invitation-lifecycle.md
├── checklists/
│   └── requirements.md
└── tasks.md               # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/                          # existing (Feature 001)
│   ├── (app)/
│   │   ├── workspaces/
│   │   │   └── new/page.tsx             # axiom_onboarding_workspace_name_export conversion
│   │   ├── [workspaceSlug]/
│   │   │   ├── settings/
│   │   │   │   └── members/page.tsx     # axiom_team_management conversion — invite/roles
│   │   │   └── boards/
│   │   │       └── [boardId]/
│   │   │           └── page.tsx         # axiom_main_kanban_board_export conversion
│   │   └── layout.tsx                    # sidebar/topnav shell shared across (app)
│   └── api/
│       └── auth/[...all]/route.ts        # existing (Feature 001)
├── components/
│   ├── board/
│   │   ├── board-view.tsx                # column layout, dnd-kit context
│   │   ├── column.tsx
│   │   ├── task-card.tsx
│   │   └── empty-board-state.tsx         # axiom_empty_board_state conversion
│   ├── task-detail/
│   │   ├── task-detail-modal.tsx         # axiom_task_detail_modal_export conversion (left column)
│   │   ├── task-properties-panel.tsx     # NEW — no export exists; built from DESIGN.md tokens
│   │   ├── activity-list.tsx
│   │   └── comment-thread.tsx
│   ├── workspace/
│   │   ├── workspace-form.tsx
│   │   └── member-list.tsx               # axiom_team_management conversion
│   ├── board-admin/
│   │   ├── board-create-modal.tsx        # NEW — no export exists
│   │   └── column-manager.tsx            # NEW — no export exists
│   └── sprint/
│       └── sprint-panel.tsx              # NEW — no export exists
├── lib/
│   ├── actions/
│   │   ├── workspace.actions.ts          # create/rename/delete workspace, invite/accept
│   │   ├── board.actions.ts              # board + column CRUD
│   │   ├── task.actions.ts               # task CRUD, moveTask, assignees, labels
│   │   ├── comment.actions.ts
│   │   └── sprint.actions.ts
│   ├── permissions.ts                    # requireRole() guard (contracts/permission-enforcement.md)
│   ├── task-code.ts                      # atomic counter → AX-XXXX (contracts/task-code-generation.md)
│   ├── task-order.ts                     # gap-stepped order math (research.md §3)
│   ├── prisma.ts                         # existing (Feature 001)
│   └── validations/
│       ├── workspace.schema.ts
│       ├── board.schema.ts
│       ├── task.schema.ts
│       └── sprint.schema.ts
└── types/
    ├── workspace.types.ts
    ├── board.types.ts
    ├── task.types.ts
    └── sprint.types.ts

prisma/
├── schema.prisma                          # existing, extended per data-model.md
└── migrations/                            # new migration for the 5 field additions
```

**Structure Decision**: Continues Feature 001's single Next.js project (App Router).
Route groups split `(auth)` (existing) from a new `(app)` group holding every
authenticated, workspace-scoped screen this feature introduces. Server Actions are
grouped by entity under `lib/actions/`, each importing the shared `requireRole`
guard — this is the concrete realization of `contracts/permission-enforcement.md`'s
"single guard used everywhere" decision. Components are grouped by feature area
(`board/`, `task-detail/`, `workspace/`, `board-admin/`, `sprint/`) rather than by
design-export origin, since three of those areas (`task-properties-panel`,
`board-admin/*`, `sprint/*`) have no export to mirror 1:1 and are built from
`DESIGN.md` tokens directly (research.md §10).

## Complexity Tracking

*No entries — Constitution Check reported zero violations.*
