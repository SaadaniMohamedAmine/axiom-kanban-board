# Research: Project Setup & Foundation

**Feature**: `001-project-setup` | **Date**: 2026-07-09

All broad stack choices (framework, auth library, ORM, realtime provider) were already
decided and validated via web research on 2026-06-27 — see `TECH-STACK.md` for sources
and rationale. This document only resolves the *integration-level* decisions specific to
implementing this feature; it does not re-litigate the stack.

## 1. Database host

- **Decision**: Vercel Postgres.
- **Rationale**: `TECH-STACK.md` names "PostgreSQL (Vercel Postgres ou Neon/Supabase)"
  without picking one. Vercel Postgres provisions and injects `DATABASE_URL` directly
  into the Vercel project with zero extra account/service to manage — consistent with
  the project's explicit "tout-Next.js, infra minimale" architecture decision (single
  deploy target, solo developer). Confirmed as an assumption in `spec.md`.
- **Alternatives considered**: Neon (generous free tier, branching feature — not needed
  at this scale) and Supabase (bundles auth/storage the project doesn't use, since
  Better Auth already owns identity). Both require a second external account with its
  own connection-string rotation; rejected to keep the number of services a solo
  developer maintains at a minimum.

## 2. Better Auth configuration

- **Decision**: Better Auth server instance configured with the Prisma adapter and
  three enabled methods — `google`, `github`, `emailAndPassword` — with
  `emailAndPassword.requireEmailVerification` (and the equivalent OAuth account-linking
  auto-verify flag) explicitly turned off, plus a single Next.js route handler at
  `app/api/auth/[...all]/route.ts` (Better Auth's standard catch-all handler pattern).
- **Rationale**: This is Better Auth's documented integration path for Next.js App
  Router and is the only configuration that satisfies FR-004 (no verification step on
  any of the three methods) without hand-rolling a custom auth flow.
- **Alternatives considered**: Custom credentials-only flow with a hand-written session
  cookie — rejected, duplicates what Better Auth already provides and increases the
  attack surface for a security-sensitive layer.

## 3. Duplicate-email handling across sign-up methods (FR-011)

- **Decision**: Reject the sign-up attempt server-side before an account is created
  when the submitted email already has an account under a different provider. Surface
  it as a distinct, structured error (see `contracts/auth-conflict.md`) rather than
  Better Auth's default silent-link-or-fail behavior.
- **Rationale**: Resolved via user clarification during `/speckit-specify` (Option B):
  block with an explicit error, never auto-link, never create a silent duplicate.
  Because email verification is disabled project-wide, trusting an email match alone
  as proof of ownership would allow account takeover.
- **Alternatives considered**: Auto-link (rejected — takeover risk); allow duplicate
  accounts per email (rejected — confusing product experience, two disconnected
  identities for one person).

## 4. Realtime test-channel validation

- **Decision**: A single throwaway Pusher channel (e.g. `setup-test`) with one event
  (e.g. `ping`), triggered by a manual or scripted publish and observed by a subscribed
  client during setup — not a permanent product feature.
- **Rationale**: FR-006/SC-004 only require proving the Pusher integration works
  end-to-end (publish → deliver in <1s) before Phase 4 depends on it. A disposable
  channel/event avoids introducing product-facing surface for infrastructure
  validation.
- **Alternatives considered**: Wiring the test into a real product channel (e.g. a
  board's update channel) — rejected, that channel doesn't exist until Phase 4 and
  coupling infra validation to unbuilt product code adds unnecessary sequencing risk.

## 5. Secrets & environment variables

- **Decision**: All credentials (`DATABASE_URL`, Better Auth provider secrets, Pusher
  app keys, `GROQ_API_KEY`/`GEMINI_API_KEY`) live in `.env.local` locally (git-ignored)
  and in Vercel's encrypted project environment variables in production — never
  committed, per FR-007 and the constitution's Security & Scope Integrity principle.
- **Rationale**: Direct requirement from `NON-FUNCTIONAL-REQUIREMENTS.md`, explicitly
  citing the PulseAI key-exposure incident as the reason this is non-negotiable.
- **Alternatives considered**: None — this is a hard constraint, not a design choice.

## Outstanding unknowns

None. All Technical Context fields in `plan.md` are resolved; no
`NEEDS CLARIFICATION` markers remain for this feature.
