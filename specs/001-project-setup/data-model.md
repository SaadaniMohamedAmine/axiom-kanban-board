# Data Model: Project Setup & Foundation

**Feature**: `001-project-setup` | **Date**: 2026-07-09
**Source of truth**: `DATA-MODEL.md` (product-wide). This document restates it in
implementation-ready form for this feature's migration — it does not introduce new
entities, only the fields/relations/enums needed to generate a correct Prisma schema.

All entities below are created in the first migration (FR-002), even though most are
only *used* by app logic starting in later phases. `AX-XXXX`-style human-readable codes
and any other Phase 3+ business logic are out of scope here — only the schema exists.

## Auth entities (Better Auth standard shape, via Prisma adapter)

### User
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| name | string | |
| email | string | unique |
| emailVerified | boolean | always `false`/unused — verification flow is disabled |
| image | string? | |
| createdAt / updatedAt | datetime | |

Relations: `accounts` (Account[]), `sessions` (Session[]), `workspaces` (Workspace[] via ownerId), `memberships` (WorkspaceMember[]).

### Account
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| userId | string | FK → User |
| providerId | enum-like string | `google` \| `github` \| `credential` |
| accountId | string | provider-side identifier |
| password | string? | only set for the `credential` provider, hashed |

**Validation rule (FR-011)**: before creating a new `User`+`Account` pair, check whether
any existing `Account` across *any* provider already has a `User.email` matching the
incoming email. If so, reject — do not create the account, do not link it. See
`contracts/auth-conflict.md`.

### Session
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| userId | string | FK → User |
| expiresAt | datetime | standard default duration (no custom policy specified) |
| token | string | unique |

### Verification
Standard Better Auth adapter table (token, identifier, expiresAt). Present because the
adapter requires it, not because the email-verification flow is exercised.

## Product entities

### Workspace
id, name, slug (unique), ownerId → User, createdAt. Relations: `members` (WorkspaceMember[]), `boards` (Board[]).

### WorkspaceMember
id, workspaceId → Workspace, userId → User, role (`OWNER`\|`ADMIN`\|`MEMBER`\|`VIEWER`), invitedAt, joinedAt?.

### Invitation
id, workspaceId → Workspace, email, role, token (unique), status (`PENDING`\|`ACCEPTED`\|`EXPIRED`), createdAt.

### Board
id, workspaceId → Workspace, name, template (`SCRUM`\|`KANBAN`\|`BUG_TRACKING`\|`CUSTOM`), createdAt. Relations: `columns` (Column[]), `sprints` (Sprint[]).

### Column
id, boardId → Board, name, order (int), color.

### Task
id, boardId → Board, columnId → Column, code (unique per board, generation logic is Phase 3 scope — column exists now, empty until then), title, description, priority (`URGENT`\|`HIGH`\|`MEDIUM`\|`LOW`), estimate (int?), dueDate?, order (int). Relations: `assignees`, `labels`, `comments`, `activity`, `aiLogs`.

### TaskAssignee
id, taskId → Task, userId → User.

### Label
id, boardId → Board, name, color.

### TaskLabel
id, taskId → Task, labelId → Label.

### Comment
id, taskId → Task, authorId → User, body, createdAt.

### ActivityEvent
id, taskId → Task, type (`STATUS_CHANGE`\|`ASSIGNED`\|`COMMENTED`\|`AI_SUGGESTION_APPLIED`\|...), payload (JSON), createdAt.

### Sprint
id, boardId → Board, name, startDate, endDate, status (`PLANNED`\|`ACTIVE`\|`COMPLETED`).

### AILog
id, taskId → Task (nullable), type (`PRIORITIZE`\|`ESTIMATE`\|`DESCRIBE`\|`DETECT_BLOCKER`\|`ASSIGN`), input (JSON), output (JSON), confidence (float), feedback (`USEFUL`\|`NOT_USEFUL`\|null), createdAt.

### Notification
id, userId → User, type, payload (JSON), readAt (nullable), createdAt.

## Consistency notes (carried from `DATA-MODEL.md`)

- `Task.code` generation logic (server-side, incremental per board) is **not**
  implemented in this feature — only the unique-per-board column exists. Implementing
  the generator is Phase 3 (core Kanban) scope.
- `WorkspaceMember.role` is per-workspace, never a global `User` role.
- This feature does not create any `Workspace`, `Board`, or `Task` rows — those tables
  exist empty until Phase 3. Only `User`/`Account`/`Session`/`Verification` rows are
  produced by this feature's acceptance scenarios (account creation).
