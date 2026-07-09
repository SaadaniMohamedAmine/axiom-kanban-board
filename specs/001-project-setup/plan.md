# Implementation Plan: Project Setup & Foundation

**Branch**: `feat-project-setup` (not yet created — see Constitution Check §III below) | **Date**: 2026-07-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-project-setup/spec.md`

## Summary

Stand up the whole Axiom foundation on a single Next.js 16 (App Router, TypeScript)
project: a working local + production build, a Prisma 7 schema against PostgreSQL
covering every product entity, Better Auth with Google/GitHub/credentials (no email
verification, with an explicit block on cross-provider email collisions), a validated
Pusher Channels realtime round-trip, Zod as the default input-validation layer, and a
public Vercel deployment showing at minimum the approved login/sign-up screen — so the
project is live and demoable from day one instead of at the end.

## Technical Context

**Language/Version**: TypeScript on Next.js 16 (App Router)

**Primary Dependencies**: Next.js 16, Tailwind CSS, Better Auth (+ `@better-auth/prisma` adapter), Prisma ORM 7, Pusher Channels (server + `pusher-js` client), Zod

**Storage**: PostgreSQL via Prisma 7, hosted on Vercel Postgres (see `research.md` §1)

**Testing**: No automated tests are required for this feature — the constitution's
Quality Gates enforce `pnpm build` / `pnpm lint` / `pnpm type-check` (all blocking), not
a test suite, for this phase. Acceptance scenarios in `spec.md` are validated manually
via `quickstart.md`. Playwright is the project's standard e2e tool (`TECH-STACK.md`) and
will be introduced starting from the phase that adds real user-facing flows worth
regression-testing (Phase 3+).

**Target Platform**: Vercel (serverless Next.js hosting), single production environment

**Project Type**: Web application — single Next.js project (frontend + backend
co-located via API routes/Server Actions), no separate backend service

**Performance Goals**: Realtime test message delivered to a subscribed client in <1s (SC-004); no other throughput target at this phase

**Constraints**: Zero secrets in source control (FR-007); WCAG AA on the login/sign-up screen — 4.5:1 text contrast, full keyboard operability (SC-006); LCP <2.5s / CLS <0.1 on public pages per `NON-FUNCTIONAL-REQUIREMENTS.md`

**Scale/Scope**: Single developer, single environment, portfolio-scale traffic — no concurrency/scale target for this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Clean Code | No dead code / `console.log` / magic strings in delivered code | ✅ Planned for — enforced at implementation/review time, nothing in this plan conflicts |
| II. TypeScript Strict Mode | Strict `tsconfig.json`, no untyped `any`, shared types in `*.types.ts` | ✅ Next.js TS scaffold + `src/types/*.types.ts` convention in Project Structure below |
| III. Feature Branch Discipline | `feat-<name>` branch MUST exist **before any speckit step** | ❌ **VIOLATED ALREADY** — this repository has no git history yet (not even `git init`), so `/speckit-specify` and this `/speckit-plan` both ran with no branch. See Complexity Tracking below for the required remediation before `/speckit-tasks`/implementation proceeds. |
| IV. Pre-Push Build Verification | `pnpm build`/`lint`/`type-check` pass before push | ✅ Not yet applicable (nothing pushed) — will gate the first push |
| V. Security & Scope Integrity | No secrets committed; Prisma-only queries; server-side permission checks; `workspaceId` scoping | ✅ FR-007 covers secrets; this feature creates no workspace-scoped queries yet (no `Workspace`/`Board`/`Task` rows produced — see `data-model.md` consistency notes) |
| VI. Progress Documentation | `PROGRESS.md` updated after merge | ⏳ Deferred to post-merge, tracked as a task |

**Gate result**: One violation (III), remediation captured in Complexity Tracking. All
other gates pass as designed. Proceeding to Phase 0/1 design is safe since no code has
been written yet, but **the branch must be created before `/speckit-tasks` generates
any implementation task**, per the constitution's own ordering rule.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output
│   ├── auth-conflict.md
│   └── realtime-test-channel.md
└── tasks.md              # Phase 2 output (/speckit-tasks — not created by this command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── sign-up/page.tsx
│   ├── api/
│   │   └── auth/[...all]/route.ts   # Better Auth catch-all handler
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts                      # Better Auth server config (providers, adapter, conflict check)
│   ├── auth-client.ts                # Better Auth React client
│   ├── prisma.ts                     # Prisma client singleton
│   ├── pusher.ts                     # Pusher server + client helpers
│   └── validations/                  # Zod schemas (auth forms first)
└── types/
    └── *.types.ts                    # shared types (constitution Principle II)

prisma/
├── schema.prisma
└── migrations/

public/
.env.local                            # git-ignored, never committed
next.config.ts
tailwind.config.ts
tsconfig.json
```

**Structure Decision**: Single Next.js project (Option 1, adapted to Next.js App Router
conventions) — no separate frontend/backend service, matching `TECH-STACK.md`'s
"tout-Next.js" architecture decision and the constitution's minimal-infrastructure
rationale for a solo developer.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Principle III (Feature Branch Discipline) not yet satisfied — no git repository exists, so `/speckit-specify` and `/speckit-plan` ran directly against an unbranched, uninitialized working tree | Speckit's spec/plan authoring had to start somewhere, and the project only reached the point of needing a first feature branch *during* this very setup feature — there was no prior branch to create it from | Not applicable — this isn't a design trade-off, it's a sequencing gap that must be closed before `/speckit-tasks`: run `git init`, commit nothing yet, create `feat-project-setup` from a first commit on `main` (or directly as the initial branch), then re-run the constitution's Spec Preparation Commit step (`feat: prepare-spec-project-setup`) to bring `spec.md`/`plan.md`/`research.md`/`data-model.md`/`quickstart.md`/`contracts/` into that commit before any implementation task begins |
