# Contract: Collision-free task code generation (FR-007)

## Behavior

1. Task creation is a single Server Action, `createTask(boardId, columnId, ...)`,
   which — after `requireRole(workspaceId, 'MEMBER')` passes — opens one Prisma
   `$transaction` that:
   1. Calls `prisma.board.update({ where: { id: boardId }, data: { taskCounter: {
      increment: 1 } } })` — an atomic, parameterized increment (no raw SQL).
   2. Builds `code = "AX-" + <returned counter, zero-padded to 4 digits minimum>`.
   3. Inserts the `Task` row with that `code` in the same transaction.
2. The client never generates, supplies, or influences the code. Any `code` field
   present in a client request payload is ignored.
3. If the transaction fails for any reason (including the extremely unlikely case of
   the `@@unique([boardId, code])` constraint firing — e.g. after manual data
   repair), the whole creation fails and is retried by the caller as a fresh attempt
   (which will simply obtain the next counter value); no task is left in a
   partially-created state.

## Guarantee under concurrency

Two `createTask` calls on the same board, submitted at the same instant, each open
their own transaction against the same `Board` row. Postgres serializes the two
`UPDATE ... RETURNING` statements (second waits for the first transaction's row lock
to release), so they are guaranteed to observe different counter values. This is the
mechanism verified by `spec.md` SC-003 (0% duplicate codes under 10 simultaneous
creations).

## Non-goals

- Codes are **not** reused after a task is deleted — the counter only increments,
  never decrements, so a deleted task's code is never reissued (avoids any
  possibility of two different tasks, past and present, sharing a code in exports,
  links, or activity history).
