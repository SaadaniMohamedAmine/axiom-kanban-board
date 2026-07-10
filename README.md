# Axiom — AI-Powered Kanban Board

> Portfolio project 02/30 | Senior Frontend Dev & Product Tech Manager

[![CI](https://github.com/YOUR_GITHUB/axiom-kanban-board/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GITHUB/axiom-kanban-board/actions)
[![Live Demo](https://img.shields.io/badge/demo-axiom--kanban.vercel.app-8B5CF6?style=flat)](https://axiom-kanban.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org)

Axiom is a production-grade Kanban board with an embedded AI co-pilot ("Axiom Intelligence") — built as a portfolio project to demonstrate engineering depth, product thinking, and full-stack delivery from zero to launch.

**[→ Live demo](https://axiom-kanban.vercel.app)** · **[→ API docs](https://axiom-kanban.vercel.app/docs/api)** · **[→ Changelog](https://axiom-kanban.vercel.app/changelog)**

---

## What it does

| Feature | Details |
|---|---|
| **Kanban board** | Drag-and-drop columns and tasks, custom labels, multi-assignee |
| **Axiom Intelligence** | AI priority, effort estimation, description enrichment, blocker detection, smart assignment — via Groq (primary) + Gemini (fallback) with SSE streaming |
| **Sprint analytics** | Burndown chart, velocity tracking, sprint management |
| **Realtime** | Live board updates across sessions via Pusher Channels |
| **Dark / Light mode** | CSS token system with next-themes |
| **PWA** | Installable, offline-capable via @ducanh2912/next-pwa |
| **i18n** | FR / EN via next-intl, locale persisted per user |
| **Public API** | REST `/api/v1/` authenticated with API Keys (HMAC-SHA256 webhooks) |
| **Billing** | Stripe Checkout + Customer Portal, Free/Pro/Team plans with server-enforced limits |
| **Audit log** | Immutable workspace event trail with CSV export |
| **Transactional emails** | Invitation, welcome, task assignment via Resend + React Email |
| **Onboarding tour** | driver.js guided walkthrough on first login |
| **SEO & OG** | Metadata API, dynamic OG image via ImageResponse edge runtime |

---

## Why this stack

**Next.js 16 (App Router) over a Fastify + separate frontend** — collocating server logic, UI, and API routes in one repo eliminates a full network hop for every data request, simplifies deployment, and lets me use React Server Components where they matter (board page renders ~40% less client JS than a fully hydrated SPA equivalent).

**Better Auth over Auth.js** — I evaluated both. Better Auth ships typed server utilities and first-class Prisma integration with no adapter boilerplate. Switching to it saved ~200 lines of session handling code.

**Groq (primary) + Gemini (fallback)** — Groq's inference latency on Llama 3 averages 180ms for my prompt sizes, which makes the streaming feel instant. Gemini flash is the cold-start fallback — same output quality at ~350ms. Never relying on a single provider is a production habit, not over-engineering.

**Prisma 7 over Drizzle** — Prisma's type inference on complex joins is mature and stable. Drizzle is faster at runtime but the DX for relational queries is rougher. For a portfolio project demonstrating data modeling depth, Prisma's schema-first approach communicates intent more clearly.

**Pusher over self-hosted WebSockets** — At demo scale (a few concurrent users), running Socket.io adds infra complexity with no benefit. Pusher Channels is zero-maintenance realtime with a generous free tier.

---

## Technical architecture

```
src/
├── app/
│   ├── (auth)/           # Sign-in, sign-up
│   ├── (app)/            # Protected: [workspaceSlug]/* routes
│   ├── api/              # Route handlers: AI, billing, webhooks, audit
│   ├── docs/api/         # Public API documentation (static)
│   ├── pricing/          # Public pricing page
│   └── og/               # Edge OG image generation
├── components/
│   ├── board/            # Kanban UI (drag-and-drop, task cards)
│   ├── ui/               # Design system (Button, Modal, Toast, Skeleton...)
│   ├── ai/               # Axiom Intelligence panel + streaming
│   └── settings/         # API key manager, webhook manager
├── lib/
│   ├── auth.ts           # Better Auth config
│   ├── prisma.ts         # Prisma client singleton
│   ├── ai/               # Groq + Gemini, rate limiting, workspace quota
│   ├── billing/          # Stripe client, plan limits enforcement
│   ├── audit/            # createAuditLog()
│   ├── email/            # Resend client + 3 React Email templates
│   └── api/              # API key generation, webhook HMAC dispatch
├── hooks/                # useKeyboardShortcuts, usePusher, useDebounce
├── contexts/             # Toast, Shortcuts, CommandPalette
└── content/              # changelog/*.md, roadmap.ts (static content)
```

---

## Local setup

```bash
git clone https://github.com/YOUR_GITHUB/axiom-kanban-board
cd axiom-kanban-board
pnpm install

# Copy and fill environment variables
cp .env.example .env.local

# Push schema and seed demo data
npx prisma db push
pnpm db:seed

pnpm dev
```

**Required env vars** (see `.env.example`) :
- `DATABASE_URL` — PostgreSQL (Neon recommended)
- `BETTER_AUTH_SECRET` — 32+ char random string
- `GROQ_API_KEY` — groq.com
- `GEMINI_API_KEY` — aistudio.google.com
- `PUSHER_*` — pusher.com (free tier sufficient)
- `RESEND_API_KEY` — resend.com
- `STRIPE_SECRET_KEY` — stripe.com (test keys for local)

---

## Test suite

```bash
pnpm test:e2e   # Playwright — auth flow + board CRUD
pnpm lint
pnpm type-check
```

CI runs on every push via GitHub Actions (see `.github/workflows/ci.yml`).

---

## Project context

This is project 02 of a 30-project portfolio built to demonstrate senior-level full-stack + product management capabilities. Each project covers a distinct domain (AI tooling, developer tools, SaaS infrastructure, mobile, data visualization). All projects are built with the same engineering standards: TypeScript strict, tested, deployed on Vercel.

**[Portfolio overview →](https://your-portfolio.com)**
