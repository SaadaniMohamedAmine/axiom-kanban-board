<div align="center">

# ⚡ Axiom
### The intelligence layer for elite teams

**A production-grade Kanban board with an embedded AI co-pilot** — built end-to-end (auth to billing to deploy) to demonstrate senior full-stack engineering and product thinking, not just CRUD.

[![CI](https://github.com/SaadaniMohamedAmine/axiom-kanban-board/actions/workflows/ci.yml/badge.svg)](https://github.com/SaadaniMohamedAmine/axiom-kanban-board/actions)
[![Live Demo](https://img.shields.io/badge/demo-axiom--kanban--board.vercel.app-3B82F6?style=flat)](https://axiom-kanban-board.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/license-MIT-8B5CF6?style=flat)](#)

**[→ Live demo](https://axiom-kanban-board.vercel.app)** · **[→ API docs](https://axiom-kanban-board.vercel.app/docs/api)** · **[→ Changelog](https://axiom-kanban-board.vercel.app/changelog)** · **[→ Roadmap](https://axiom-kanban-board.vercel.app/roadmap)**

</div>

---

## What it does

Axiom is what a Kanban board looks like when it thinks with you instead of just storing your tasks. Drag-and-drop project management underneath, an AI engine that actually reasons about your backlog on top, and every piece of SaaS infrastructure a real product needs (billing, plan limits, audit trails, realtime sync) wired in — not mocked, not stubbed.

### 🧠 Axiom Intelligence

| Capability | What it does |
|---|---|
| **Priority scoring** | Analyzes context, dependencies, and due dates to recommend the right priority level |
| **Effort estimation** | Suggests story points from task scope, with its reasoning shown, not just a number |
| **Description generation** | Turns a bare task title into a professional, structured description |
| **Blocker detection** | Flags tasks at risk based on inactivity, comment patterns, and column dwell time |
| **Smart assignment** | Recommends the right teammate from current workload distribution |
| **Sprint health summaries** | Plain-language read on burndown pace, overdue count, and blocked tasks |

Streamed token-by-token over SSE via **Groq** (primary, ~180ms first-token latency on Llama 3) with automatic **Gemini** fallback — a single-provider AI feature is a demo, not a product decision.

### 📋 Core project management

- Drag-and-drop Kanban board (`@dnd-kit`) with custom columns, colors, and reordering
- Multi-assignee tasks, labels, priorities, due dates, unique `AX-####` task codes
- Sprint planning with burndown charts and velocity tracking (Recharts)
- Full-text task/board search and a `⌘K` command palette for keyboard-first navigation
- Soft-delete architecture throughout: **archive & restore** for workspaces, boards, and tasks — nothing is ever silently gone, everything has a Trash

### 👥 Realtime collaboration

- Live board updates across every connected session via **Pusher Channels** — drag a card, everyone sees it move
- Presence indicators for who's currently viewing a board
- In-app notification center (bell + toast) covering the full account lifecycle: login, signup, workspace/board/task created or archived or deleted, name/password changes, plan changes — 20+ distinct event types, each localized

### 💳 Billing & plan enforcement

- **Stripe Checkout + Customer Portal**, Free / Pro / Team tiers
- Limits are enforced **server-side**, not just hidden in the UI: workspace count, boards per workspace, team members, and AI requests/day all gate on the real Prisma-stored plan
- A reusable upgrade-prompt modal appears contextually the moment any limit is hit, with the exact tier needed highlighted
- Live usage bars in the sidebar, color-coded (blue → amber at 80% → red at 100%)

### 🔒 Security, audit & developer surface

- **Better Auth**: email/password + Google/GitHub OAuth, session management, account-linking conflict protection
- **Immutable audit log** per workspace — every sensitive action (workspace/board/task lifecycle, member changes, API key events, billing events) is recorded with actor, target, and timestamp, filterable by date/actor/action, exportable to CSV
- **Public REST API** (`/api/v1/`) authenticated via API keys, with **HMAC-SHA256-signed webhooks** for task/board/sprint events
- **Sentry** error monitoring with source-map-resolved stack traces in production

### 🌍 Polish that usually gets cut

- Full **French / English** localization (`next-intl`) — not just UI strings, the AI's own generated content and every email template too
- Dark/light theme with a CSS design-token system, respecting system preference
- Transactional emails (invitation, welcome) via **Resend** + React Email templates
- Guided onboarding tour (`driver.js`) for first-time users
- SEO: dynamic OG images (edge runtime `ImageResponse`), JSON-LD structured data, canonical URLs, sitemap

---

## Why this stack

**Next.js 16 (App Router) over a Fastify + separate frontend** — collocating server logic, UI, and API routes in one repo eliminates a full network hop for every data request, simplifies deployment, and lets me use React Server Components where they matter (the board page renders meaningfully less client JS than a fully hydrated SPA equivalent).

**Better Auth over Auth.js** — I evaluated both. Better Auth ships typed server utilities and first-class Prisma integration with no adapter boilerplate. Switching to it saved roughly 200 lines of hand-rolled session handling.

**Groq (primary) + Gemini (fallback)** — Groq's inference latency on Llama 3 averages ~180ms for my prompt sizes, which makes the streaming feel instant. Gemini Flash is the cold-start fallback — comparable output quality at ~350ms. Never depending on a single AI provider is a production habit, not over-engineering.

**Prisma 7 over Drizzle** — Prisma's type inference on complex joins is mature and stable, and its schema-first approach communicates data-modeling intent more clearly — important for a project meant to demonstrate that intent to reviewers.

**Pusher over self-hosted WebSockets** — at demo scale, running Socket.io adds real infra complexity for no realistic benefit. Pusher Channels gives zero-maintenance realtime on a generous free tier.

**Server-enforced plan limits over UI-only gating** — the single most common shortcut in SaaS side projects is hiding an "upgrade" button in the UI while the backend happily lets you exceed the limit anyway. Every gate in Axiom (workspaces, boards, members, AI requests) is checked in the server action itself, before any database write.

---

## Technical architecture

```
src/
├── app/
│   ├── (auth)/           # Sign-in, sign-up
│   ├── (app)/            # Protected: [workspaceSlug]/* routes (boards, team, settings, audit log...)
│   ├── api/              # Route handlers: AI, billing, webhooks, audit export, public v1 API
│   ├── docs/api/         # Public API documentation (static)
│   ├── pricing/          # Public pricing page
│   └── og/               # Edge OG image generation
├── components/
│   ├── board/            # Kanban UI (drag-and-drop, task cards)
│   ├── ai/               # Axiom Intelligence panel + SSE streaming client
│   ├── ui/               # Design system (buttons, modals, toasts, upgrade modal...)
│   └── settings/         # API key manager, webhook manager, AI quota display
├── lib/
│   ├── auth.ts           # Better Auth config
│   ├── prisma.ts         # Prisma client singleton (driver adapter)
│   ├── ai/               # Groq + Gemini clients, prompts, workspace quota
│   ├── billing/          # Stripe client, plan limits enforcement
│   ├── audit/            # createAuditLog()
│   ├── notifications/    # createNotification() — the 20+ lifecycle event types
│   ├── email/            # Resend client + React Email templates
│   └── api/              # API key generation, webhook HMAC dispatch
├── hooks/                # useKeyboardShortcuts, usePusher, useDebounce
├── contexts/             # Toast, Shortcuts, CommandPalette, Sidebar
└── content/              # changelog/*.md, roadmap.ts (static content)
```

---

## Local setup

```bash
git clone https://github.com/SaadaniMohamedAmine/axiom-kanban-board
cd axiom-kanban-board
pnpm install

# Copy and fill environment variables
cp .env.example .env.local

# Push schema and seed demo data
npx prisma db push
pnpm db:seed

pnpm dev
```

**Required env vars** (see `.env.example`):
- `DATABASE_URL` — PostgreSQL (Neon recommended, use the pooled connection string)
- `BETTER_AUTH_SECRET` — 32+ char random string
- `GROQ_API_KEY` — groq.com
- `GEMINI_API_KEY` — aistudio.google.com
- `PUSHER_*` — pusher.com (free tier sufficient)
- `RESEND_API_KEY` — resend.com
- `STRIPE_SECRET_KEY` / `STRIPE_*_PRICE_ID` — stripe.com (test keys for local)

---

## Test suite

```bash
pnpm test:e2e     # Playwright — auth flow + board CRUD
pnpm lint
pnpm type-check
```

CI runs on every push via GitHub Actions (see `.github/workflows/ci.yml`).

---

## Project context

This is project 02 of a 30-project portfolio built to demonstrate senior-level full-stack and product-management capability. Each project covers a distinct domain (AI tooling, developer tools, SaaS infrastructure, mobile, data visualization). All projects share the same engineering bar: TypeScript strict, tested, deployed on Vercel — and built the way a real product would be, limits enforced server-side and all.

**[Portfolio overview →](https://portfolio-mas-eight.vercel.app/)**
