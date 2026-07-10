# Contract: Connection Degradation & Recovery

## Connection state machine (client-side, driven by `pusher-js`)

`useBoardChannel` binds `pusher.connection.bind('state_change', ({ current }) =>
...)` and maps Pusher's native states onto a small UI-facing state:

| Pusher state | UI state | Indicator shown (FR-008) | Polling fallback |
|---|---|---|---|
| `connecting`, `connected` | `live` | None (or a subtle "Live" affordance — implementation detail for `tasks.md`) | Off |
| `unavailable`, `disconnected`, `failed` | `degraded` | Discreet "temporarily offline" indicator, non-blocking | Starts after 8s continuously in this state (research.md §5) |

Transitioning back to `connected` from any degraded state immediately: clears the
indicator, stops polling, and resumes normal event-driven updates (FR-011) — no
manual reload required. `pusher-js` handles reconnect/backoff internally; this
feature only observes state, it does not implement its own reconnect loop.

## Polling fallback mechanics (FR-010)

While in `degraded` state past the 8s threshold, `board-view.tsx` (via the hook)
calls a new read-only Server Action, `getBoardSnapshot(boardId)`, every 5 seconds
and replaces local column/task state with the result — this is the same shape of
query the board's initial server-rendered load already performs (`page.tsx`,
`workspaceId`-scoped through the board → workspace relation, gated by the same
membership check), just re-run on an interval instead of once. No new query
pattern, no new permission surface.

`getBoardSnapshot` is intentionally *not* wired into normal (non-degraded)
operation — it exists solely as the degraded-mode fallback path, so its polling
interval has zero cost when realtime is healthy (FR-009/FR-010's scope: this is a
fallback, not a permanent parallel sync mechanism).

## What must keep working while degraded (FR-009)

Explicitly, none of the following depend on the Pusher connection being healthy,
because they always went through Server Actions + optimistic local state, never
through the realtime channel itself:

- Drag & drop (`moveTask` — optimistic update applies locally regardless of
  broadcast success, per `contracts/board-event-broadcast.md`'s "failed broadcast
  must not fail the mutation" rule)
- Task create/edit/delete
- Navigation between boards/workspaces

The realtime layer is additive (faster, cross-session sync) on top of an
already-functional request/response app — this feature must not introduce any
code path where a component blocks rendering or interaction on `pusher.connection`
being in a particular state.

## Manual verification

Per `plan.md`'s testing approach (no automated realtime test harness), degraded
state is verified in `quickstart.md` by blocking Pusher's domain in browser
devtools (Network conditions → block request domain, or offline toggle scoped to
the Pusher WebSocket) and observing: indicator appears, interactions keep working,
polling begins after ~8s, indicator clears and polling stops on unblocking.
