# Contract: Board Event Broadcast

## Server-side helper

`src/lib/realtime.ts` exports a single entry point every mutating Server Action
calls after (never before, and only after) its Prisma write succeeds:

```ts
triggerBoardEvent(boardId: string, event: BoardEvent, excludeSocketId?: string): Promise<void>
```

- Derives the channel name (`presence-board-{boardId}`) internally — no call site
  constructs that string itself, keeping the naming convention in one place
  (FR-001's auditability point from `plan.md`'s Structure Decision).
- Passes `excludeSocketId` through as Pusher's `socket_id` trigger option when
  present (research.md §2); omits it silently when absent (research.md §3) rather
  than throwing — a missing socket ID must never block the mutation's own success.
- Swallows/logs Pusher delivery errors without throwing — a failed broadcast MUST
  NOT fail the underlying mutation (FR-009's guarantee that core interactions work
  independent of realtime health applies here too: a Pusher outage must not turn
  into a 500 on task creation).

## Event → action mapping

| Server Action | Event(s) triggered | `data` payload |
|---|---|---|
| `createTask` | `task.created` | full created `Task` |
| `moveTask` | `task.moved` | `{ taskId, columnId, order }` |
| `deleteTask` | `task.deleted` | `{ taskId }` |
| `updateTaskFields` | `task.updated` (+ `task.conflict` if stale write detected — `contracts/conflict-detection.md`) | changed fields only |
| `setTaskAssignees` | `task.updated` | `{ taskId, assigneeIds }` |
| `setTaskLabels` | `task.updated` | `{ taskId, labelIds }` |
| `createColumn` | `column.updated` | full created `Column` |
| `renameColumn` | `column.updated` | `{ columnId, name }` |
| `reorderColumn` | `column.updated` | `{ columnId, order }` |
| `recolorColumn` | `column.updated` | `{ columnId, color }` |
| `deleteColumn` | `column.updated` | `{ columnId, deleted: true }` |

Every action above already resolves `board.workspaceId` for its `requireRole`
check — `boardId` for `triggerBoardEvent` is always a value already in scope, no
extra query needed.

## Client-side consumption

`useBoardChannel(boardId)` (the hook in `plan.md`'s Structure section) subscribes
once per `boardId`, binds each event name from the table above, and exposes a
single `onEvent` callback prop that `board-view.tsx` uses to fold incoming events
into its existing `columns` state — the same state shape `moveTask`'s optimistic
update already writes to, so a `task.moved` event and a local optimistic move apply
through the identical reducer path.

## Socket ID plumbing (own-echo exclusion, FR-007)

Every mutating call from a client component now threads its own `socket_id`
alongside the existing payload, e.g.:

```ts
moveTask({ taskId, targetColumnId, targetIndex }, getPusherClient().connection.socket_id)
```

Each Server Action accepts this as a trailing optional parameter (never part of
the Zod-validated input schema — it's transport metadata, not domain input) and
forwards it straight to `triggerBoardEvent`'s `excludeSocketId` argument.
