# Contract: Concurrent Edit Conflict Detection

## Client responsibility

When a task is opened for editing (`task-detail-modal.tsx`), the client retains
the task's `updatedAt` value as it was loaded (`expectedUpdatedAt`). On save, this
value is sent alongside the field changes to `updateTaskFields`.

## `updateTaskFields` server logic (extends the existing implementation)

1. Load the current `Task` row (already happens today).
2. Compute the field diff (already happens today — this is the existing
   `activityPayloads` logic).
3. **New**: if `expectedUpdatedAt` was provided and does not match the task's
   current `updatedAt` (compared as timestamps, not string equality, to tolerate
   serialization precision differences), this write is superseding a change the
   editor never saw:
   - The write still proceeds — updated fields persist, per FR-012's last-write-
     wins rule. Data is never rejected or rolled back because of a conflict.
   - Look up the most recent `ActivityEvent` for this task with a `createdAt`
     between `expectedUpdatedAt` and now to identify `supersededActorId` — the
     actor of the edit this write is overwriting. If no such event is found (e.g.
     the prior edit didn't go through `updateTaskFields`, such as a `moveTask`
     touching `updatedAt` via a future extension), fall back to omitting the
     conflict broadcast rather than guessing at an actor.
   - Broadcast `task.conflict` (`data-model.md`'s `ConflictEvent` shape) on the
     board channel in addition to the normal `task.updated` broadcast.
4. If `expectedUpdatedAt` was not provided (e.g. a caller that doesn't yet pass
   it), skip conflict detection entirely — this keeps the parameter additive and
   non-breaking rather than a required migration for every call site on day one.

## Client-side conflict indicator

`useBoardChannel`'s event handling special-cases `task.conflict`: if
`event.supersededActorId === currentUser.id`, the task (wherever currently
rendered — board card and/or open detail modal) shows a conflict badge
(`components/realtime/conflict-badge.tsx`) until the user acknowledges it by
reopening/viewing the task's current value (per spec acceptance scenario "the
member sees the currently persisted value, not a mix of both edits" — this is
already guaranteed because the client always re-reads from the server/broadcast
payload, never merges local + remote field values).

## Why "MUST NOT silently discard" (FR-014) is satisfied

The losing edit's *value* is not persisted (by design — that's what "last write
wins" means), but its *occurrence* always reaches the superseded editor as long as
they remain subscribed to the board channel, which they are for the entire
duration they have the task open. There is no code path where a stale write is
detected and the conflict broadcast is skipped except the two explicitly
enumerated ones above (no `expectedUpdatedAt` provided at all, or no attributable
prior actor found) — both are edge cases where there is nothing meaningful to
attribute the conflict *to*, not cases where a known conflict is deliberately
hidden.
