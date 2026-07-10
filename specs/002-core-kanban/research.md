# Research: Core Kanban

Consolidates the decisions needed to close every open technical question implied by
`spec.md` before Phase 1 design. No `NEEDS CLARIFICATION` markers were carried over
from `plan.md`'s Technical Context — everything below was resolvable from the existing
codebase (`prisma/schema.prisma`, `TECH-STACK.md`, `DATA-MODEL.md`, `axiom-design/`)
plus standard practice for this domain.

## 1. Task code generation without collisions (FR-007)

**Decision**: Add an atomic `taskCounter` integer to `Board`. Task creation runs
inside a single Prisma `$transaction` that calls `prisma.board.update({ where: {
id: boardId }, data: { taskCounter: { increment: 1 } } })` — Prisma's atomic
`increment` compiles to a single parameterized `UPDATE ... SET task_counter =
task_counter + 1 ... RETURNING` under the hood, with no raw SQL written by hand —
then inserts the `Task` row using the returned `taskCounter` value to build
`AX-<counter>`, in the same transaction.

**Rationale**: An atomic column increment on a single row is serialized under
concurrent transactions by Postgres's row-level locking — two simultaneous
creations on the same board queue on that row's write lock, so no two callers can
ever observe the same counter value. This avoids both a retry-on-unique-violation
loop (extra round-trips, more complex error handling) and an application-level
lock/queue (unnecessary infrastructure for portfolio-scale traffic), while staying
entirely within Prisma's parameterized-query API per the constitution's ban on raw
SQL string concatenation (Principle V).

**Alternatives considered**:
- *Retry loop on the existing `@@unique([boardId, code])` constraint* — works, but
  under real concurrent load causes wasted inserts and retries; adds latency
  variance for no benefit over the counter approach.
- *`SELECT MAX(code) ... FOR UPDATE` per board* — functionally similar but requires
  parsing/max-ing string codes instead of reading one integer column; more fragile.

## 2. Optimistic drag & drop with clean rollback (FR-008)

**Decision**: `@dnd-kit/core` (already the project's declared choice in
`TECH-STACK.md`) owns pointer/drag mechanics client-side only. On `onDragEnd`, the
board's local state (column assignment + order) updates immediately via React 19's
`useOptimistic`, and a Server Action persists the same change. If the action throws
or returns a failure result, the optimistic state is discarded and the view
re-renders from the last confirmed server state — no manual "undo" animation is
required because `useOptimistic` reconciles back to the base state automatically
once the transition settles.

**Rationale**: `useOptimistic` is the framework-native mechanism for exactly this
pattern (instant UI, server confirms or the UI snaps back), avoiding a hand-rolled
optimistic-state library and keeping the mutation as a single Server Action call per
FR-011's requirement that every mutation be server-verified.

**Alternatives considered**: A client-side global store (e.g. Zustand) tracking
pending vs. confirmed positions — more moving parts than the built-in hook already
provides for this exact use case; rejected as unnecessary complexity.

## 3. Task ordering scheme within a column (FR-006, FR-008)

**Decision**: Integer `order` with a gap convention — new tasks and reorders are
assigned values in steps of `1000` (e.g. 1000, 2000, 3000...). Dropping a task
between two siblings computes the midpoint of their `order` values. A full
column-renumber (reset to clean 1000-steps) only runs on the rare occasion the gap
between two neighbors collapses to zero.

**Rationale**: Matches the `order: Int` column already in `prisma/schema.prisma`
(no migration to a new type needed). Gap-stepping means the overwhelmingly common
case (dropping a card between two others) is a single-row update, not a rewrite of
every task in the column — important for the <100ms perceived-instant target in
`spec.md` SC-002.

**Alternatives considered**:
- *Full renumber on every reorder* — simplest to reason about but O(n) writes per
  drag; rejected for latency.
- *Fractional/float `order`* — avoids ever needing a renumber but accumulates
  floating-point precision drift after many reorders on a long-lived column;
  rejected in favor of the simpler integer-gap scheme, which already covers the
  realistic reorder volume for a portfolio-scale board.

## 4. Concurrent moves of the same task (edge case in spec.md)

**Decision**: Each move is a single atomic `UPDATE` (`columnId`, `order`) inside a
transaction; Postgres's row-level locking makes the last commit win with no
partial/corrupted state. The losing client's `useOptimistic` state reconciles to
whatever the server actually persisted on its next revalidation.

**Rationale**: At this scale, last-write-wins is an acceptable, industry-standard
resolution (same behavior as Trello/Linear for simultaneous drags) — no operational
transform or CRDT machinery is justified, and multi-user realtime sync itself is
explicitly out of scope for this feature (`spec.md` Assumptions).

## 5. Rich-text task description (FR-006, FR-009)

**Decision**: Store the description as Markdown (plain `String`, already the column
type in `schema.prisma`), edited through a lightweight formatting toolbar
(bold/italic/list/link) over a plain textarea, rendered with a minimal Markdown-to-
HTML renderer for display.

**Rationale**: `spec.md`'s Assumptions explicitly scope "a reasonable minimal
formatting set (bold/italic/lists/links)" — Markdown covers exactly that without
adding a WYSIWYG rich-text editor dependency (e.g. Tiptap/ProseMirror) whose editing
surface, JSON schema, and sanitization concerns are unjustified for this scope.

**Alternatives considered**: Tiptap/ProseMirror JSON-based editor — richer, but a
materially heavier dependency and new stored-content format; rejected as
over-engineering relative to the spec's own scope boundary.

## 6. Permission enforcement surface (FR-011, FR-012)

**Decision**: A single shared server-side guard, `requireRole(workspaceId, minRole)`,
called as the first line of every Server Action that mutates a workspace, board,
column, task, sprint, or membership. It re-derives the caller's `WorkspaceMember.role`
from the session on every call (never trusts a client-supplied role) and throws
before any mutation runs if the role is insufficient.

**Rationale**: Constitution Principle V requires server-side permission checks on
every mutation, "never trust client-side role enforcement alone." A single guard
function used everywhere is the only way to make FR-012 ("even via direct API call")
verifiably true — scattering ad hoc checks per action risks one being missed.

**Alternatives considered**: Per-action inline role checks — rejected; harder to
audit for completeness and easy to accidentally omit on a new action.

## 7. Server Actions vs. API routes

**Decision**: All mutations in this feature (workspace/board/column/task/sprint CRUD,
invitations, comments, assignments, drag-and-drop moves) are Next.js Server Actions,
validated with Zod — continuing the default established in Feature 001 (FR-009 of
`specs/001-project-setup/spec.md`). No new API routes are introduced by this feature.

**Rationale**: Consistency with the already-established validation/mutation pattern;
no external caller (webhook, third-party integration) needs a REST/JSON endpoint for
anything in this feature's scope.

## 8. Invitation expiry (FR-003, edge case in spec.md)

**Decision**: Add `expiresAt DateTime` to `Invitation`, set to `createdAt + 7 days` at
creation. Expiry is evaluated lazily: any read or accept-attempt against a `PENDING`
invitation whose `expiresAt` has passed treats it as `EXPIRED` (and persists that
status transition at that moment). No scheduled/cron job is introduced.

**Rationale**: The project has no background-job infrastructure (confirmed in
`TECH-STACK.md` — Vercel serverless only, no queue/cron service), and lazy evaluation
is sufficient since the only consumer of "is this invitation still valid" is the
accept flow itself.

**Alternatives considered**: A Vercel Cron job sweeping expired invitations —
unnecessary infrastructure for a check that only matters at accept-time.

## 9. Activity event attribution (FR-013)

**Decision**: Add `actorId String` (+ relation to `User`) to `ActivityEvent`. The
event's `payload` JSON continues to hold the change-specific detail (old/new value),
but *who* made the change is a first-class, queryable/indexable column rather than
being buried in the JSON payload.

**Rationale**: `spec.md` Acceptance Scenario (User Story 2) requires the activity
history to show "who made the change and when" — `createdAt` already covers "when",
but the current schema has no structured "who". Promoting it to a real column keeps
the audit trail queryable (e.g. "show me everything Alex did") without parsing JSON.

## 10. Reconciling the Stitch design exports with this feature's scope

**Decision**: Reuse the following exports as the literal visual source of truth,
converted to Next.js/Tailwind components exactly as required by `features/002-core-
kanban.md`'s implementation constraint:
- `axiom-design/axiom_main_kanban_board_export/` → board + column + card layout
  (its "Axiom Intelligence" right-hand panel is Phase 5/AI scope — omitted here,
  panel container left unbuilt rather than stubbed with placeholder AI content).
- `axiom-design/axiom_task_detail_modal_export/` → modal shell, header, Description/
  Activity/Comments left column.
- `axiom-design/axiom_empty_board_state/` → empty-board guidance state (edge case in
  spec.md).
- `axiom-design/axiom_onboarding_workspace_name_export/` → workspace creation form.
- `axiom-design/axiom_team_management/` → member list, roles, invite flow.

For surfaces the FR list requires but no export exists for — the task detail's
**Properties panel** (assignees, labels, priority, estimate, due date — FR-009; the
export's right column is AI-only, not applicable to Phase 3), board creation modal,
column management controls, and sprint planning UI — new components are built
directly from `axiom-design/axiom/DESIGN.md`'s token system (colors, 8px grid,
elevation levels, shape radii) rather than improvised styling, since the feature doc's
constraint ("pas recréée from scratch") only binds screens that were actually
exported; DESIGN.md is the fallback source of truth where no export exists.

**Also noted**: `axiom_main_kanban_board_export` and `axiom_empty_board_state` /
`axiom_team_management` use two different Tailwind token conventions (ad hoc hex-based
`axiom-*` config vs. semantic `on-surface`/`surface-container`/`outline-variant`
naming). Both are normalized onto one Tailwind theme matching DESIGN.md's canonical
values (Level 0/1/2 surfaces, `#3B82F6` primary, etc.) defined once, rather than
importing each export's local config verbatim — keeping one design-token source of
truth as DESIGN.md itself intends.

## 11. Realtime

**Decision**: Out of scope, per `spec.md` Assumptions. After a Server Action succeeds,
the acting user's own client updates via Next.js path revalidation
(`revalidatePath`/router refresh) — no Pusher channel is wired up in this feature
despite Pusher already being configured from Feature 001.

**Rationale**: Explicitly deferred to a later phase in the source feature doc
(`features/002-core-kanban.md` → Hors-périmètre); wiring it now would be
scope creep against both documents.
