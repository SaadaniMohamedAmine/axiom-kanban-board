# Contract: Realtime setup validation channel (FR-006, US4)

A disposable check used only to prove the Pusher integration works before Phase 4
depends on it. Not a product feature — safe to delete once validated.

| Item | Value |
|---|---|
| Channel name | `setup-test` |
| Channel type | Public (no auth endpoint needed for this check) |
| Event name | `ping` |
| Payload | `{ "sentAt": "<ISO-8601 timestamp>" }` |
| Trigger | Server-side publish (script or temporary route), fired once per validation run |
| Client expectation | A subscribed browser client receives the `ping` event and the
  elapsed time between `sentAt` and receipt is under 1 second (SC-004) |

## Pass/fail

- **Pass**: event received, latency < 1s → US4 acceptance scenario satisfied.
- **Fail**: event not received within a reasonable timeout, or Pusher connection
  cannot be established → surfaces as a setup blocker (see `quickstart.md`), not a
  silent failure; the app itself has no runtime dependency on this channel.
