# Tasks: Core Kanban

**Input**: Design documents from `/specs/002-core-kanban/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Not requested in `spec.md` (Feature 001 already decided no automated suite
for this stage of the project — see `plan.md` Technical Context). Every story's
verification instead comes from `quickstart.md` plus the manual bypass-the-UI checks
in User Story 4.

**Organization**: Tasks are grouped by user story (priority order from `spec.md`) so
each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to spec.md's US1–US5
- Every task names its exact file path

## Path Conventions

Single Next.js project, per `plan.md`'s Project Structure — `src/app`, `src/components`,
`src/lib`, `src/types`, `prisma/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Get the project ready to build any of this feature's stories.

- [ ] T001 Install `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, and `framer-motion` (add to `package.json`, `pnpm install`) — both already declared as the chosen stack in `TECH-STACK.md`, not yet installed
- [ ] T002 Apply the five schema additions from `data-model.md` to `prisma/schema.prisma` (`Board.taskCounter`, `Task.code` → required, `Task.sprintId` + relation, `Invitation.expiresAt`, `ActivityEvent.actorId` + relation), then run `pnpm prisma migrate dev --name core-kanban-fields`
- [ ] T003 [P] Normalize the Tailwind theme (`tailwind.config.ts` / global CSS) to `axiom-design/axiom/DESIGN.md`'s canonical tokens (Level 0/1/2 surfaces, `#3B82F6` primary, AI violet/cyan accents, 8px grid, shape radii), reconciling the two conflicting conventions used across the Stitch exports (research.md §10)
- [ ] T004 [P] Scaffold the authenticated route group shell in `src/app/(app)/layout.tsx` (sidebar/topnav container per `axiom_main_kanban_board_export`) and empty placeholder routes `src/app/(app)/workspaces/new/page.tsx`, `src/app/(app)/[workspaceSlug]/boards/[boardId]/page.tsx`, `src/app/(app)/[workspaceSlug]/settings/members/page.tsx`

**Checkpoint**: Dependencies installed, schema migrated, route shell exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure every user story's Server Actions depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Implement `requireRole(workspaceId, minRole)` in `src/lib/permissions.ts` per `contracts/permission-enforcement.md` (session lookup, `WorkspaceMember.role` check, `PermissionError` with `INSUFFICIENT_ROLE`) — depends on T002
- [ ] T006 [P] Implement the gap-stepped order helper in `src/lib/task-order.ts` (midpoint-between-neighbors, renumber-on-collapse) per `research.md` §3
- [ ] T007 [P] Implement the atomic task-code helper in `src/lib/task-code.ts` using Prisma's `board.update({ data: { taskCounter: { increment: 1 } } })` per `contracts/task-code-generation.md` — depends on T002
- [ ] T008 [P] Create shared types `src/types/workspace.types.ts`, `src/types/board.types.ts`, `src/types/task.types.ts`, `src/types/sprint.types.ts`
- [ ] T009 [P] Create Zod validation schemas `src/lib/validations/workspace.schema.ts`, `src/lib/validations/board.schema.ts`, `src/lib/validations/task.schema.ts`, `src/lib/validations/sprint.schema.ts`
- [ ] T010 Create `prisma/seed.ts` generating one demo workspace + one `KANBAN`-template board + 2–3 columns, so User Story 1 (and 2, 5) can be built and independently tested before User Story 3's own creation UI exists — depends on T002

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Fluid task board interaction (Priority: P1) 🎯 MVP

**Goal**: Create, drag-and-drop move/reorder, and delete tasks on a board, with
instant optimistic UI and a clean rollback on failure, and collision-free task codes
under concurrent creation.

**Independent Test**: Using the seeded board from T010, create a task, drag it
between columns, reorder it within a column, delete it — all reflected immediately;
throttle the network and confirm a failed drag rolls back cleanly.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Implement `createTask` Server Action in `src/lib/actions/task.actions.ts` (`requireRole(workspaceId, 'MEMBER')`, uses `task-code.ts` + `task-order.ts`) per `contracts/task-code-generation.md` — depends on T005, T006, T007
- [ ] T012 [US1] Implement `moveTask` Server Action in `src/lib/actions/task.actions.ts` per `contracts/task-move-optimistic-ui.md` (gap-stepped reorder, `STATUS_CHANGE` activity event only on column change) — depends on T011 (same file)
- [ ] T013 [US1] Implement `deleteTask` Server Action in `src/lib/actions/task.actions.ts` — depends on T011 (same file)
- [ ] T014 [P] [US1] Build `TaskCard` in `src/components/board/task-card.tsx` (convert the card markup from `axiom-design/axiom_main_kanban_board_export/code.html`)
- [ ] T015 [P] [US1] Build `Column` in `src/components/board/column.tsx` using `@dnd-kit/sortable`'s `SortableContext`/`useSortable` (convert column markup from the same export)
- [ ] T016 [US1] Build `BoardView` in `src/components/board/board-view.tsx` wiring `DndContext`, `onDragEnd` → `moveTask`, and `useOptimistic` for instant position updates with rollback on failure — depends on T012, T014, T015
- [ ] T017 [P] [US1] Build `EmptyBoardState` in `src/components/board/empty-board-state.tsx` (convert `axiom-design/axiom_empty_board_state/code.html`)
- [ ] T018 [US1] Wire `src/app/(app)/[workspaceSlug]/boards/[boardId]/page.tsx` to fetch the board/columns/tasks (scoped through `workspaceId`) and render `BoardView` or `EmptyBoardState` — depends on T016, T017
- [ ] T019 [US1] Add the "New Task" quick-create control (sidebar button + per-column add) calling `createTask` in `src/app/(app)/[workspaceSlug]/boards/[boardId]/page.tsx` — depends on T011, T018

**Checkpoint**: User Story 1 fully functional and independently testable against the seeded board.

---

## Phase 4: User Story 2 - Rich task detail (Priority: P2)

**Goal**: Full task detail view/edit (description, assignees, labels, comments,
priority, estimate, due date) plus accurate activity history, with zero page reloads.

**Independent Test**: Open a task from the US1 board, edit every field, assign/unassign
a member, add/remove a label, post a comment, and confirm the activity history lists
every change correctly attributed and ordered.

### Implementation for User Story 2

- [ ] T020 [US2] Implement `updateTaskFields` Server Action in `src/lib/actions/task.actions.ts` (title/description/priority/estimate/dueDate, writes a `STATUS_CHANGE` `ActivityEvent` per changed field) per `contracts/task-detail-activity.md` — depends on T011 (same file)
- [ ] T021 [US2] Implement `setTaskAssignees` Server Action in `src/lib/actions/task.actions.ts` (writes an `ASSIGNED` `ActivityEvent`) — depends on T020 (same file)
- [ ] T022 [US2] Implement `setTaskLabels` Server Action in `src/lib/actions/task.actions.ts` — depends on T020 (same file)
- [ ] T023 [P] [US2] Implement `addComment` Server Action in `src/lib/actions/comment.actions.ts` (writes a `COMMENTED` `ActivityEvent`) per `contracts/task-detail-activity.md` — depends on T005
- [ ] T024 [P] [US2] Build the `TaskDetailModal` shell (header, Description/Activity/Comments left column) in `src/components/task-detail/task-detail-modal.tsx` (convert `axiom-design/axiom_task_detail_modal_export/code.html`)
- [ ] T025 [P] [US2] Build `TaskPropertiesPanel` (assignees, labels, priority, estimate, due date) in `src/components/task-detail/task-properties-panel.tsx` — NEW, no export exists for this surface (the export's right column is AI-only, out of scope); build from `DESIGN.md` tokens per `research.md` §10
- [ ] T026 [P] [US2] Build `ActivityList` in `src/components/task-detail/activity-list.tsx` (actor name via `actorId`, human-readable description from `type`/`payload`, relative timestamp)
- [ ] T027 [P] [US2] Build `CommentThread` in `src/components/task-detail/comment-thread.tsx`
- [ ] T028 [US2] Wire task-card click to open `TaskDetailModal` (client modal state, no route/page reload) from `src/components/board/board-view.tsx`, composing `TaskPropertiesPanel`, `ActivityList`, `CommentThread` — depends on T016, T024, T025, T026, T027
- [ ] T029 [US2] Add the Markdown formatting toolbar (bold/italic/list/link) and renderer for the description field inside `src/components/task-detail/task-properties-panel.tsx` per `research.md` §5 — depends on T020, T025

**Checkpoint**: User Stories 1 and 2 both independently functional.

---

## Phase 5: User Story 3 - Workspace and board setup (Priority: P3)

**Goal**: Create a workspace, invite members with roles, create a board from a
template, and manage its columns — the real onboarding path (replacing the seed
script from Phase 2 for actual users).

**Independent Test**: As a new user, create a workspace, invite a collaborator by
email with a role, accept the invite as that collaborator, create a board from a
template, and add/rename/reorder/recolor a column.

### Implementation for User Story 3

- [ ] T030 [P] [US3] Implement `createWorkspace`, `renameWorkspace`, `deleteWorkspace` (OWNER-only) Server Actions in `src/lib/actions/workspace.actions.ts` (slug generation on create) — depends on T005
- [ ] T031 [US3] Implement `inviteMember` (ADMIN-minimum) and `acceptInvitation` Server Actions in `src/lib/actions/workspace.actions.ts` per `contracts/invitation-lifecycle.md` (duplicate-member/duplicate-invite checks, `expiresAt` = +7 days, lazy expiry on accept) — depends on T030 (same file)
- [ ] T032 [P] [US3] Implement `createBoard` Server Action (template-driven default columns) in `src/lib/actions/board.actions.ts` — depends on T005
- [ ] T033 [US3] Implement `createColumn`, `renameColumn`, `reorderColumn`, `recolorColumn`, `deleteColumn` (blocked while non-empty) Server Actions in `src/lib/actions/board.actions.ts` — depends on T032 (same file), T006
- [ ] T034 [P] [US3] Build `WorkspaceForm` in `src/components/workspace/workspace-form.tsx` (convert `axiom-design/axiom_onboarding_workspace_name_export/code.html`) and wire `src/app/(app)/workspaces/new/page.tsx` — depends on T030
- [ ] T035 [P] [US3] Build `MemberList` + invite form in `src/components/workspace/member-list.tsx` (convert `axiom-design/axiom_team_management/code.html`) and wire `src/app/(app)/[workspaceSlug]/settings/members/page.tsx` — depends on T031
- [ ] T036 [P] [US3] Build `BoardCreateModal` in `src/components/board-admin/board-create-modal.tsx` — NEW, no export exists; build from `DESIGN.md` tokens — depends on T032
- [ ] T037 [US3] Build `ColumnManager` controls (add/rename/reorder/recolor/delete) in `src/components/board-admin/column-manager.tsx` — NEW, no export exists — depends on T033
- [ ] T038 [US3] Wire the sidebar's "Workspace"/"Boards" navigation in `src/app/(app)/layout.tsx` to real workspace/board data (replacing static seed-only links) — depends on T030, T032

**Checkpoint**: User Stories 1–3 independently functional — real end-to-end onboarding now works without the seed script.

---

## Phase 6: User Story 4 - Role-based permission enforcement (Priority: P4)

**Goal**: A `VIEWER` can read everything but mutate nothing, verifiably server-side —
not just UI-hidden.

**Independent Test**: As a `VIEWER`, confirm every mutating UI control is
absent/disabled, then call the underlying Server Actions directly (bypassing the UI)
and confirm each is rejected with `INSUFFICIENT_ROLE`.

### Implementation for User Story 4

- [ ] T039 [US4] Add role-conditional rendering (hide/disable create/edit/move/delete controls for `VIEWER`) across `src/components/board/board-view.tsx`, `src/components/board/task-card.tsx`, `src/components/task-detail/task-detail-modal.tsx`, `src/components/task-detail/task-properties-panel.tsx`, `src/components/workspace/member-list.tsx`, `src/components/board-admin/board-create-modal.tsx`, `src/components/board-admin/column-manager.tsx` — depends on T016, T028, T035, T036, T037
- [ ] T040 [P] [US4] Extend `src/lib/actions/workspace.actions.ts` so `deleteWorkspace` requires `OWNER` and member-role changes require `ADMIN` (verify/tighten beyond the base `MEMBER` guard already used elsewhere) per `contracts/permission-enforcement.md`'s role table — depends on T031
- [ ] T041 [US4] Execute the `quickstart.md` User Story 4 checklist: as a `VIEWER`, invoke `createTask`, `moveTask`, `renameWorkspace`, and `inviteMember` directly (bypassing the UI) and confirm every one is rejected — depends on T039, T040

**Checkpoint**: User Stories 1–4 independently functional; permission boundary verified both in UI and server-side.

---

## Phase 7: User Story 5 - Sprint planning (Priority: P5)

**Goal**: Create sprints on a board, attach tasks to them, and move a sprint through
its lifecycle.

**Independent Test**: On a board, create a sprint with a valid date range, attach two
tasks, and step its status `PLANNED` → `ACTIVE` → `COMPLETED`; confirm an invalid
date range (`endDate < startDate`) is rejected.

### Implementation for User Story 5

- [ ] T042 [P] [US5] Implement `createSprint`, `updateSprint`, `deleteSprint` Server Actions in `src/lib/actions/sprint.actions.ts` (reject `endDate < startDate` per FR-014) — depends on T005
- [ ] T043 [US5] Implement `attachTaskToSprint`, `detachTaskFromSprint` Server Actions in `src/lib/actions/sprint.actions.ts` (sets/clears `Task.sprintId`) — depends on T042 (same file)
- [ ] T044 [US5] Build `SprintPanel` (create/list sprints, status transitions, task attach/detach) in `src/components/sprint/sprint-panel.tsx` — NEW, no export exists; build from `DESIGN.md` tokens — depends on T042, T043
- [ ] T045 [US5] Wire `SprintPanel` into `src/app/(app)/[workspaceSlug]/boards/[boardId]/page.tsx` for `SCRUM`-template boards — depends on T044, T018

**Checkpoint**: All five user stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final gates before this feature is considered done.

- [ ] T046 [P] Audit every Server Action across `src/lib/actions/*.ts` (including `sprint.actions.ts`) against `contracts/permission-enforcement.md`'s role table — no mutation left unguarded
- [ ] T047 [P] Verify keyboard-operable drag & drop (`@dnd-kit/core`'s `KeyboardSensor`) and WCAG AA contrast (4.5:1) across every new screen, carrying forward Feature 001's accessibility bar
- [ ] T048 Run `pnpm build`, `pnpm lint`, `pnpm type-check` and fix any failures — depends on T001–T045 (Constitution §IV gate, blocking before push)
- [ ] T049 Execute the full `quickstart.md` walkthrough (all five user stories + edge cases) and record results — depends on T048
- [ ] T050 Update `PROGRESS.md` marking Phase 3 (Core Kanban) complete — Constitution §VI, performed after merge to `main`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends only on Foundational (uses the T010 seed board)
- **User Story 2 (Phase 4)**: Depends on Foundational; reuses US1's `task.actions.ts` and `BoardView` (T011, T016) — sequenced after US1 here, but its own Server Actions/components are additive, not blocking, so a second developer could start Phase 4 in parallel once T011 and T016 land
- **User Story 3 (Phase 5)**: Depends only on Foundational — independent of US1/US2's files (different action/component files); sequenced third here because it's the lower business priority (P3), not because of a technical dependency
- **User Story 4 (Phase 6)**: Depends on US1, US2, and US3's components/actions existing (it adds role-conditional UI on top of them and tightens two of US3's actions) — must come after Phases 3–5
- **User Story 5 (Phase 7)**: Depends only on Foundational and, for wiring, on US1's board page (T018) — otherwise independent
- **Polish (Phase 8)**: Depends on every user story that will ship in this release

### Parallel Opportunities

- Setup: T003, T004 in parallel (T001, T002 are prerequisites for later phases but not blocked by each other)
- Foundational: T006, T007, T008, T009 in parallel once T005 lands (T005 itself has no same-file conflicts, can start immediately after T002)
- Once Foundational completes: US1 (Phase 3), US3 (Phase 5), and US5 (Phase 7) can be staffed in parallel by different developers — only US2 (Phase 4) and US4 (Phase 6) have real dependencies on other stories' files
- Within US1: T014, T015, T017 in parallel; within US2: T023–T027 in parallel; within US3: T030/T032/T034/T035/T036 in parallel

---

## Parallel Example: User Story 1

```bash
# After T005-T007 (Foundational) land:
Task: "Implement createTask Server Action in src/lib/actions/task.actions.ts"

# Once T011 lands, in parallel:
Task: "Build TaskCard in src/components/board/task-card.tsx"
Task: "Build Column in src/components/board/column.tsx"
Task: "Build EmptyBoardState in src/components/board/empty-board-state.tsx"
```

---

## Implementation Strategy

### MVP First

The spec's own P1 (User Story 1) is testable in isolation only against a seeded
board (Phase 2's `prisma/seed.ts`) — that's sufficient to validate the product's
core interaction loop early. For anything demoable to a real person end-to-end
(sign up → create a workspace → see a board), User Story 3 must also ship — so the
practical MVP for a demo is **Setup + Foundational + US1 + US3**.

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1) — validate against the seeded board
3. Complete Phase 5 (US3) — validate the real onboarding path end-to-end
4. **STOP and VALIDATE** both together via `quickstart.md`'s US1/US3 sections
5. Continue with US2 → US4 → US5 in priority order

### Incremental Delivery

1. Setup + Foundational → seeded board exists
2. US1 → drag-and-drop board works (seed-tested) → demo internally
3. US3 → real workspace/board creation → demo externally (MVP)
4. US2 → task detail becomes a full record → demo
5. US4 → permission boundary verified → safe for less-trusted collaborators
6. US5 → sprint planning → demo to Scrum-style teams
7. Polish → build/lint/type-check gate, full quickstart pass, `PROGRESS.md` update

---

## Notes

- No test tasks: `spec.md` did not request them and Feature 001 established manual
  `quickstart.md` validation as this project's current stage-appropriate approach.
- Every mutating Server Action in every phase begins with `requireRole` (T005) —
  Phase 8's T046 is a final audit, not the first time the guard is applied.
- Per Constitution §III, this branch (`feat-core-kanban`) already exists — commit
  `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`,
  `checklists/`, and `tasks.md` together as `feat: prepare-spec-core-kanban` (the
  first commit on this branch) before starting T001.
- Commit after each task, referencing its ID (`feat: [T0XX] ...`), per Constitution
  commit-granularity rules — never bundle multiple tasks into one commit.
