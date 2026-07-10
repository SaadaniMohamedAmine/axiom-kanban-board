# Contract: Pusher Presence Channel Authorization

## Route

`POST /api/pusher/auth` — a Next.js Route Handler, not a Server Action, because
`pusher-js` posts channel-auth requests as a plain HTTP form body, matching Pusher's
standard client-side auth flow.

## Request

Standard Pusher presence-channel auth request body (sent automatically by
`pusher-js` when a component calls `channel.subscribe()`):

- `socket_id` — the subscribing client's connection ID
- `channel_name` — expected format `presence-board-{boardId}`

## Authorization logic (server-side, MUST run on every request — no caching of a
prior authorization)

1. Read the caller's session via `auth.api.getSession({ headers })` (Better Auth,
   same pattern as every existing Server Action). No session → `401`.
2. Parse `boardId` out of `channel_name`. Reject (`403`) any `channel_name` that
   doesn't match the `presence-board-{boardId}` shape — this is the enforcement
   point that prevents subscribing to an arbitrary/malformed channel string.
3. Look up the `Board` by `boardId`, selecting `workspaceId`. Board not found →
   `403` (not `404` — do not confirm/deny board existence to an unauthorized caller).
4. Re-run the same membership check `requireRole` already performs elsewhere
   (`workspaceId` + `session.user.id` → `WorkspaceMember`), minimum role `VIEWER`
   (presence/viewing doesn't require edit rights — read-only members still see
   live updates). No membership → `403`.
5. On success, call `pusher.authorizeChannel(socket_id, channel_name, { user_id:
   session.user.id, user_info: { id, name, image } })` and return its result
   verbatim as the response body — this is what supplies `PresenceMember` data
   (`data-model.md`) to every other subscriber's presence roster.

## Why this is the FR-004 / FR-001 enforcement point

This endpoint is the *only* place a client can join a board's channel. Because step
4 re-derives membership from the database on every subscribe request (not from a
client-supplied claim, not from a cached prior check), a member removed from a
workspace mid-session cannot rejoin that board's channel on their next reconnect —
closing the gap a purely client-side "don't render the subscribe button" approach
would leave open.

## Non-goals

- Does not distinguish edit vs. view permissions for channel access — that's
  already enforced per-mutation by `requireRole` inside each Server Action
  (Constitution §V); this endpoint only gates *visibility* of board activity, which
  every workspace member (including `VIEWER`) is entitled to per the existing
  permission model.
