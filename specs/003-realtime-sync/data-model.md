# Phase 1 Data Model: Realtime Board Collaboration

## Schema changes (Prisma)

### `Task` — add `createdAt` / `updatedAt`

The `Task` model currently has neither timestamp field. This feature needs
`updatedAt` as the basis for optimistic-concurrency conflict detection
(`research.md` §4, FR-012–FR-014); `createdAt` is added alongside it for
consistency with every other timestamped entity in the schema (`Workspace`,
`Board`, `Comment`, `ActivityEvent`, ...), which all already have it.

```prisma
model Task {
  id          String       @id @default(cuid())
  boardId     String
  columnId    String
  code        String
  title       String
  description String?
  priority    TaskPriority @default(MEDIUM)
  estimate    Int?
  dueDate     DateTime?
  order       Int
  sprintId    String?
  createdAt   DateTime     @default(now())   // NEW
  updatedAt   DateTime     @updatedAt          // NEW

  // ...unchanged relations
}
```

**Migration note**: `@default(now())` backfills `createdAt` for existing rows;
`@updatedAt` backfills `updatedAt` to the migration's run time for existing rows
(Prisma's standard behavior) — acceptable since no pre-existing task has ever been
edited through the new conflict-checked path before this migration runs.

No other schema changes. Presence membership and board events are transient
(delivered over Pusher, never persisted) — see `research.md` §4 for why a
persisted conflict-log table was rejected.

## Transient (non-persisted) shapes

These are not Prisma models — they exist only as TypeScript types
(`src/types/realtime.types.ts`) describing what travels over the wire between the
server and Pusher, and between Pusher and subscribed clients.

### `BoardEvent`

The payload broadcast for every task/column mutation.

| Field | Type | Notes |
|---|---|---|
| `type` | `"task.created" \| "task.updated" \| "task.moved" \| "task.deleted" \| "column.updated"` | Matches FR-002/FR-003 event set exactly |
| `boardId` | `string` | Redundant with the channel name, included for client-side assertions/logging |
| `taskId` | `string \| null` | Present for task.* events, null for column.updated |
| `columnId` | `string \| null` | Present for column.updated and task.moved (target column) |
| `actorId` | `string` | The `User.id` who performed the mutation |
| `data` | mutation-specific | e.g. the updated `Task` fields for `task.updated`, `{ columnId, order }` for `task.moved` |
| `timestamp` | `string` (ISO 8601) | Server-generated at broadcast time |

### `PresenceMember`

The shape carried by Pusher's presence `user_info` for each subscriber, set at
channel-auth time (`contracts/pusher-channel-auth.md`).

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | `User.id`, doubles as Pusher's `user_id` |
| `name` | `string` | Display name |
| `image` | `string \| null` | Avatar URL if set; falls back to initials rendering (research.md §6) |

### `ConflictEvent`

The payload broadcast when `updateTaskFields` detects a stale write
(research.md §4).

| Field | Type | Notes |
|---|---|---|
| `type` | `"task.conflict"` | Distinct from `task.updated` so clients can special-case the indicator |
| `taskId` | `string` | |
| `supersededActorId` | `string` | The `User.id` whose edit was overwritten — only this user's client shows the indicator |
| `field` | `string` | Which field was involved in the conflicting write (from the same diff logic `updateTaskFields` already computes for `ActivityEvent`) |
| `timestamp` | `string` (ISO 8601) | |

## Relationship to existing entities

- `ConflictEvent.supersededActorId` and `BoardEvent.actorId` both reference
  `User.id` but are **not** foreign keys — they're broadcast payload fields, not
  database columns, so no schema relation is added.
- `PresenceMember` is derived from the same `WorkspaceMember`/`User` join already
  used by `requireRole` — no new query pattern, just reused at channel-auth time
  instead of at mutation time.
