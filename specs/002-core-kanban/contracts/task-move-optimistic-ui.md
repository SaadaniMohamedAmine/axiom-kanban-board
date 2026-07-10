# Contract: Optimistic task move with clean rollback (FR-008)

## Behavior

1. `@dnd-kit/core`'s `onDragEnd` fires client-side with the task id, target column
   id, and target index among that column's current tasks.
2. The board's local state updates immediately (via `useOptimistic`) to reflect the
   new column/position — this happens synchronously, before any network call
   resolves.
3. A Server Action `moveTask(taskId, targetColumnId, targetIndex)` is invoked:
   - `requireRole(workspaceId, 'MEMBER')` — see `permission-enforcement.md`.
   - Computes the new `order` value using the gap-stepped scheme (`research.md` §3):
     the midpoint between the `order` values of the tasks now immediately before and
     after the dropped task in the target column (edge cases: dropped at the very
     start/end of a column use `neighbor.order / 2` / `neighbor.order + 1000`).
   - Updates `Task.columnId` and `Task.order` in one statement.
   - Writes an `ActivityEvent` (`type: STATUS_CHANGE`) only when `columnId` actually
     changed (a pure reorder within the same column does not produce an activity
     entry — it isn't a "status change").
4. **Success**: the optimistic state is confirmed; no visual change occurs (it
   already looked correct).
5. **Failure** (network error, permission rejection, or any thrown error): the
   optimistic update is discarded and the board re-renders from the last confirmed
   server state — the card returns to its original column/position with no
   intermediate flash of the failed (attempted) position.

## Acceptance mapping

Directly implements `spec.md` User Story 1, Acceptance Scenarios 2 and 3, and the
"drag & drop mid-network-failure" edge case.

## Non-goals

- No manual "toast: move failed, undo?" flow — the rollback is silent and immediate,
  matching the "no glitch, no stuck loading indicator" requirement. A generic error
  toast MAY surface for awareness, but the visual position rollback does not depend
  on the user dismissing anything.
