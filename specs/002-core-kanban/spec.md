# Feature Specification: Core Kanban

**Feature Branch**: `002-core-kanban`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "Construire le cœur fonctionnel du produit : la gestion de Workspace/Board/Task avec une expérience drag & drop fluide et un détail de tâche riche, conforme au design system Axiom et à DATA-MODEL.md." (see `features/002-core-kanban.md`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fluid task board interaction (Priority: P1)

A team member opens a board and organizes work by creating tasks, dragging them between columns as status changes, and reordering them within a column — with the board feeling instantly responsive rather than waiting on network round-trips.

**Why this priority**: This is the defining interaction of a Kanban product. If drag & drop doesn't feel instant and reliable, the product fails at its core promise regardless of how complete the surrounding features are.

**Independent Test**: Given a board that already has columns (seeded or pre-created), a user can create a task, drag it to another column, reorder it among siblings, edit its title inline, and delete it — all reflected immediately on screen, with the server state matching after confirmation.

**Acceptance Scenarios**:

1. **Given** a board with at least two columns, **When** the user creates a new task in a column, **Then** the task appears immediately in that column with a unique, server-issued task code.
2. **Given** a task in one column, **When** the user drags it into another column, **Then** the task visually moves to the new column instantly, before the server confirms the change.
3. **Given** a task drag that fails to save on the server (e.g. network error), **When** the failure is detected, **Then** the task visually returns to its original position without a flash of incorrect state or a stuck loading indicator.
4. **Given** several tasks in the same column, **When** the user drags one task to a new position among the others, **Then** the column reflects the new order immediately and that order persists after a page reload.
5. **Given** two users creating a task on the same board at nearly the same time, **When** both creations are submitted, **Then** each task receives a distinct task code with no collision.
6. **Given** a task the user no longer needs, **When** the user deletes it, **Then** it is removed from the board immediately and does not reappear after a page reload.

---

### User Story 2 - Rich task detail (Priority: P2)

A team member opens a task to review or update everything about it — description, assignees, labels, comments, priority, estimate, and due date — and to see the full history of what happened to the task, without ever leaving the board context via a page reload.

**Why this priority**: Once tasks can be created and moved, the next most valuable capability is making each task a complete record of the work, which is what turns a simple board into a usable project-management tool.

**Independent Test**: Given an existing task, open its detail view, edit each available field, add a comment, assign/unassign a member, attach/remove a label, and confirm every change is saved and reflected in the task's activity history — all without a full page reload.

**Acceptance Scenarios**:

1. **Given** an open task detail view, **When** the user edits the description, priority, estimate, or due date, **Then** the change is saved and visible immediately, without reloading the page.
2. **Given** an open task detail view, **When** the user assigns or unassigns a workspace member, **Then** the task's assignee list updates immediately and the change is reflected on the board card.
3. **Given** an open task detail view, **When** the user adds or removes a label, **Then** the task's labels update immediately, both in the detail view and on the board card.
4. **Given** an open task detail view, **When** the user posts a comment, **Then** the comment appears in the task's comment thread with the author and timestamp.
5. **Given** a task that has had multiple changes made to it (status change, assignment, comment), **When** the user views its activity history, **Then** every one of those changes appears in chronological order with who made the change and when.

---

### User Story 3 - Workspace and board setup (Priority: P3)

A user creates a Workspace to represent their team or project, invites collaborators with a specific role, and creates one or more Boards within it — choosing a template and customizing columns — so the team has a place to organize its work.

**Why this priority**: Workspaces and boards are the containers everything else lives in. They rank below the task-interaction stories because, for testing and early demos, a board can be pre-seeded — but real usage cannot begin without this story.

**Independent Test**: A new user can create a workspace, invite a collaborator by email with an assigned role, create a board from a template, and add/rename/reorder/recolor its columns — all independently verifiable via the workspace and board UI.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no workspace yet, **When** they create a new workspace with a name, **Then** the workspace is created, they become its OWNER, and a unique slug is generated.
2. **Given** a workspace, **When** its OWNER renames it, **Then** the new name is reflected everywhere the workspace is referenced.
3. **Given** a workspace, **When** the OWNER invites a collaborator by email with a role (ADMIN/MEMBER/VIEWER), **Then** an invitation is created in a PENDING state and the collaborator gains that role upon acceptance.
4. **Given** a pending invitation, **When** it is not accepted within the allowed window, **Then** it moves to an EXPIRED state and can no longer be accepted.
5. **Given** a workspace, **When** a member creates a new board and picks a template (SCRUM/KANBAN/BUG_TRACKING/CUSTOM), **Then** the board is created with that template's default columns, ready to use.
6. **Given** an existing board, **When** a member adds, renames, reorders, or recolors a column, **Then** the board reflects the change immediately.

---

### User Story 4 - Role-based permission enforcement (Priority: P4)

A workspace member with the VIEWER role can browse boards and tasks freely but is blocked from creating, editing, moving, or deleting anything — even if they attempt the action directly against the server, bypassing the UI entirely.

**Why this priority**: Correctness of the read/write experience (Stories 1-3) must exist before enforcement can be meaningfully tested, but this guarantee is what makes the product safe to use with real, less-trusted collaborators.

**Independent Test**: As a VIEWER, attempt every mutation covered by Stories 1-3 (create/move/edit/delete a task, edit workspace/board/column, invite a member) both through the UI and via a direct request that bypasses the UI, and confirm every one is rejected.

**Acceptance Scenarios**:

1. **Given** a user with the VIEWER role on a workspace, **When** they view a board, **Then** they can see all tasks, columns, and task details without restriction.
2. **Given** a user with the VIEWER role, **When** they attempt to create, edit, move, or delete a task through the UI, **Then** the mutating controls are unavailable or the action is rejected with a clear message.
3. **Given** a user with the VIEWER role, **When** a mutation request is sent directly to the server (bypassing the UI) for any task, board, column, or workspace-member action, **Then** the server rejects the request regardless of what the UI would have allowed.
4. **Given** a user with the MEMBER role, **When** they attempt an action reserved for OWNER/ADMIN (e.g. deleting the workspace, changing another member's role), **Then** the server rejects the request.

---

### User Story 5 - Sprint planning (Priority: P5)

A team using the SCRUM template plans a Sprint with a name and date range, and attaches tasks from the board to it, so the team can track what is planned for the current iteration.

**Why this priority**: Sprint planning adds real value for Scrum-style teams but is not required for a team using a simple Kanban flow, so it is the last slice of the core experience.

**Independent Test**: On an existing board, create a sprint with a name and date range, attach existing tasks to it, and confirm the sprint's task list and status (PLANNED/ACTIVE/COMPLETED) update as expected.

**Acceptance Scenarios**:

1. **Given** a board, **When** a member creates a sprint with a name, start date, and end date, **Then** the sprint is created in a PLANNED state.
2. **Given** a sprint and a task on the same board, **When** a member attaches the task to the sprint, **Then** the task shows as part of that sprint.
3. **Given** a sprint, **When** its status is changed (PLANNED → ACTIVE → COMPLETED), **Then** the new status is reflected wherever the sprint is shown.

---

### Edge Cases

- What happens when a user tries to delete a column that still contains tasks? The system MUST prevent the deletion and prompt the user to move or remove the tasks first, rather than silently deleting or orphaning tasks.
- What happens when a user tries to delete a workspace that still has boards/tasks? Only the OWNER can delete a workspace, and the system MUST clearly warn that all boards, tasks, and history within it will be removed.
- What happens when a workspace member is removed while still assigned to open tasks? The member is unassigned from those tasks; existing comments and activity history attributed to them are preserved.
- What happens when two users move the same task at nearly the same moment? The system MUST resolve to a single consistent final position with no duplicated or lost task, and any losing client's optimistic state MUST reconcile to the server's outcome.
- What happens when a user drags a task and loses network connectivity mid-drag? The optimistic move MUST roll back cleanly once the failure is detected, with no stuck or duplicated card.
- What happens when an invitation is sent to an email that already belongs to a workspace member? The system MUST reject or no-op the duplicate invitation rather than creating a second membership.
- What happens when a board has zero columns or zero tasks? The board MUST render a clear empty state guiding the user to add a column or task, not a blank or broken layout.
- What happens when a sprint's end date is before its start date? The system MUST reject the sprint creation/edit with a clear validation message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an authenticated user to create, rename, and delete a Workspace; deletion MUST be restricted to the workspace's OWNER.
- **FR-002**: System MUST assign a unique, human-readable slug to every Workspace at creation time.
- **FR-003**: System MUST allow a Workspace OWNER/ADMIN to invite a collaborator by email with an assigned role (OWNER/ADMIN/MEMBER/VIEWER), and track each invitation's status (PENDING/ACCEPTED/EXPIRED).
- **FR-004**: System MUST let users create, rename, and delete a Board within a workspace, choosing a template (SCRUM/KANBAN/BUG_TRACKING/CUSTOM) at creation.
- **FR-005**: System MUST let users create, rename, reorder, recolor, and delete Columns on a board, and MUST prevent deletion of a column that still contains tasks.
- **FR-006**: System MUST let users create, edit, and delete Tasks with: title, rich-text description, priority (URGENT/HIGH/MEDIUM/LOW), estimate (story points, optional), due date (optional), and position within a column.
- **FR-007**: System MUST generate each Task's display code (e.g. `AX-XXXX`) on the server only, incrementing per board, and MUST guarantee no two tasks on the same board ever receive the same code even when created concurrently.
- **FR-008**: System MUST let users move a task between columns and reorder tasks within a column, updating the UI immediately (optimistic update) ahead of server confirmation, and MUST cleanly revert the UI if the server rejects or fails to confirm the change.
- **FR-009**: System MUST provide a task detail view where a user can view and edit all task fields, manage assignees and labels, add comments, and view the task's activity history, with every change reflected without a full page reload.
- **FR-010**: System MUST let users create, edit, and delete Sprints (name, start date, end date, status: PLANNED/ACTIVE/COMPLETED) on a board, and attach or detach tasks from a sprint.
- **FR-011**: System MUST enforce workspace-role permissions on every mutating action (workspace, board, column, task, sprint, membership) on the server, independent of what the client UI allows or displays.
- **FR-012**: System MUST prevent users with the VIEWER role from performing any create, edit, move, or delete action, even when the request is made directly against the server rather than through the UI.
- **FR-013**: System MUST record a corresponding ActivityEvent (e.g. STATUS_CHANGE, ASSIGNED, COMMENTED) for every significant task state change, capturing what changed, who changed it, and when.
- **FR-014**: System MUST validate sprint date ranges, rejecting a sprint whose end date precedes its start date.
- **FR-015**: System MUST prevent a duplicate invitation or membership from being created for an email address already belonging to a workspace member.

### Key Entities *(include if feature involves data)*

- **Workspace**: A team's or project's top-level container; has a name, unique slug, an owner, member list, and the boards that belong to it.
- **WorkspaceMember**: The membership link between a User and a Workspace, carrying that user's role (OWNER/ADMIN/MEMBER/VIEWER) within that specific workspace.
- **Invitation**: A pending request for someone to join a Workspace with a given role, tracked through PENDING/ACCEPTED/EXPIRED states.
- **Board**: A workspace's work-tracking surface, built from a template, containing an ordered set of columns and, optionally, sprints.
- **Column**: A named, ordered, colored lane on a board that holds tasks in a given status.
- **Task**: The core unit of work — title, rich description, priority, estimate, due date, position, and a unique per-board display code — with assignees, labels, comments, and activity history attached.
- **TaskAssignee / TaskLabel**: Join relationships linking a Task to the members assigned to it and the labels applied to it.
- **Label**: A named, colored tag scoped to a board, applicable to any task on that board.
- **Comment**: A timestamped, authored message attached to a task, part of its collaboration record.
- **ActivityEvent**: An immutable, timestamped record of a significant change made to a task (status change, assignment, comment, etc.), forming the task's audit trail.
- **Sprint**: A named, dated iteration on a board (PLANNED/ACTIVE/COMPLETED) that a set of tasks can be attached to.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from an empty workspace to a usable board with columns and a first task in under 3 minutes.
- **SC-002**: A task drag between columns or within a column visually reflects the new position in under 100ms, regardless of server response time.
- **SC-003**: Under concurrent task creation on the same board (10 simultaneous creations in testing), 0% result in a duplicate task code.
- **SC-004**: 100% of mutation attempts made by a VIEWER-role user, whether through the UI or a direct request, are rejected.
- **SC-005**: A user can view and edit every field of a task's detail (description, assignees, labels, comments, priority, estimate, due date) without triggering a single full page reload.
- **SC-006**: A task's activity history matches 100% of the changes actually made to it during manual verification, with no missing or misattributed entries.
- **SC-007**: A failed drag-and-drop action rolls back to a correct, glitch-free visual state in 100% of tested failure cases.

## Assumptions

- Building on Feature 001 (Project Setup): authentication, the database schema, and the base design-system components already exist and are reused, not rebuilt.
- Only OWNER and ADMIN roles can invite members, change another member's role, or delete the workspace; MEMBER and VIEWER cannot.
- Column colors and templates are organizational/visual only — the system does not attach automated status logic (e.g. "done" behavior) to any particular column.
- Invitations expire after 7 days if not accepted (standard default; exact duration is a configuration detail for the planning phase, not a scope decision).
- A task belongs to at most one sprint at a time.
- Tasks, columns, and sprints are scoped to a single board; moving a task to a different board is out of scope for this feature.
- Real-time sync of board changes across multiple simultaneously-connected users is out of scope for this feature (covered in a later phase); this feature covers correctness for a single user's optimistic-UI experience and server-side consistency, not live cross-user broadcasting.
- AI-assisted suggestions on tasks (prioritization, estimation, description generation) are out of scope for this feature (covered in a later phase).
- Advanced touch/mobile-optimized drag & drop is out of scope; base responsive layout is sufficient.
