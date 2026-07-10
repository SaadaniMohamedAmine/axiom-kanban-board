# Phase 0 Research: Realtime Board Collaboration

No `[NEEDS CLARIFICATION]` markers remained in `spec.md`, so this research resolves
implementation-level unknowns the Technical Context raised rather than product
ambiguity.

## 1. One presence channel per board vs. separate public + presence channels

**Decision**: A single **presence channel** per board, named `presence-board-{boardId}`,
carries both the broadcast events (FR-002/FR-003) and the presence roster
(FR-005/FR-006).

**Rationale**: Pusher presence channels are a superset of private channels — they
require the same server-side authorization endpoint and support arbitrary
`client.trigger`/server `trigger` events *in addition to* join/leave tracking. Using
one channel means one authorization check, one subscribe/unsubscribe lifecycle, and
one place (`contracts/pusher-channel-auth.md`) where the "no cross-board leak"
guarantee (FR-001/FR-004) lives. Splitting into a public events channel + a separate
presence channel would double the subscription bookkeeping for no isolation benefit,
since both would need the same membership check anyway.

**Alternatives considered**: Separate `private-board-{id}` (events) +
`presence-board-{id}` (presence) channels — rejected as unnecessary duplication for
this scale. Public (unauthenticated) channel — rejected outright, fails FR-004's
server-side access requirement.

## 2. Excluding the acting client's own broadcast (FR-007)

**Decision**: Every `pusher.trigger(...)` call from a Server Action passes the
acting client's Pusher `socket_id` in the trigger options, which tells Pusher to
skip delivering that event back to the connection that owns that `socket_id`. The
client obtains its own `socket_id` from `pusherClient.connection.socket_id` and
forwards it as an argument to the Server Action alongside the mutation payload.

**Rationale**: This is Pusher's documented, built-in mechanism for exactly this
problem — it fully eliminates the "did I just receive my own event" reconciliation
logic that a manual approach (comparing actor IDs, deduping by event ID/timestamp)
would require, and it's the difference between "no flicker" as a Pusher-guaranteed
property versus "no flicker most of the time, race-condition-permitting" with a
client-side dedupe heuristic.

**Alternatives considered**: Client-side dedupe by tagging outgoing broadcasts with
the actor's user ID and ignoring events where `event.actorId === currentUserId` —
rejected: a duplicate render can still occur between the optimistic local update and
the (unsuppressed) echo arriving over the wire, and this reimplements a solved
problem. Debounce/merge on the client — rejected as unnecessary complexity once
`socket_id` exclusion is available.

## 3. Own-connection tracking across a component remount

**Decision**: `socket_id` is read fresh from `getPusherClient().connection.socket_id`
at the moment each Server Action is called (not cached at mount time), and the hook
re-subscribes on `boardId` change. If `socket_id` is briefly unavailable
(connection still establishing), the action simply omits the exclusion parameter —
worst case is one flicker on that single action, which self-heals once connected;
this is strictly better than blocking the mutation on connection readiness.

**Rationale**: Keeps optimistic UI (Feature 002) as the source of truth for
immediate feedback; the exclusion is a pure enhancement, never a requirement for the
mutation to proceed (FR-009 — core interactions must work even without realtime).

## 4. Conflict detection strategy (FR-012–FR-014)

**Decision**: Optimistic concurrency on `Task.updatedAt`. When a client opens a task
for editing, it records the task's current `updatedAt`. On save, `updateTaskFields`
accepts that value as `expectedUpdatedAt` and compares it to the task's actual
current `updatedAt` in the same transaction. If they differ, someone else's write
landed in between: the incoming write still applies (last write wins, per FR-012 and
the existing NFR wording), but the action additionally broadcasts a `task.conflict`
event on the board channel carrying `{ taskId, supersededActorId, field }`, where
`supersededActorId` is the actor of the ActivityEvent that changed `updatedAt`
between the reader's snapshot and now. Every client on the board channel receives
it; the one whose own user ID matches `supersededActorId` shows the conflict
indicator (FR-013) — since that member is, by definition, still subscribed to the
same board channel they were editing from.

**Rationale**: Reuses infrastructure this feature is already building (the board
channel, ActivityEvent's existing actor trail) instead of introducing a persisted
"conflict" table, which the spec's Key Entities section deliberately describes as a
*record* of a conflict, not necessarily a stored one — presence/events are already
established as transient in this feature. Matches the NFR's explicit wording:
"dernière écriture gagnante avec horodatage... conflit signalé visuellement."

**Alternatives considered**: Persist an `EditConflict` row (audit trail of who lost
which write) — rejected as out of scope; the spec's "message history / replay" is
explicitly out of scope and a persisted conflict log is the same category of
feature. Client-side timestamp comparison only (no server check) — rejected: trusting
the client to detect its own staleness is unenforceable and easy to bypass, and the
whole point of FR-014 is that the *server* must guarantee the indicator fires.

## 5. Realtime unavailability threshold and polling fallback (FR-006/FR-010)

**Decision**: 8 seconds of continuous disconnection (tracked via
`pusher.connection.bind('state_change', ...)`, watching for `unavailable`/`failed`
states) triggers the polling fallback; while degraded, the client re-fetches the
board's current state every 5 seconds via a plain Server Action
(`getBoardSnapshot(boardId)`, reusing the same `workspaceId`-scoped Prisma query
shape as the initial page load) until the Pusher connection reports `connected`
again.

**Rationale**: Pusher's own client typically recovers from a transient blip in a
few seconds via its internal retry/backoff, so an 8s threshold avoids flapping the
UI into "offline mode" for a connection that's about to self-heal — the discreet
indicator (FR-008) still appears immediately on any disconnect, independent of the
polling threshold, so the user is never left thinking everything is fine. 5s poll
interval balances staying reasonably fresh against not hammering the server while
already degraded.

**Alternatives considered**: Immediate fallback to polling on first disconnect —
rejected, would cause needless load/flicker on Pusher's normal reconnect cycles.
Exponential backoff polling — rejected as unneeded complexity at this scale; fixed
5s is simple and sufficient for a portfolio-scale board.

## 6. Presence avatar/initials component

**Decision**: New `components/realtime/presence-avatars.tsx`, built directly from
`axiom-design/axiom/DESIGN.md`'s token system (circular geometric initials avatars,
per the design system's documented avatar rule) — no Stitch export exists for a
presence roster, consistent with how Feature 002 handled `task-properties-panel.tsx`
and `sprint-panel.tsx` (components with no 1:1 export, built from tokens directly).

**Rationale**: Matches the spec's explicit UI constraint (`features/003-realtime.md`
— "pas de composant générique non stylé") and the established Feature 002 precedent
for token-derived components.

**Alternatives considered**: Generic unstyled avatar stack (e.g. plain initials in a
circle with no design-system color/typography) — explicitly rejected by the source
feature doc's implementation constraint.
