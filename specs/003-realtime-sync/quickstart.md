# Quickstart: Validating Realtime Board Collaboration

Manual validation guide — no automated suite for this feature (`plan.md` Technical
Context). Requires two browser sessions logged in as two different members of the
same workspace with access to the same board (e.g. one normal window + one private/
incognito window, or two different browsers).

## Prerequisites

- `.env.local` has valid `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`,
  `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` (see
  `.env.example`) pointing at a real Pusher app (free tier is sufficient).
- `pnpm build` and the migration adding `Task.createdAt`/`updatedAt`
  (`data-model.md`) have been applied (`pnpm prisma migrate dev` or equivalent).
- Two workspace members exist with access to the same board (seed data or manual
  signup + invite).

## Scenario 1 — Live task sync (User Story 1, SC-001)

1. Open the same board as Member A (window 1) and Member B (window 2).
2. In window 1, create a task. **Expected**: it appears in window 2 within ~1s
   without a refresh.
3. In window 1, drag the task to a different column/position. **Expected**: window
   2 reflects the same column/position within ~1s.
4. In window 1, edit the task's title, then delete the task. **Expected**: both
   changes appear in window 2 within ~1s.
5. Repeat step 2 from window 1 while window 1 itself is watched closely.
   **Expected**: no flicker, duplicate card, or momentary stale state in window 1
   (own-echo exclusion — `research.md` §2).
6. Open a second, different board in window 2 (Board C). Perform an action on the
   original board from window 1. **Expected**: nothing changes on Board C's view.

## Scenario 2 — Presence (User Story 2, SC-002)

1. With window 1 already on the board, open the same board in window 2.
   **Expected**: window 1's presence roster shows Member B within ~2s.
2. Close window 2 (or navigate away). **Expected**: window 1's presence roster
   removes Member B within ~2s.
3. Inspect the presence avatar for a member without an uploaded profile image.
   **Expected**: initials-based avatar styled per `axiom-design/axiom/DESIGN.md`
   (circular, design-system colors) — not a generic gray circle.

## Scenario 3 — Graceful degradation (User Story 3, SC-003)

1. With the board open and the connection indicator showing a healthy/live state,
   open browser devtools and block the Pusher WebSocket/domain (Network conditions
   → block request domain, or toggle offline scoped appropriately).
2. **Expected**: within a few seconds, a discreet indicator communicates a
   degraded/offline realtime state — no blocking modal or overlay.
3. While still blocked, create a task, drag a task, edit a task, and navigate to
   another board and back. **Expected**: every action completes normally via the
   standard save path.
4. Wait past the 8s threshold (`research.md` §5). **Expected**: the board's task
   list still reflects other members' changes (made from window 2, unaffected by
   window 1's block), refreshing roughly every 5s.
5. Unblock the domain. **Expected**: the indicator clears and live event delivery
   resumes without a manual page reload.

## Scenario 4 — Concurrent edit conflict (User Story 4, SC-004)

1. In both windows, open the same task's detail view.
2. In window 1, edit a field (e.g. title) and save.
3. Within a few seconds, in window 2 — without refreshing, so it still has the
   pre-edit `expectedUpdatedAt` — edit a different value into the same field and
   save.
4. **Expected**: window 2's edit is the one persisted (later timestamp wins).
5. **Expected**: window 1 shows a visible conflict indicator on the task (its edit
   was superseded), not a silent loss.
6. Reopen the task from window 1. **Expected**: the displayed value is window 2's
   (the winning write) cleanly — not a merge of both edits.

## Sign-off

All four scenarios passing across two real browser sessions is the completion bar
for this feature's manual QA, consistent with Feature 002's precedent of
`quickstart.md`-driven acceptance in lieu of an automated suite.
