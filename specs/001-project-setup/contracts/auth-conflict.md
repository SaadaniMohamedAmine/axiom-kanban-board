# Contract: Sign-up conflict on duplicate email (FR-011)

Applies to all three sign-up entry points (Google, GitHub, email/password). Better
Auth's default sign-up flow is wrapped so this check runs **before** an `Account` is
created — never after.

## Behavior

1. Sign-up request arrives with an email (from the OAuth profile or the credentials
   form).
2. Server checks whether any `Account` already exists whose `User.email` matches,
   regardless of `providerId`.
3. **If a match exists on a different provider than the one being used**: reject.
   No `User`, `Account`, or `Session` row is created.
4. **If a match exists on the *same* provider** (i.e. this is actually a sign-*in*,
   not a sign-up): proceed as a normal sign-in — this is not a conflict.
5. **If no match exists**: proceed with normal account creation.

## Response contract (conflict case)

| Field | Value |
|---|---|
| HTTP status | `409 Conflict` |
| `error.code` | `EMAIL_ALREADY_LINKED` |
| `error.message` | Human-readable, names the method already tied to the email (e.g. "This email is already registered with Google. Sign in with Google instead.") |
| `error.existingProvider` | `"google"` \| `"github"` \| `"credential"` |

No partial account state is left behind — the operation is all-or-nothing.

## UI contract

The sign-up screen surfaces `error.message` inline near the form (not a generic toast),
and the UI must reuse the approved design from `axiom-design/axiom_sign_up/` for the
error state's placement — no ad hoc error UI (per spec FR-010).
