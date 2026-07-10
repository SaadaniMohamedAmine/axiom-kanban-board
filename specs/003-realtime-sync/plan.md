# Implementation Plan: Realtime Board Collaboration

**Branch**: `feat-realtime-sync` (created before `/speckit-specify`, per Constitution
§III) | **Date**: 2026-07-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-realtime-sync/spec.md`

## Summary

Wire up the Pusher Channels integration that Feature 002 already scaffolded
(`src/lib/pusher.ts`, `src/lib/pusher-client.ts`, both dependencies installed) but
never connected to a live channel. One **presence channel per board**
(`presence-board-{boardId}`) serves double duty: it carries every task/column
broadcast event (FR-001–FR-003) *and* the presence roster (FR-005–FR-006), so there
is exactly one authorization surface and one subscription per board rather than two
parallel channels. A new `/api/pusher/auth` route authorizes that channel
server-side against workspace membership, closing the "no cross-board/cross-workspace
leak" requirement (FR-004) at the source rather than trusting the client. Each
mutating Server Action in `task.actions.ts`/`board.actions.ts` triggers a broadcast
after its Prisma write, excluding the acting client's own connection via Pusher's
`socket_id` exclusion parameter — the built-in mechanism for FR-007's "no flicker on
your own echo" requirement, avoiding a hand-rolled event-diffing layer. Connection
health (FR-008–FR-011) is tracked client-side via `pusher.connection.bind`, driving a
discreet status indicator and a polling fallback after an 8-second unavailability
threshold. Concurrent-edit conflicts (FR-012–FR-014) reuse a lightweight optimistic-
concurrency check on `Task.updatedAt` (a field this feature adds — it didn't exist
yet) rather than a new conflict-tracking table, broadcasting an ephemeral
`task.conflict` event on the same board channel so the superseded editor's own
session — still subscribed — can show the indicator.

## Technical Context

**Language/Version**: TypeScript on Next.js 16 (App Router), continuing Features 001–002

**Primary Dependencies**: `pusher` (server SDK) and `pusher-js` (browser SDK) —
already declared in `package.json` and stubbed in `src/lib/pusher.ts` /
`src/lib/pusher-client.ts` by Feature 002, but not yet used by any route or
component. No new packages required for this feature.

**Storage**: PostgreSQL via Prisma 7 (existing). One migration this feature:
`Task.createdAt` + `Task.updatedAt` (the model currently has neither — see
`data-model.md`), needed as the timestamp basis for FR-012's "last write wins with
timestamp" rule and FR-013's conflict detection. No new tables — presence state and
board events are transient (Pusher-delivered, not persisted), consistent with the
spec's "message history / replay out of scope" assumption.

**Testing**: No automated test suite (unchanged from Features 001–002 — acceptance
scenarios validated manually via `quickstart.md` with two browser sessions), gated by
`pnpm build`/`lint`/`type-check` per Constitution §IV. Realtime/network-drop scenarios
are inherently awkward to unit-test without a Pusher mock harness the project doesn't
have yet; manual QA with devtools throttling is the pragmatic choice at this scale
(consistent with Feature 002's same call on drag & drop).

**Target Platform**: Vercel (serverless Next.js hosting) + Pusher Channels free tier,
same as declared in `TECH-STACK.md` — no new environment. Presence channel auth runs
as a Next.js Route Handler (serverless function), same runtime as existing API routes.

**Project Type**: Web application — single Next.js project, unchanged.

**Performance Goals**: Task/column broadcast delivered to other viewers in <1s
(SC-001); presence join/leave reflected in <2s (SC-002) — both are Pusher's typical
delivery latency on the free tier, not a custom performance budget to engineer for.

**Constraints**: Presence channel authorization MUST re-derive workspace membership
server-side on every subscribe (Constitution §V — never trust the client to just not
subscribe to a board it can't see); polling fallback MUST reuse the existing
`workspaceId`-scoped Prisma queries already used for initial board load, not a new
unscoped endpoint; own-echo exclusion MUST NOT depend on the client filtering out its
own user ID client-side (that would still leak a flicker window) — it uses Pusher's
server-side `socket_id` exclusion instead; conflict detection MUST NOT silently drop
data (FR-014) — the losing write's *value* is never persisted, but its *occurrence*
must always reach the superseded editor as a visible indicator.

**Scale/Scope**: Single developer, single environment, portfolio-scale traffic — same
as prior features. Pusher free tier (100 max concurrent connections, 200k
messages/day) is far above what a portfolio demo needs; not a design constraint here.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Clean Code | No dead code / `console.log` / magic strings in delivered code | ✅ Event names and thresholds (8s unavailability, 5s poll interval) are named constants in `src/lib/realtime.ts`, not inline magic values |
| II. TypeScript Strict Mode | Strict `tsconfig.json`, no untyped `any`, shared types in `*.types.ts` | ✅ Continues convention — event payloads and presence member shape added to `src/types/realtime.types.ts` |
| III. Feature Branch Discipline | `feat-<name>` branch MUST exist **before any speckit step** | ✅ `feat-realtime-sync` created before `/speckit-specify` ran |
| IV. Pre-Push Build Verification | `pnpm build`/`lint`/`type-check` pass before push | ⏳ Not yet applicable (nothing pushed) — will gate the first push |
| V. Security & Scope Integrity | No secrets committed; Prisma-only queries; server-side permission checks; `workspaceId` scoping | ✅ `contracts/pusher-channel-auth.md` defines server-side membership re-check on every channel subscribe (not just initial page load); no raw SQL; polling fallback reuses the same `requireRole`-gated, `workspaceId`-scoped queries as initial load; Pusher secret key stays server-only in `src/lib/pusher.ts`, only the public key ships to the client (already the case in the existing `.env.example`) |
| VI. Progress Documentation | `PROGRESS.md` updated after merge | ⏳ Deferred to post-merge, tracked as a task |

**Gate result**: All gates pass. No violations to justify — Complexity Tracking below
is empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-realtime-sync/
├── plan.md                        # This file
├── research.md                    # Phase 0 output
├── data-model.md                  # Phase 1 output
├── quickstart.md                  # Phase 1 output
├── contracts/                     # Phase 1 output
│   ├── pusher-channel-auth.md
│   ├── board-event-broadcast.md
│   ├── conflict-detection.md
│   └── connection-degradation.md
├── checklists/
│   └── requirements.md
└── tasks.md                       # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── pusher/
│           └── auth/
│               └── route.ts           # NEW — presence channel authorization (contracts/pusher-channel-auth.md)
├── components/
│   ├── board/
│   │   └── board-view.tsx             # extended — consumes realtime events, own-socket exclusion
│   ├── task-detail/
│   │   └── task-detail-modal.tsx      # extended — conflict indicator, expectedUpdatedAt on save
│   └── realtime/
│       ├── presence-avatars.tsx       # NEW — no export exists; built from DESIGN.md avatar tokens
│       ├── connection-indicator.tsx   # NEW — no export exists; discreet status pill
│       └── conflict-badge.tsx         # NEW — no export exists; task-level conflict flag
├── hooks/
│   └── use-board-channel.ts           # NEW — subscribe/bind/presence/connection-state hook
├── lib/
│   ├── actions/
│   │   ├── task.actions.ts            # extended — broadcast + conflict check on every mutation
│   │   └── board.actions.ts           # extended — broadcast on every column mutation
│   ├── realtime.ts                    # NEW — server-side trigger helpers + event/threshold constants
│   ├── pusher.ts                      # existing (Feature 002 stub) — now actually used
│   └── pusher-client.ts               # existing (Feature 002 stub) — now actually used
└── types/
    └── realtime.types.ts              # NEW — BoardEvent, PresenceMember, ConflictEvent types

prisma/
├── schema.prisma                      # existing, extended per data-model.md (Task.createdAt/updatedAt)
└── migrations/                        # new migration for the timestamp fields
```

**Structure Decision**: Continues the single Next.js project. Realtime concerns are
grouped under a new `realtime/` component folder and a single `hooks/` directory
(this feature's first client hook — prior features kept state colocated in their
client components, but subscription lifecycle here is genuinely reusable between
`board-view.tsx` and any future presence surface, e.g. a workspace-level "who's
online" list, so it earns the extraction). Server-side broadcast logic is
centralized in `src/lib/realtime.ts` rather than calling `pusher.trigger` directly
from each action — every mutation site needs the same channel-name derivation and
socket-id-exclusion pattern, and centralizing it is what makes FR-001's "no cross-
board leak" auditable in one place instead of re-verified at each call site.

## Complexity Tracking

*No entries — Constitution Check reported zero violations.*
