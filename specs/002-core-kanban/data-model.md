# Data Model: Core Kanban

**Feature**: `002-core-kanban` | **Date**: 2026-07-10
**Source of truth**: `DATA-MODEL.md` (product-wide) and the existing
`prisma/schema.prisma`, created in Feature 001 for the full product schema up front.
Every entity this feature needs **already exists** in the schema — this document
restates each in implementation-ready form and calls out the small number of field
additions this feature requires (a second migration), per the decisions in
`research.md`.

## Schema additions required by this feature

| Model | Change | Why |
|---|---|---|
| `Board` | add `taskCounter Int @default(0)` | Atomic per-board task-code generation (research.md §1) |
| `Task` | `code String?` → `code String` (drop nullability) | Code is now always generated server-side at creation (FR-007); no `Task` rows exist yet in any environment, so this is a safe non-breaking migration |
| `Invitation` | add `expiresAt DateTime` | Lazy invitation expiry (research.md §8) |
| `ActivityEvent` | add `actorId String` + relation to `User` (`onDelete: Cascade`, indexed) | Structured "who made the change" (research.md §9, FR-013) |

No other entities, fields, or enums change. Everything below reflects the schema as
it will read after these four additions.

## Entities

### Workspace
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| name | string | editable (FR-001) |
| slug | string | unique, generated at creation (FR-002) |
| ownerId | string | FK → User |
| createdAt | datetime | |

Relations: `owner` (User), `members` (WorkspaceMember[]), `boards` (Board[]),
`invitations` (Invitation[]).

**Rules**: deletion restricted to the member whose role is `OWNER` (FR-001, FR-011).

### WorkspaceMember
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| workspaceId | string | FK → Workspace |
| userId | string | FK → User |
| role | enum `MemberRole` | `OWNER` \| `ADMIN` \| `MEMBER` \| `VIEWER` |
| invitedAt | datetime | |
| joinedAt | datetime? | null until the invitation is accepted |

**Rules**: unique on `(workspaceId, userId)` — one role per user per workspace. Role
changes and removal restricted to `OWNER`/`ADMIN` (spec.md Assumptions).

### Invitation
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| workspaceId | string | FK → Workspace |
| email | string | invitee's address |
| role | enum `MemberRole` | role granted on acceptance |
| token | string | unique, used in the invite-accept link |
| status | enum `InvitationStatus` | `PENDING` \| `ACCEPTED` \| `EXPIRED` |
| **expiresAt** | **datetime** | **new** — `createdAt + 7 days` (research.md §8) |
| createdAt | datetime | |

**Rules**: creation restricted to `OWNER`/`ADMIN` (FR-003). Reject creating a new
invitation (or membership) for an email that already has a `WorkspaceMember` row on
that workspace (FR-015). Status transitions lazily to `EXPIRED` the first time a
`PENDING` invitation past its `expiresAt` is read or an accept is attempted
(research.md §8).

### Board
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| workspaceId | string | FK → Workspace |
| name | string | |
| template | enum `BoardTemplate` | `SCRUM` \| `KANBAN` \| `BUG_TRACKING` \| `CUSTOM` — sets default columns at creation |
| **taskCounter** | **int** | **new**, `@default(0)` — atomic source for `Task.code` (research.md §1) |
| createdAt | datetime | |

Relations: `columns` (Column[]), `tasks` (Task[]), `labels` (Label[]), `sprints`
(Sprint[]).

### Column
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| boardId | string | FK → Board |
| name | string | |
| order | int | position among sibling columns (gap-stepped, research.md §3) |
| color | string? | decorative only — no status semantics attached (spec.md Assumptions) |

**Rules**: deletion blocked while the column still has tasks (spec.md Edge Cases,
FR-005).

### Task
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| boardId | string | FK → Board |
| columnId | string | FK → Column |
| **code** | **string** (was `string?`) | **now required** — `AX-<Board.taskCounter>`, generated server-side only (FR-007) |
| title | string | |
| description | string? | Markdown (research.md §5) |
| priority | enum `TaskPriority` | `URGENT` \| `HIGH` \| `MEDIUM` \| `LOW`, default `MEDIUM` |
| estimate | int? | story points, optional |
| dueDate | datetime? | optional |
| order | int | position within column (gap-stepped, research.md §3) |

Relations: `assignees` (TaskAssignee[]), `labels` (TaskLabel[]), `comments`
(Comment[]), `activity` (ActivityEvent[]).

**Rules**: `@@unique([boardId, code])` (already present) is the DB-level backstop for
FR-007's uniqueness guarantee; the atomic counter (see Board) is what actually
prevents collisions under concurrency. Moving/reordering never crosses board
boundaries in this feature (spec.md Assumptions).

### TaskAssignee (join: Task ↔ User)
Unchanged from the existing schema. Unique on `(taskId, userId)`.

### Label
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| boardId | string | FK → Board — labels are board-scoped |
| name | string | |
| color | string | |

### TaskLabel (join: Task ↔ Label)
Unchanged from the existing schema. Unique on `(taskId, labelId)`.

### Comment
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| taskId | string | FK → Task |
| authorId | string | FK → User |
| body | string | |
| createdAt | datetime | |

### ActivityEvent
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| taskId | string | FK → Task |
| **actorId** | **string** | **new** — FK → User, who made the change (research.md §9, FR-013) |
| type | enum `ActivityType` | `STATUS_CHANGE` \| `ASSIGNED` \| `COMMENTED` \| ... (`AI_SUGGESTION_APPLIED` unused until Phase 5) |
| payload | json | change-specific detail (old/new value) |
| createdAt | datetime | |

**Rules**: written by every FR-013-covered mutation, in the same transaction as the
change itself — never as a best-effort side effect that could silently fail to log.

### Sprint
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| boardId | string | FK → Board |
| name | string | |
| startDate | datetime | |
| endDate | datetime | |
| status | enum `SprintStatus` | `PLANNED` \| `ACTIVE` \| `COMPLETED` |

**Rules**: reject creation/edit where `endDate < startDate` (FR-014). A task belongs
to at most one sprint at a time (spec.md Assumptions) — modeled as an optional
`sprintId` FK added directly on `Task`... **not** a join table, since the cardinality
is 1:N (one sprint has many tasks, one task has at most one sprint). This is a fifth
schema addition alongside the four in the table above:

| Model | Change | Why |
|---|---|---|
| `Task` | add `sprintId String?` + relation to `Sprint` (`onDelete: SetNull`, indexed) | One-sprint-per-task attachment (FR-008 of `features/002-core-kanban.md`, spec.md User Story 5) |

## State transitions

- **Invitation**: `PENDING` → `ACCEPTED` (user accepts before `expiresAt`) or
  `PENDING` → `EXPIRED` (lazily, on read/accept attempt past `expiresAt`). Terminal
  states do not transition further.
- **Sprint**: `PLANNED` → `ACTIVE` → `COMPLETED`, forward-only, user-driven (no
  automatic date-based transition in this feature's scope).
- **Task position**: `(columnId, order)` changes freely at any time via drag & drop
  or direct edit; no state machine — any column can move to any other column on the
  same board.

## Entities explicitly not touched by this feature

`User`, `Account`, `Session`, `Verification` (Better Auth, Feature 001), `AILog`,
`Notification` — schema already exists from Feature 001 but no logic in this feature
reads or writes them (AI/notifications are later-phase scope per `spec.md`
Assumptions).
