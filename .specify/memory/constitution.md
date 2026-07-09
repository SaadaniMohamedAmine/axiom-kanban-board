# Axiom Constitution

> Adapté depuis la constitution Verbio v1.4.0. Version initiale pour le projet Axiom (Project 03/30).

## Core Principles

### I. Clean Code

Every file committed to this repository MUST be production-quality:

- No dead code, commented-out blocks, or `TODO` left untracked in `specs/TASKS.md`.
- No magic numbers or magic strings — name constants with `SCREAMING_SNAKE_CASE`.
- Functions MUST do one thing; files MUST have a single, clear responsibility.
- No `console.log` left in committed code — use proper logging or remove before commit.

**Rationale**: A consistently clean codebase reduces cognitive overhead across
the 24-feature roadmap and signals professional quality to the portfolio audience
(recruiters, CTOs).

### II. TypeScript Strict Mode

All TypeScript code MUST comply with strict mode settings in `tsconfig.json`:

- `any` is **forbidden** without an explicit justification comment.
- Every function parameter and return type MUST be explicitly typed.
- Shared types live in `*.types.ts` files; no inline type literals on API boundaries.

**Rationale**: Type safety is the primary guard against runtime errors on Vercel
deployments where failures are public and immediate.

### III. Feature Branch Discipline

Every feature, fix, or refactor MUST live in its own branch:

- Branch naming: `feat-<kebab-case-name>` for features,
  `fix-<kebab-case-name>` for bug fixes, `docs-<name>`, `chore-<name>`.
- One branch = one feature or bug fix. Never mix unrelated work in one branch.
- Branches MUST be merged via squash-merge PR; direct pushes to `main` are **forbidden**.
- Branch names MUST NOT contain uppercase letters or spaces.

**Branch-First Rule**: A dedicated branch `feat-<feature-name>` MUST be created
**before** any speckit step begins — before `/specify`, before any spec file is
written, before any planning document is generated:

- The branch is created from `main` immediately when a new feature is decided.
- All speckit-generated files (`spec.md`, `plan.md`, `tasks.md`) AND all
  implementation code for that feature live on this single branch together.
- There is no separate "spec branch" — one branch contains everything from
  specification to the final implementation commit.

**Spec Preparation Commit**: After running the full speckit sequence
(`/specify` → `/plan` → `/tasks`), all generated markdown files MUST be committed
together in a single dedicated commit **before any implementation task begins**:

- Commit message format: `feat: prepare-spec-<feature-name>`
- This commit MUST be the **first commit** on the feature branch.
- No implementation code may be included in this commit — only spec/plan/tasks files.

**Commit granularity**: Each task in `specs/TASKS.md` MUST produce at least one
dedicated git commit before work on the next task begins:

- Commit messages MUST reference the task ID: `feat: [T001] description of change`.
- A single commit MAY cover one complete task — never multiple tasks in one commit.
- Partial or in-progress work MUST NOT be committed as if a task is done.
- Use Conventional Commits format.

**Final Task Commit Rule**: The last task of a feature is NOT considered complete
until its git commit exists in the branch history. Announcing feature completion
without the final task's commit in history is **forbidden**.

**Rationale**: Isolated branches keep `main` always deployable. Starting the branch
before speckit steps ensures specs and code share a traceable history from day one.

### IV. Pre-Push Build Verification

Before pushing any branch, the developer MUST run:

```bash
pnpm build
```

A push is only allowed if `pnpm build` exits with code 0. Vercel deployments MUST
NOT be the first build check — they are the confirmation, not the gate.

Additionally, `pnpm lint` and `pnpm type-check` MUST pass before opening a PR.

**Rationale**: Vercel crashes on type errors that compile locally are avoidable
and embarrassing on a public portfolio project.

### V. Security & Scope Integrity

Non-negotiable rules:

- Every database query that touches user data MUST include a `workspaceId`
  scope filter — no exceptions. Multi-tenant isolation is the most critical
  security invariant in Axiom.
- No secrets, tokens, or credentials in source code or committed `.env` files
  (leçon retenue de PulseAI — cf. `NON-FUNCTIONAL-REQUIREMENTS.md`).
- No raw SQL string concatenation — use Prisma parameterised queries exclusively.
- Rate limiting MUST remain active on all `/api/ai/*` endpoints in production.
- Server-side permission checks on every mutation — never trust client-side role enforcement alone.

**Rationale**: A breach of `workspaceId` scoping leaks user data. API key exposure
on a public portfolio repo is a direct security and reputational risk.

### VI. Progress Documentation

Every merge into `main` MUST be followed by updating:

- **`PROGRESS.md`** — append the completed feature, phase status, and date.

The rule is merge-triggered, not session-triggered: if a branch is merged, the
documentation update is non-optional regardless of session boundaries.

**Rationale**: `PROGRESS.md` is the portfolio audit trail. It degrades instantly
if documentation lags behind code.

## Development Workflow

Axiom follows a feature-by-feature execution model across 24 docs specs (`docs/`).
Each doc maps to one Speckit cycle and one feature branch.

1. **Branch first** (BEFORE any speckit step): Create `feat-<feature-name>` from
   `main` before running any speckit command.
2. **Spec preparation** (FIRST commit on the branch): Run `/specify` → `/plan` →
   `/tasks`. Once all spec files are generated, commit them immediately:
   ```
   feat: prepare-spec-<feature-name>
   ```
3. **Implementation**: One commit per task, message format `feat: [T001] …`.
4. **Final task**: Verify `git log` contains a commit for the last task before
   declaring the feature done.
5. **PR**: Squash-merge only. PR title becomes the merge commit message.
6. **After every merge**: Update `PROGRESS.md`.

## Quality Gates

A branch MUST pass all of the following before merge:

| Gate | Command | Blocking |
|---|---|---|
| TypeScript build | `pnpm build` | Yes |
| Linting | `pnpm lint` | Yes |
| Type check | `pnpm type-check` | Yes |
| Branch created before speckit steps | Manual PR review | Yes |
| Spec preparation commit present | Manual PR review | Yes |
| Per-task commit discipline | Manual PR review | Yes |
| Final task commit present in history | Manual PR review | Yes |
| `workspaceId` scoping on all DB queries | Manual PR review | Yes |
| No secrets committed | Manual PR review | Yes |
| `PROGRESS.md` updated | Manual post-merge | Yes |

## Governance

This constitution is the highest-authority document in the Axiom repository.
It supersedes any conflicting guidance from AI assistants, editor defaults, or
undocumented conventions.

**Amendment procedure:**

1. Propose the change with rationale in a PR description.
2. Bump version following semantic versioning:
   - `MAJOR`: Principle removal, redefinition, or backward-incompatible change.
   - `MINOR`: New principle or section added.
   - `PATCH`: Wording clarification, typo fix.

**Version**: 1.0.0 | **Ratified**: 2026-07-09 | **Adapted from**: Verbio Constitution v1.4.0
