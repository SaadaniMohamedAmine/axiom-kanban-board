# Tasks: Realtime Board Collaboration

**Input**: Design documents from `/specs/003-realtime-sync/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: Not requested in `spec.md` (consistent with Features 001–002's decision —
see `plan.md` Technical Context). Every story's verification comes from
`quickstart.md`'s two-browser scenarios.

**Organization**: Tasks are grouped by user story (priority order from `spec.md`) so
each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to spec.md's US1–US4
- Every task names its exact file path

## Path Conventions

Single Next.js project, per `plan.md`'s Project Structure — `src/app`, `src/components`,
`src/hooks`, `src/lib`, `src/types`, `prisma/`.

---

## Phase 1: Setup

**Purpose**: Give every later task a `Task.updatedAt` to key off and shared types to import.

- [ ] T001 Add `Task.createdAt` (`@default(now())`) and `Task.updatedAt` (`@updatedAt`) to `prisma/schema.prisma` per `data-model.md`, then run `pnpm prisma migrate dev --name task-timestamps`
- [ ] T002 [P] Update the `Task` interface in `src/types/task.types.ts`: make `createdAt: Date` required (it's currently optional, anticipating this) and add `updatedAt: Date` — depends on T001
- [ ] T003 [P] Create `src/types/realtime.types.ts` with `BoardEvent`, `PresenceMember`, `ConflictEvent`, and `ConnectionState` (`"live" | "degraded"`) per `data-model.md`

**Checkpoint**: Timestamp field and shared types exist for everything below to build on.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The channel authorization, broadcast helper, and subscription hook every
user story depends on — none of the four stories can be demonstrated without a
client actually being able to join a board's channel.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Implement `POST /api/pusher/auth` in `src/app/api/pusher/auth/route.ts` per `contracts/pusher-channel-auth.md` (session check via `auth.api.getSession`, parse+validate `presence-board-{boardId}` from `channel_name`, re-derive `Board.workspaceId` → membership check at `VIEWER` minimum, `pusher.authorizeChannel` with `user_info: { id, name, image }`) — depends on T003
- [ ] T005 [P] Implement `triggerBoardEvent(boardId, event, excludeSocketId?)` in `src/lib/realtime.ts` per `contracts/board-event-broadcast.md` (channel-name derivation as the single source of truth, `socket_id` exclusion pass-through, catches/logs Pusher errors without throwing) — depends on T003
- [ ] T006 Implement the base of `useBoardChannel(boardId)` in `src/hooks/use-board-channel.ts`: subscribe/unsubscribe to `presence-board-{boardId}` on mount and `boardId` change via `getPusherClient()`, expose the channel's own `socketId`, and track `connectionState` (`"live" | "degraded"`) from `pusher.connection.bind('state_change', ...)` per `contracts/connection-degradation.md`'s state table — depends on T003, T004
- [ ] T007 [P] Thread the signed-in user as `currentUser: { id, name, image }` from `src/app/(app)/[workspaceSlug]/boards/[boardId]/page.tsx` (already has `session`) through `board-view-with-modal.tsx` into `board-view.tsx`

**Checkpoint**: A client can authenticate and subscribe to its board's channel; the
broadcast helper is ready for every mutation to call.

---

## Phase 3: User Story 1 - Live task synchronization across viewers (Priority: P1) 🎯 MVP

**Goal**: Task and column changes made by one member appear on another member's
board within ~1s, with no flicker on the acting member's own screen.

**Independent Test**: Two browser sessions on the same board; create/move/edit/delete
a task and create/rename/reorder/recolor/delete a column from one session, confirm
each change appears in the other within ~1s and never double-renders in the
originating session.

### Implementation for User Story 1

- [ ] T008 [US1] Extend `createTask`, `moveTask`, `deleteTask`, `updateTaskFields`, `setTaskAssignees`, `setTaskLabels` in `src/lib/actions/task.actions.ts` to accept an optional trailing `socketId?: string` parameter and call `triggerBoardEvent` with the matching event type (`task.created`/`task.moved`/`task.deleted`/`task.updated`) after each successful Prisma write, per `contracts/board-event-broadcast.md`'s mapping table — depends on T005
- [ ] T009 [P] [US1] Extend `createColumn`, `renameColumn`, `reorderColumn`, `recolorColumn`, `deleteColumn` in `src/lib/actions/board.actions.ts` likewise, broadcasting `column.updated` (accepting the same optional `socketId` parameter) — depends on T005
- [ ] T010 [US1] Extend `useBoardChannel` in `src/hooks/use-board-channel.ts` to bind each `BoardEvent` type from `data-model.md` and invoke a caller-supplied `onEvent(event: BoardEvent)` callback — depends on T006
- [ ] T011 [US1] Wire `src/components/board/board-view.tsx` to call `useBoardChannel(board.id)` with an `onEvent` handler that folds incoming `task.created`/`task.updated`/`task.moved`/`task.deleted`/`column.updated` events into the existing `columns` state (the same shape `moveTask`'s optimistic update already writes), and to pass `getPusherClient().connection.socket_id` into its `moveTask` call — depends on T008, T009, T010, T007
- [ ] T012 [US1] Pass `getPusherClient().connection.socket_id` as the trailing argument from `src/app/(app)/[workspaceSlug]/boards/[boardId]/create-task-form.tsx`'s `createTask` call and `src/components/task-detail/task-properties-panel.tsx`'s `updateTaskFields` calls — depends on T008

**Checkpoint**: User Story 1 fully functional and independently testable across two browser sessions.

---

## Phase 4: User Story 2 - Presence awareness (Priority: P2)

**Goal**: A member viewing a board sees which other workspace members currently
have it open, styled per the Axiom avatar system.

**Independent Test**: Open the same board in two sessions; confirm each sees the
other in a presence roster within ~2s, and that closing one session removes it
from the other's roster within ~2s.

### Implementation for User Story 2

- [ ] T013 [US2] Extend `useBoardChannel` to track `members: PresenceMember[]` from the presence channel's initial `members` snapshot plus `pusher:member_added`/`pusher:member_removed` bindings, in `src/hooks/use-board-channel.ts` — depends on T006
- [ ] T014 [P] [US2] Build `PresenceAvatars` in `src/components/realtime/presence-avatars.tsx` — NEW, no export exists; stacked circular geometric-initials avatars (fallback when `image` is null) per `axiom-design/axiom/DESIGN.md`'s avatar rule — depends on T003
- [ ] T015 [US2] Wire `PresenceAvatars` into the board header (`src/app/(app)/[workspaceSlug]/boards/[boardId]/page.tsx` or `board-view-with-modal.tsx`) using `members` from `useBoardChannel` — depends on T013, T014

**Checkpoint**: User Stories 1 and 2 both independently functional.

---

## Phase 5: User Story 3 - Graceful degradation when realtime is unavailable (Priority: P3)

**Goal**: Core board interactions keep working through a Pusher outage; a discreet
indicator appears immediately, and the board falls back to polling after a sustained
disconnect, recovering cleanly.

**Independent Test**: Block the Pusher connection in devtools with the board open;
confirm drag & drop / create / edit / delete keep working, the indicator appears,
polling begins after ~8s, and both clear on reconnect — per `quickstart.md` Scenario 3.

### Implementation for User Story 3

- [ ] T016 [US3] Implement a read-only `getBoardSnapshot(boardId)` Server Action in `src/lib/actions/task.actions.ts`, reusing the same `workspaceId`-scoped columns/tasks query shape as `page.tsx`'s initial load, gated by `requireRole(workspaceId, "VIEWER")`
- [ ] T017 [P] [US3] Build `ConnectionIndicator` in `src/components/realtime/connection-indicator.tsx` — NEW, no export exists; discreet non-blocking pill for `"live" | "degraded"` states, styled per `DESIGN.md` tokens — depends on T003
- [ ] T018 [US3] Add the 8s-unavailability threshold and 5s polling interval to `useBoardChannel` per `contracts/connection-degradation.md`: on entering `"degraded"`, start an 8s timer; if still degraded when it fires, poll `getBoardSnapshot` every 5s and surface results through the same state-replacement path `onEvent` uses; clear the timer/interval and resume normal event flow the instant `connectionState` returns to `"live"` — depends on T006, T016
- [ ] T019 [US3] Wire `ConnectionIndicator` into `board-view.tsx` using `connectionState` from `useBoardChannel`, and confirm drag & drop / create / edit / delete all remain enabled regardless of `connectionState` (no interaction gated on realtime health) — depends on T017, T018, T011

**Checkpoint**: User Stories 1–3 independently functional; board survives a realtime outage.

---

## Phase 6: User Story 4 - Concurrent edit conflict awareness (Priority: P3)

**Goal**: When two members edit the same task field near-simultaneously, the later
write persists and the superseded editor sees a visible conflict indicator — never a
silent loss.

**Independent Test**: Edit the same field on the same task from two sessions within
a few seconds of each other; confirm the later write wins and the earlier editor's
session shows a conflict indicator, per `quickstart.md` Scenario 4.

### Implementation for User Story 4

- [ ] T020 [US4] Add optional `expectedUpdatedAt?: string` to `updateTaskFieldsSchema`/`UpdateTaskFieldsInput` in `src/lib/validations/task.schema.ts` — depends on T001
- [ ] T021 [US4] Extend `updateTaskFields` in `src/lib/actions/task.actions.ts` per `contracts/conflict-detection.md`: when `expectedUpdatedAt` is provided and doesn't match the task's current `updatedAt`, still persist the write, look up the most recent attributable prior `ActivityEvent` for `supersededActorId`, and additionally broadcast a `task.conflict` event alongside the normal `task.updated` broadcast — depends on T008, T020
- [ ] T022 [P] [US4] Build `ConflictBadge` in `src/components/realtime/conflict-badge.tsx` — NEW, no export exists; visible flag rendered on a task card and in the task detail view — depends on T003
- [ ] T023 [US4] Thread `task.updatedAt` as `expectedUpdatedAt` from `src/components/task-detail/task-properties-panel.tsx`'s field editors (priority, estimate, due date, description) into their `updateTaskFields` calls — depends on T021
- [ ] T024 [US4] Bind `task.conflict` events in `board-view.tsx` (via `useBoardChannel`'s `onEvent`) and show `ConflictBadge` on the affected task when `event.supersededActorId === currentUser.id` — depends on T010, T022, T007

**Checkpoint**: All four user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final gates before this feature is considered done.

- [ ] T025 [P] Audit every broadcast call site in `src/lib/actions/task.actions.ts` and `src/lib/actions/board.actions.ts` against `contracts/board-event-broadcast.md`'s mapping table — no mutation left un-broadcast, no wrong event name
- [ ] T026 [P] Confirm `PUSHER_SECRET`/`PUSHER_APP_ID` never reach the client bundle (only `NEXT_PUBLIC_PUSHER_KEY`/`NEXT_PUBLIC_PUSHER_CLUSTER` are referenced outside `src/lib/pusher.ts` and `src/app/api/pusher/auth/route.ts`) — Constitution §V
- [ ] T027 Run `pnpm build`, `pnpm lint`, `pnpm type-check` and fix any failures — depends on T001–T024 (Constitution §IV gate, blocking before push)
- [ ] T028 Execute the full `quickstart.md` walkthrough (all four scenarios, two real browser sessions) and record results — depends on T027
- [ ] T029 Update `PROGRESS.md` marking Phase 4 (Realtime) complete — Constitution §VI, performed after merge to `main`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (no channel subscription is possible before T004–T006 land)
- **User Story 1 (Phase 3)**: Depends only on Foundational
- **User Story 2 (Phase 4)**: Depends only on Foundational — independent of US1's files (extends the same hook at a different point, adds new component files); sequenced second here to match spec priority, not a technical dependency
- **User Story 3 (Phase 5)**: Depends only on Foundational for its hook/indicator work (T017, T018); T019's wiring into `board-view.tsx` comes after T011 (US1) since it wires into the same component US1 already wired
- **User Story 4 (Phase 6)**: Depends on US1's `updateTaskFields` broadcast (T008) and the shared `currentUser`/`onEvent` wiring (T007, T010) from US1 — cannot be fully demonstrated before US1 lands, though its schema/validation pieces (T020) are independent
- **Polish (Phase 7)**: Depends on every user story that will ship in this release

### Parallel Opportunities

- Setup: T002, T003 in parallel once T001 lands
- Foundational: T005 in parallel with T004 (different files); T007 in parallel with T004–T006 (different files)
- Once Foundational completes: US2's component work (T014) and US3's snapshot action (T016) can be staffed in parallel with US1 — only the final wiring steps (T011, T015, T019, T024) converge on `board-view.tsx`
- Within US1: T008 and T009 in parallel (different action files)
- Within US4: T022 in parallel with T020/T021

---

## Parallel Example: Foundational + User Story 1

```bash
# Foundational, in parallel:
Task: "Implement triggerBoardEvent in src/lib/realtime.ts"
Task: "Thread currentUser through board-view-with-modal.tsx into board-view.tsx"

# Once T005 lands, in parallel:
Task: "Extend task.actions.ts mutations to broadcast BoardEvents"
Task: "Extend board.actions.ts mutations to broadcast column.updated"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1) — validate live sync across two browser sessions
3. **STOP and VALIDATE**: `quickstart.md` Scenario 1
4. Continue with US2 → US3 → US4 in priority order

### Incremental Delivery

1. Setup + Foundational → a board can be subscribed to, nothing broadcasts yet
2. US1 → live task/column sync works → demo the core promise
3. US2 → presence roster → demo "who's here"
4. US3 → outage resilience verified → safe to demo without fearing a Pusher blip
5. US4 → conflict indicator → closes the "no silent data loss" guarantee
6. Polish → build/lint/type-check gate, full quickstart pass, `PROGRESS.md` update

---

## Notes

- No test tasks: `spec.md` did not request them and Features 001–002 established
  manual `quickstart.md` validation as this project's current stage-appropriate approach.
- Per Constitution §III, this branch (`feat-realtime-sync`) already exists — commit
  `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`,
  `checklists/`, and `tasks.md` together as `feat: prepare-spec-realtime-sync` (the
  first commit on this branch) before starting T001.
- Commit after each task, referencing its ID (`feat: [T0XX] ...`), per Constitution
  commit-granularity rules — never bundle multiple tasks into one commit.
