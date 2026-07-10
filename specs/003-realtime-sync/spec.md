# Feature Specification: Realtime Board Collaboration

**Feature Branch**: `003-realtime-sync`

**Created**: 2026-07-10

**Status**: Draft

**Input**: User description: "Rendre le board collaboratif en temps réel via Pusher Channels, pour que plusieurs membres d'un Workspace voient les changements des autres sans rafraîchir la page, avec une dégradation propre si le service realtime est indisponible." (see `features/003-realtime.md`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Live task synchronization across viewers (Priority: P1)

A team member has a board open while a teammate creates, moves, edits, or deletes a task on the same board from a different session. The change appears on the first member's screen without them needing to refresh the page.

**Why this priority**: Live sync is the defining promise of this feature — without it, "realtime collaboration" doesn't exist and every other capability (presence, conflict handling) has nothing to attach to.

**Independent Test**: Open the same board in two separate browser sessions as two different workspace members. Create, move, edit, and delete tasks from one session and confirm each change appears in the other session without a manual refresh.

**Acceptance Scenarios**:

1. **Given** two members viewing the same board, **When** one member creates a task, **Then** the task appears on the other member's board within one second.
2. **Given** two members viewing the same board, **When** one member drags a task to another column or position, **Then** the other member sees the task move to the same column/position within one second, without needing to refresh.
3. **Given** two members viewing the same board, **When** one member edits a task's fields or deletes it, **Then** the other member's view reflects the update or removal within one second.
4. **Given** a member who just performed an action themselves, **When** their own change event is echoed back to their session, **Then** their screen does not flicker, duplicate the change, or briefly show a stale state.
5. **Given** a member viewing Board A and a change happens on Board B (different board, same workspace), **When** the change is broadcast, **Then** the member viewing Board A sees no update from Board B's activity.

---

### User Story 2 - Presence awareness (Priority: P2)

A team member viewing a board can see, at a glance, which other workspace members currently have that same board open, so they know who else might be actively working on it.

**Why this priority**: Presence adds meaningful collaborative context (avoiding stepping on someone's work) but the board is still fully usable for its primary purpose without it, making it secondary to live sync.

**Independent Test**: Open the same board as two different members; confirm each sees the other listed as present, and that the list updates when a member closes the board or navigates away.

**Acceptance Scenarios**:

1. **Given** a member opens a board, **When** another member already has that board open, **Then** the newly-joined member sees the existing member represented in the presence list within two seconds.
2. **Given** a member is shown in the presence list of a board, **When** that member closes the tab or navigates away from the board, **Then** they are removed from the other viewers' presence list within two seconds.
3. **Given** a member with no avatar image, **When** they appear in the presence list, **Then** they are represented with their initials styled per the Axiom design system rather than a generic placeholder.

---

### User Story 3 - Graceful degradation when realtime is unavailable (Priority: P3)

A team member is working on a board when the realtime connection drops (network issue, service outage). They can keep creating, moving, and editing tasks normally; the app quietly signals that live updates are paused instead of blocking any interaction.

**Why this priority**: This is a resilience/trust safeguard rather than a core interaction — it matters only when the realtime layer already fails, which is expected to be rare, but it directly protects the product's usability promise when it does.

**Independent Test**: Simulate a dropped realtime connection (e.g. block the realtime service in the browser dev tools) while a board is open, and confirm drag & drop, task editing, and navigation continue to work, with a discreet status indicator reflecting the disconnected state.

**Acceptance Scenarios**:

1. **Given** a board is open with an active realtime connection, **When** the connection is lost, **Then** a discreet indicator communicates a temporary "offline" realtime state without any blocking dialog or overlay.
2. **Given** the realtime connection is lost, **When** the member performs drag & drop, task creation, editing, or deletion, **Then** each action completes successfully via the normal save path.
3. **Given** the realtime connection remains unavailable beyond the defined threshold, **When** the threshold is crossed, **Then** the client falls back to periodically refreshing board state so the member still sees other members' changes, just with added latency.
4. **Given** the realtime connection is restored, **When** reconnection succeeds, **Then** the offline indicator clears and live sync resumes without requiring a manual page reload.

---

### User Story 4 - Concurrent edit conflict awareness (Priority: P3)

Two team members edit the same task at nearly the same time. Rather than one edit silently disappearing, the member whose change was overwritten is shown a visual indication that a conflicting edit occurred.

**Why this priority**: Concurrent edits on the exact same task within the exact same moment are a narrow edge case compared to the primary sync and presence flows, but silent data loss would undermine trust in the tool, so it must still be addressed.

**Independent Test**: From two sessions, edit the same field on the same task at nearly the same time and confirm the losing edit is not silently discarded — the affected member sees a conflict indicator.

**Acceptance Scenarios**:

1. **Given** two members editing the same task at nearly the same time, **When** both edits are submitted, **Then** the edit with the later timestamp is the one persisted.
2. **Given** a member's edit was superseded by a near-simultaneous edit from another member, **When** the outcome is resolved, **Then** that member sees a visible conflict indicator on the task rather than their change disappearing without explanation.
3. **Given** a conflict indicator is shown, **When** the member acknowledges or reopens the task, **Then** they see the currently persisted (winning) value, not a mix of both edits.

### Edge Cases

- What happens when a member has the board open in two tabs at once — do they see duplicate presence entries or duplicate echoed events?
- How does the system handle a member losing connection mid-drag (task picked up but drop event never confirmed)?
- What happens if a task is deleted by one member at the same moment another member is actively editing it?
- How does presence behave when a member's session ends abruptly (browser crash, closed laptop) without a clean disconnect signal?
- What happens when a workspace member without board access somehow still receives board events (must be prevented, not just hidden client-side)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST scope realtime events to a single board, so members subscribed to one board never receive events from another board.
- **FR-002**: System MUST broadcast task creation, task updates, task moves (column/position changes), and task deletion to all members currently viewing the affected board.
- **FR-003**: System MUST broadcast column updates to all members currently viewing the affected board.
- **FR-004**: System MUST only broadcast board events to members who have access to that board's workspace; access checks MUST be enforced server-side, not merely by the client choosing not to subscribe.
- **FR-005**: System MUST show, for any open board, the set of workspace members currently viewing that board, updating as members join or leave.
- **FR-006**: System MUST represent each present member with an avatar or initials, styled per the Axiom design system.
- **FR-007**: System MUST reconcile a member's own optimistic local change with the realtime event they subsequently receive for that same change, without visible flicker or duplication.
- **FR-008**: System MUST detect when the realtime connection is lost and present a discreet, non-blocking indicator of the degraded state.
- **FR-009**: System MUST continue to allow all core board interactions (drag & drop, create, edit, delete, navigation) while the realtime connection is unavailable.
- **FR-010**: System MUST fall back to periodically refreshing board state on a fixed interval when the realtime connection has been unavailable for longer than a defined threshold.
- **FR-011**: System MUST clear the degraded-state indicator and resume live event delivery automatically once the realtime connection is restored, without requiring a manual page reload.
- **FR-012**: System MUST resolve concurrent edits to the same task using the most recent edit's timestamp as the persisted value ("last write wins").
- **FR-013**: System MUST visually flag a task when a near-simultaneous conflicting edit occurred, so the member whose edit was superseded is aware their change was not the one saved.
- **FR-014**: System MUST NOT silently discard a losing concurrent edit without surfacing the conflict indicator described in FR-013.

### Key Entities

- **Board Channel**: The realtime scoping unit tied one-to-one with a Board; carries all task/column broadcast events and presence state for that board, and is only joinable by members with access to the board's workspace.
- **Presence Member**: A workspace member's live "viewing this board" state, including identity, display avatar/initials, and join/leave transitions.
- **Board Event**: A broadcastable occurrence (task created, task updated, task moved, task deleted, column updated) carrying enough information for subscribers to update their local view, plus a timestamp used for conflict resolution.
- **Edit Conflict**: The record of two near-simultaneous edits to the same task, tracking which edit won (by timestamp) and which member's edit needs a conflict indicator shown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A task change made by one member is visible to another member viewing the same board in under 1 second, without a manual refresh.
- **SC-002**: A member joining or leaving a board is reflected in other viewers' presence list in under 2 seconds.
- **SC-003**: When the realtime connection is unavailable, 100% of core board interactions (drag & drop, create, edit, delete) continue to succeed with no interface blocking.
- **SC-004**: 100% of concurrent edit conflicts on the same task result in a visible conflict indicator for the superseded edit — never a silent, unexplained data loss.
- **SC-005**: No member ever receives a realtime event for a board outside their workspace access, verified across all board event types.

## Assumptions

- "Nearly simultaneous" edits for conflict detection means edits to the same task received within a short window (a few seconds); exact threshold is an implementation detail left to the planning phase.
- The realtime unavailability threshold that triggers polling fallback is a tunable value decided during implementation, not a user-facing configuration.
- Presence and event delivery are scoped per Board (not per Workspace); a member must have the specific board open to receive its events or appear in its presence list.
- Members without an uploaded avatar are represented using initials-based avatars already established by the Axiom design system.
- Message history / replay of events missed while disconnected is out of scope; on reconnect, the client relies on the polling fallback or a full state refresh rather than replaying missed individual events.
- Native browser push notifications are out of scope for this feature.
