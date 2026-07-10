# Contract: Server-side role enforcement on every mutation (FR-011, FR-012)

Applies to every Server Action introduced by this feature: workspace CRUD, member
role changes, invitations, board CRUD, column CRUD, task CRUD + move/reorder, sprint
CRUD + task attachment, comments, assignees, labels.

## Behavior

1. Every mutating Server Action's first statement calls
   `requireRole(workspaceId, minRole)`, which:
   - Reads the current session server-side (never trusts a role passed from the
     client, even implicitly via component state).
   - Looks up the caller's `WorkspaceMember.role` for the given `workspaceId`.
   - Throws (aborting the action before any write) if no membership exists, or if
     the membership's role is below `minRole` in the ordering
     `VIEWER < MEMBER < ADMIN < OWNER`.
2. `minRole` per action family:

   | Action family | Minimum role |
   |---|---|
   | View board/task/workspace data | `VIEWER` |
   | Create/edit/move/delete task, column, comment, label, assignee, sprint | `MEMBER` |
   | Create/edit board, invite member, change a member's role (except to/from OWNER) | `ADMIN` |
   | Rename/delete workspace, transfer/assign OWNER role | `OWNER` |

3. This check runs identically whether the request originates from a UI action or a
   direct call to the Server Action's endpoint — there is no separate "trusted UI
   path." The UI additionally hides/disables controls a `VIEWER` can't use, but that
   is a UX convenience, never the enforcement boundary.

## Response contract (rejection case)

| Field | Value |
|---|---|
| Thrown error type | `PermissionError` |
| `error.code` | `INSUFFICIENT_ROLE` |
| `error.requiredRole` | the `minRole` that was needed |
| `error.actualRole` | the caller's actual role (or `null` if no membership) |

No partial mutation occurs — the guard runs before any database write, inside the
same function, so there is nothing to roll back.

## Verification

Every acceptance scenario in `spec.md` User Story 4 must be exercised twice: once
through the UI (control is absent/disabled) and once by invoking the Server Action
directly with a `VIEWER`/under-privileged session, bypassing the component tree
entirely, to prove the rejection is server-enforced and not merely UI-hidden.
