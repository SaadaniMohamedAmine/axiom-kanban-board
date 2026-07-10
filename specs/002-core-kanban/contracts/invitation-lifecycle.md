# Contract: Workspace invitation lifecycle (FR-003, FR-015, edge case in spec.md)

## Behavior

1. `inviteMember(workspaceId, email, role)` — requires `requireRole(workspaceId,
   'ADMIN')`.
2. Before creating the `Invitation`, the action checks, in order:
   - Does a `WorkspaceMember` already exist for this `workspaceId` + a user whose
     `email` matches? If so, reject with `error.code = ALREADY_MEMBER`, no row
     created.
   - Does a `PENDING`, non-expired `Invitation` already exist for this
     `workspaceId` + `email`? If so, reject (or no-op and return the existing
     invitation — implementation may choose either, but must not create a second
     row) with `error.code = INVITATION_ALREADY_PENDING`.
3. If neither check fires, create the `Invitation` with `status: PENDING`,
   `expiresAt: now() + 7 days`, and a fresh unique `token`.
4. `acceptInvitation(token)`:
   - Loads the `Invitation` by `token`.
   - If `status !== PENDING`: reject (`error.code = INVITATION_NOT_PENDING`).
   - If `status === PENDING` and `expiresAt < now()`: update `status` to `EXPIRED`
     in the same call, then reject (`error.code = INVITATION_EXPIRED`) — this is the
     lazy-expiry transition (research.md §8).
   - Otherwise: create the `WorkspaceMember` row (`role` from the invitation,
     `joinedAt: now()`), set the `Invitation.status` to `ACCEPTED`, in one
     transaction.
5. Listing invitations for a workspace (`OWNER`/`ADMIN` only) computes an *effective*
   status for display — a `PENDING` row whose `expiresAt` has passed is shown as
   "Expired" in the UI even before the lazy DB transition has fired — without
   requiring a write on every list render.

## Acceptance mapping

Implements `spec.md` User Story 3 (Acceptance Scenarios 3–4) and the "duplicate
invitation" edge case.
