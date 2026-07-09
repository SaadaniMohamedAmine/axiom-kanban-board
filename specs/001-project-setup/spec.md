# Feature Specification: Project Setup & Foundation

**Feature Branch**: `001-project-setup`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Initialiser le projet Axiom sur une base Next.js 16 tout-intégré (frontend + backend + DB + auth + realtime), sans service séparé, déployée dès le premier jour sur Vercel pour avoir un environnement live continu plutôt qu'un 'big bang' en fin de projet." (see `docs/001-setup.md`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Working local development environment (Priority: P1)

A solo developer starts from an empty repository and needs a scaffolded application that runs locally and builds cleanly, so they can begin building screens immediately.

**Why this priority**: Nothing else in the project can be built, tested, or demonstrated without a working local environment. This is the hard blocker for every subsequent story and every future phase.

**Independent Test**: Clone the repository, install dependencies, start the local dev server, and run the production build — both must succeed with zero errors.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** the developer installs dependencies and starts the local dev server, **Then** the application boots without errors and renders a page in the browser.
2. **Given** the project source, **When** the developer runs the production build, **Then** the build completes with zero errors.

---

### User Story 2 - Persisted data foundation (Priority: P2)

A developer needs a provisioned database whose schema matches the product's data model, so that Phase 3 (core Kanban) can start persisting real data without a schema migration blocking it.

**Why this priority**: Every product feature after setup depends on data being persisted correctly. Validating the schema now avoids costly rework once feature work starts.

**Independent Test**: Run the first migration against the database and query at least one table to confirm connectivity, in both local and production environments.

**Acceptance Scenarios**:

1. **Given** a configured database connection, **When** the first migration is run, **Then** every entity defined in the product's data model exists as a table, with none missing.
2. **Given** production database credentials are configured, **When** the application queries the database in production, **Then** the query succeeds without a connectivity error.

---

### User Story 3 - Frictionless account creation (Priority: P3)

A future user needs to create an account via Google, GitHub, or email/password without any email-verification step, so they can reach an authenticated session immediately.

**Why this priority**: Account creation is the entry point to every user-facing feature. A broken or high-friction sign-up blocks all downstream user testing and public demo access.

**Independent Test**: Create an account through each of the three supported methods and confirm each lands the user in an authenticated session with no confirmation-email step required.

**Acceptance Scenarios**:

1. **Given** a new visitor on the sign-up screen, **When** they authenticate via Google, **Then** an account is created and they land in an authenticated session with no extra verification step.
2. **Given** a new visitor on the sign-up screen, **When** they authenticate via GitHub, **Then** an account is created and they land in an authenticated session with no extra verification step.
3. **Given** a new visitor on the sign-up screen, **When** they register with email and password, **Then** an account is created and they land in an authenticated session without clicking a confirmation email.
4. **Given** an email already tied to an account created via a different method, **When** someone attempts to sign up with that same email through a new method, **Then** the sign-up is blocked with an explicit error naming the method already associated with that email.

---

### User Story 4 - Validated realtime channel (Priority: P4)

A developer needs a working realtime publish/subscribe channel validated ahead of time, so the Phase 4 realtime board integration starts from a proven foundation instead of debugging infrastructure and feature logic at the same time.

**Why this priority**: De-risking the realtime provider now is far cheaper than discovering a broken or misconfigured integration mid-way through Phase 4 feature work.

**Independent Test**: Publish a message on a test channel and confirm a subscribed client receives it within the target latency.

**Acceptance Scenarios**:

1. **Given** a client subscribed to a test realtime channel, **When** a test message is published, **Then** the client receives the message in under 1 second.

---

### User Story 5 - Live production environment (Priority: P5)

The project owner needs a publicly reachable production URL as soon as setup completes, so project progress is visible continuously rather than revealed in a single release at the end.

**Why this priority**: Continuous live deployment is a stated project goal (avoiding a "big bang" release) and gives the owner and any early viewer a real, working artifact from day one — important for a portfolio project.

**Independent Test**: Visit the public production URL from outside the development machine and confirm the login screen renders and is reachable.

**Acceptance Scenarios**:

1. **Given** the project is deployed, **When** anyone visits the public production URL, **Then** the application loads and displays at minimum a functional login/sign-up screen.
2. **Given** the deployed environment, **When** its configuration is inspected, **Then** no secret value is present anywhere in the Git repository history or source files.

---

### Edge Cases

- What happens when someone signs up with email/password using an email address that already has a Google or GitHub account on it? The sign-up is blocked with an explicit error pointing to the method already tied to that email (see FR-011).
- What happens when the database is unreachable during the first migration attempt?
- What happens when the realtime provider is unreachable during the test publish/subscribe check?
- What happens when a required environment variable is missing at deploy time?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a working application scaffold (typed language, styled UI layer) that starts locally and builds for production with zero errors.
- **FR-002**: System MUST persist every entity defined in the product's data model (user identity entities, workspace, board, column, task and its related sub-entities, sprint, AI log, notification) in the database schema, with no entity missing or extraneous.
- **FR-003**: System MUST apply the first database migration successfully and confirm connectivity in both the local and production environments.
- **FR-004**: System MUST let a user create an account via Google, GitHub, or email/password, and MUST NOT require an email-verification step for any of the three methods.
- **FR-005**: System MUST reliably persist authenticated identity data (account, session) regardless of which of the three sign-up methods was used.
- **FR-006**: System MUST support a minimal realtime publish/subscribe check that delivers a test message to a subscribed client in under 1 second.
- **FR-007**: System MUST keep all secrets (database, authentication, realtime, AI provider credentials) out of source control at all times, in local and production environments alike.
- **FR-008**: System MUST be reachable at a public production URL immediately after setup completes, displaying at minimum a functional login/sign-up screen.
- **FR-009**: System MUST validate every future API/server-action input through one consistent, centrally-defined validation approach, established as the default for all work after this feature.
- **FR-010**: The login/sign-up screen MUST match the already-approved design (visual and structural) rather than an ad hoc interim design; this constraint carries forward to all UI work in later features.
- **FR-011**: System MUST block a sign-up attempt whose email matches an existing account created through a different method, and MUST show an explicit error directing the person to the method already associated with that email — accounts are never auto-linked or silently duplicated across methods.

### Key Entities *(include if feature involves data)*

- **User**: A person's platform-level identity — name, email, avatar. Not tied to any single workspace.
- **Account**: A single sign-in method (Google, GitHub, or credentials) linked to a User.
- **Session**: An active authenticated login for a User.
- **Verification**: Identity-verification record required by the authentication layer's data model, though the email-verification flow itself is disabled for this project.
- **Workspace**: A top-level container a User can own or belong to; owns boards.
- **WorkspaceMember**: A User's membership and role (Owner/Admin/Member/Viewer) within a Workspace.
- **Invitation**: A pending, accepted, or expired invite for someone to join a Workspace.
- **Board**: A Kanban board within a Workspace, following one of a fixed set of templates.
- **Column**: An ordered stage within a Board that holds Tasks.
- **Task**: A unit of work within a Board/Column, with its own human-readable code, priority, and estimate.
- **TaskAssignee / Label / TaskLabel**: Task-to-user assignment and label-tagging relationships.
- **Comment**: A message left on a Task.
- **ActivityEvent**: A recorded change on a Task (status change, assignment, comment, etc.).
- **Sprint**: A time-boxed grouping of Tasks within a Board.
- **AILog**: A record of an AI-generated suggestion, its input/output, and any user feedback on it.
- **Notification**: A message delivered to a User about an event relevant to them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can go from a fresh clone to a running local environment, and from source to a production build, with zero build errors in either case.
- **SC-002**: 100% of the product's defined data entities exist and are queryable in the database immediately after setup, with zero discrepancies from the data model.
- **SC-003**: A new user completes account creation through any of the three supported methods and reaches an authenticated session, with zero required extra verification steps.
- **SC-004**: A realtime test message reaches a subscribed client in under 1 second, on 100% of test runs.
- **SC-005**: The production environment is publicly reachable as soon as setup completes, with zero secret values exposed anywhere in the repository.
- **SC-006**: The login/sign-up screen meets the product's accessibility bar (full keyboard operability, minimum 4.5:1 text contrast) from day one.

## Assumptions

- The specific managed PostgreSQL host is left to implementation (Vercel Postgres, Neon, or Supabase per `TECH-STACK.md`); this spec assumes Vercel Postgres as the default since it integrates natively with the single-service Vercel deployment target the project has already committed to, minimizing the number of external services a solo developer maintains.
- Standard default session duration and password policy are used, since none is specified in the source documents.
- Workspace creation and onboarding are out of scope for this feature — it establishes the User/Account/Session identity layer only, not the first Workspace a new user lands in.
- AI provider (Groq/Gemini) environment variables are provisioned now per the source requirements, but no AI functionality is built or exercised in this feature — this only prepares configuration ahead of the later AI feature phase.
- A single production environment is used; no separate staging environment is in scope for this project.
- No functional screen other than the minimal login/sign-up screen is in scope for this feature — the full product UI is built in later features.
- No CI/CD pipeline beyond Vercel's automatic deploy-on-push is in scope; a formal CI/test badge is a later feature's concern.
