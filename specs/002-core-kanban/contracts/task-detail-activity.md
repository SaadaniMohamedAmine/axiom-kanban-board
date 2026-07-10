# Contract: Task detail edits and activity logging (FR-009, FR-013)

## Behavior

1. The task detail view is a modal (no route change) reading a single task's full
   record — fields, assignees, labels, comments, and activity — via a server
   component/action; no client-side full-page reload occurs for any edit in this
   view.
2. Each field group is its own Server Action, all requiring `requireRole(workspaceId,
   'MEMBER')`:
   - `updateTaskFields(taskId, { title?, description?, priority?, estimate?,
     dueDate? })`
   - `setTaskAssignees(taskId, userIds[])`
   - `setTaskLabels(taskId, labelIds[])`
   - `addComment(taskId, body)`
3. Every one of the above, on success, writes an `ActivityEvent` in the same
   transaction as the field change:

   | Action | `ActivityEvent.type` | `payload` contains |
   |---|---|---|
   | `updateTaskFields` with a priority change | `STATUS_CHANGE` | `{ field: "priority", from, to }` |
   | `updateTaskFields` with any other field change | `STATUS_CHANGE` | `{ field, from, to }` |
   | `setTaskAssignees` (net add/remove) | `ASSIGNED` | `{ added: userId[], removed: userId[] }` |
   | `addComment` | `COMMENTED` | `{ commentId }` |

   `ActivityEvent.actorId` is always the current session's user id (never
   client-supplied).
4. The activity list renders in reverse-chronological order, each entry showing the
   actor's name (joined via `actorId`), a human-readable description built from
   `type`/`payload`, and a relative timestamp from `createdAt`.

## Acceptance mapping

Directly implements `spec.md` User Story 2 (all five acceptance scenarios) and
SC-005/SC-006.

## Consistency rule

An edit and its corresponding `ActivityEvent` are written in the same database
transaction — if the activity write fails, the field change is rolled back too.
There is no code path where a task's data changes without a matching activity entry
(for the event types in FR-013), which is what SC-006's "matches 100% of the changes
actually made" is verifying.
