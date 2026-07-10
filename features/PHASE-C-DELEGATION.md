# Axiom — Phase C Delegation Document
> Version 1.0 | 2026-07-10 | Délégation complète sans retour requis

Ce document est autonome. L'assistant peut implémenter les 5 features de Phase C sans poser de questions.

---

## 0. Contexte du projet

**Stack** : Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Better Auth, Prisma 7, PostgreSQL (Neon)

**Phases A et B déjà complétées** : Axiom Intelligence, Analytics, Mobile, Dark/Light Mode, UX Motion, Command Palette, Keyboard Shortcuts, Onboarding, Settings, Notifications, 404 page, Playwright.

**Structure actuelle `src/app/`** :
```
src/app/
  (app)/
    [workspaceSlug]/
      boards/[boardId]/...
      settings/members/page.tsx
    layout.tsx
    workspaces/new/page.tsx
  (auth)/
    login/page.tsx
    sign-up/page.tsx
  api/
    ai/... (5 routes)
    auth/
    pusher/
  globals.css
  layout.tsx        ← modifier pour SEO + Analytics + ThemeProvider
  page.tsx          ← modifier pour landing page publique
  not-found.tsx     ← créé en Phase B
```

**`src/app/page.tsx` actuel** : redirige vers `/login` si non authentifié. Phase C le transforme en landing page publique.

---

## 1. Packages à installer

```bash
pnpm add @sentry/nextjs @vercel/analytics @vercel/speed-insights gray-matter remark remark-html
```

Types :
```bash
pnpm add -D @types/mdast
```

---

## 2. Variables d'environnement à ajouter

```env
# Sentry (Feature 010)
SENTRY_DSN=https://xxxx@oXXXX.ingest.sentry.io/XXXX
SENTRY_ORG=votre-org-sentry
SENTRY_PROJECT=axiom-kanban-board
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@oXXXX.ingest.sentry.io/XXXX

# App URL (Feature 019 - SEO)
NEXT_PUBLIC_APP_URL=https://axiom-kanban.vercel.app
```

> Ajouter `SENTRY_DSN` et `NEXT_PUBLIC_APP_URL` dans Vercel → Settings → Environment Variables.

---

## 3. Feature 019 — SEO + Open Graph (implémenter en premier)

> Fondation de toutes les pages publiques. À faire avant changelog et roadmap.

### 3.1 Tasks

- [ ] T001 — Créer `src/app/(marketing)/layout.tsx` (layout public minimaliste)
- [ ] T002 — Créer `src/app/(marketing)/page.tsx` (landing page Axiom)
- [ ] T003 — Modifier `src/app/page.tsx` (rediriger auth → app, non-auth → `/landing` ou afficher landing)
- [ ] T004 — Modifier `src/app/layout.tsx` (metadata SEO globaux + ThemeProvider Phase B)
- [ ] T005 — Créer `src/app/og/route.tsx` (génération OG image dynamique)
- [ ] T006 — Créer `src/app/robots.ts`
- [ ] T007 — Créer `src/app/sitemap.ts`

### 3.2 Code complet

#### Modifier `src/app/page.tsx` — landing pour les visiteurs non-authentifiés

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    // Authenticated → redirect to first workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      orderBy: { invitedAt: "asc" },
      include: { workspace: { select: { slug: true } } },
    });

    if (!membership) {
      redirect("/workspaces/new");
    }

    redirect(`/${membership.workspace.slug}`);
  }

  // Not authenticated → show public landing page
  return <LandingPage />;
}
```

#### Créer `src/components/marketing/landing-page.tsx`

```typescript
import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-geist">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Axiom wordmark */}
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <svg fill="none" height="12" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
                <rect height="18" rx="2" width="18" x="3" y="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-on-surface">Axiom</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/changelog" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors hidden md:block">
              Changelog
            </Link>
            <Link href="/roadmap" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors hidden md:block">
              Roadmap
            </Link>
            <Link
              href="/login"
              className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-[13px] px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center max-w-4xl mx-auto">
        {/* Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/8 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
          <span className="text-[11px] font-semibold text-[#8B5CF6] uppercase tracking-widest">
            Axiom Intelligence Engine
          </span>
        </div>

        <h1 className="text-[52px] md:text-[72px] font-semibold text-on-surface leading-[1.05] tracking-tight mb-6">
          The intelligence layer<br />
          <span className="text-primary">for elite teams.</span>
        </h1>

        <p className="text-[18px] md:text-[20px] text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-powered Kanban that thinks with you. Prioritize smarter, estimate precisely,
          detect blockers before they block.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/sign-up"
            className="px-7 py-3.5 bg-primary text-white rounded-xl text-[15px] font-semibold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            Start free
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 border border-outline-variant bg-surface-container text-on-surface rounded-xl text-[15px] font-medium hover:bg-surface-container-high transition-colors"
          >
            View demo →
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ),
              color: "text-[#8B5CF6]",
              bg: "bg-[#8B5CF6]/8 border-[#8B5CF6]/20",
              title: "AI Priority Engine",
              desc: "Axiom Intelligence scores and reprioritizes your backlog automatically based on context, dependencies, and team velocity.",
            },
            {
              icon: (
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
              color: "text-[#22D3EE]",
              bg: "bg-[#22D3EE]/8 border-[#22D3EE]/20",
              title: "Sprint Analytics",
              desc: "Burndown charts, velocity tracking, and sprint health scores. Know exactly where your team stands at any moment.",
            },
            {
              icon: (
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              color: "text-primary",
              bg: "bg-primary/8 border-primary/20",
              title: "Real-time collaboration",
              desc: "Every drag, every status change, every comment appears instantly across your team. Powered by Pusher Channels.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`p-6 rounded-2xl border ${feature.bg} bg-surface-container`}
            >
              <div className={`mb-4 ${feature.color}`}>{feature.icon}</div>
              <h3 className="text-[15px] font-semibold text-on-surface mb-2">{feature.title}</h3>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack section */}
      <section className="border-t border-outline-variant/20 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[12px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-8">
            Built with a production-grade stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["Next.js 16", "TypeScript", "Prisma 7", "Better Auth", "Groq AI", "Pusher", "Tailwind CSS v4"].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-[12px] text-on-surface-variant border border-outline-variant/30 rounded-full bg-surface-container"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[12px] text-on-surface-variant/50">
          <span>© 2026 Axiom. Open source.</span>
          <div className="flex items-center gap-6">
            <Link href="/changelog" className="hover:text-on-surface-variant transition-colors">Changelog</Link>
            <Link href="/roadmap" className="hover:text-on-surface-variant transition-colors">Roadmap</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-on-surface-variant transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

#### Modifier `src/app/layout.tsx` — metadata SEO complète + ThemeProvider (Phase B)

```typescript
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Axiom — The intelligence layer for elite teams.",
    template: "%s | Axiom",
  },
  description:
    "AI-powered Kanban board with sprint analytics, real-time collaboration, and Axiom Intelligence Engine. Built for engineering teams that ship.",
  keywords: ["kanban", "project management", "AI", "sprint planning", "team collaboration"],
  authors: [{ name: "Axiom Team" }],
  creator: "Axiom",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Axiom",
    title: "Axiom — The intelligence layer for elite teams.",
    description:
      "AI-powered Kanban board with sprint analytics, real-time collaboration, and Axiom Intelligence Engine.",
    images: [
      {
        url: "/og/image",
        width: 1200,
        height: 630,
        alt: "Axiom — AI-powered Kanban",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Axiom — The intelligence layer for elite teams.",
    description:
      "AI-powered Kanban board with sprint analytics, real-time collaboration, and Axiom Intelligence Engine.",
    images: ["/og/image"],
    creator: "@axiomapp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### Créer `src/app/og/route.tsx` — image Open Graph dynamique

```typescript
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f131d",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
            borderRadius: "100%",
          }}
        />

        {/* Logo + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#3B82F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg fill="none" height="24" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
              <rect height="18" rx="2" width="18" x="3" y="3" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#dfe2f1",
              letterSpacing: "-0.02em",
            }}
          >
            Axiom
          </span>
        </div>

        {/* Main heading */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            margin: "0 0 16px 0",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            maxWidth: "900px",
          }}
        >
          The intelligence layer
          <br />
          for elite teams.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "22px",
            color: "#c2c6d6",
            textAlign: "center",
            margin: 0,
            maxWidth: "700px",
          }}
        >
          AI-powered Kanban · Sprint Analytics · Real-time collaboration
        </p>

        {/* Bottom badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "100px",
            border: "1px solid rgba(139,92,246,0.3)",
            background: "rgba(139,92,246,0.08)",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "100%",
              background: "#8B5CF6",
            }}
          />
          <span style={{ fontSize: "13px", color: "#8B5CF6", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Axiom Intelligence Engine
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

#### Créer `src/app/robots.ts`

```typescript
import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/changelog", "/roadmap"],
        disallow: ["/api/", "/workspaces/", "/login", "/sign-up"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
```

#### Créer `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${APP_URL}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/roadmap`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
```

---

## 4. Feature 011 — Vercel Analytics

### 4.1 Tasks

- [ ] T008 — Installer `@vercel/analytics` et `@vercel/speed-insights` (déjà dans section 1)
- [ ] T009 — Ajouter `<Analytics />` et `<SpeedInsights />` dans `src/app/layout.tsx`

### 4.2 Code complet

#### Modifier `src/app/layout.tsx` — ajouter Analytics (dans le même fichier que Section 3)

```typescript
// Ajouter ces imports en haut :
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Dans le return, avant </body> :
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

> Vercel Analytics ne collecte des données qu'en production. En développement local, les composants sont no-op — aucun impact sur le DX.

---

## 5. Feature 010 — Sentry Error Monitoring

### 5.1 Tasks

- [ ] T010 — Installer `@sentry/nextjs` (déjà dans section 1)
- [ ] T011 — Créer `sentry.client.config.ts`
- [ ] T012 — Créer `sentry.server.config.ts`
- [ ] T013 — Créer `sentry.edge.config.ts`
- [ ] T014 — Modifier `next.config.ts` (ou `next.config.js`) pour wrapper Sentry
- [ ] T015 — Créer `src/components/ui/error-boundary.tsx`
- [ ] T016 — Créer `src/app/global-error.tsx` (App Router error page)
- [ ] T017 — Modifier `src/app/(app)/layout.tsx` pour identifier l'utilisateur dans Sentry

### 5.2 Code complet

#### `sentry.client.config.ts` (à la racine du projet)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performances — désactiver en portfolio (coût inutile)
  tracesSampleRate: 0,

  // Ne pas capturer les erreurs locales
  enabled: process.env.NODE_ENV === "production",

  // Filtre les erreurs peu utiles
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error exception captured",
    "Network request failed",
  ],
});
```

#### `sentry.server.config.ts` (à la racine du projet)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: process.env.NODE_ENV === "production",
});
```

#### `sentry.edge.config.ts` (à la racine du projet)

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0,
  enabled: process.env.NODE_ENV === "production",
});
```

#### Modifier `next.config.ts` (ou créer si inexistant)

```typescript
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ...config existante...
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silent en CI pour ne pas polluer les logs
  silent: !process.env.CI,

  // Source maps uploadés automatiquement sur Vercel
  widenClientFileUpload: true,

  // Minification du bundle Sentry
  disableLogger: true,
  automaticVercelMonitors: false,
});
```

> **Important** : Si `next.config.ts` n'existe pas, le projet utilise peut-être `next.config.js` ou `next.config.mjs`. Adapter l'export en conséquence (ESM vs CJS).

#### `src/components/ui/error-boundary.tsx`

```typescript
"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, eventId: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const eventId = Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
    this.setState({ eventId });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen bg-background flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-widest mb-3">
                Axiom
              </div>
              <h1 className="text-2xl font-semibold text-on-surface mb-3">
                Something went wrong.
              </h1>
              <p className="text-[14px] text-on-surface-variant mb-8">
                An unexpected error occurred. The team has been notified automatically.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => this.setState({ hasError: false, eventId: null })}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:brightness-110 transition-all"
                >
                  Try again
                </button>
                <a
                  href="/"
                  className="px-5 py-2.5 border border-outline-variant text-on-surface rounded-xl text-[14px] font-medium hover:bg-surface-container-high transition-colors"
                >
                  Back to home
                </a>
              </div>
              {this.state.eventId && (
                <p className="mt-6 text-[11px] text-on-surface-variant/30 font-mono">
                  Ref: {this.state.eventId}
                </p>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

#### `src/app/global-error.tsx` — App Router global error

```typescript
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ background: "#0f131d", margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
          }}
        >
          <div>
            <h2 style={{ color: "#dfe2f1", fontSize: "24px", marginBottom: "12px" }}>
              Something went wrong.
            </h2>
            <p style={{ color: "#c2c6d6", marginBottom: "24px", fontSize: "14px" }}>
              The team has been notified automatically.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#3B82F6",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "10px 24px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

#### Modifier `src/app/(app)/layout.tsx` — identifier l'utilisateur dans Sentry

```typescript
// Ajouter en haut :
import * as Sentry from "@sentry/nextjs";

// Dans la fonction layout, après avoir récupéré la session :
if (session) {
  Sentry.setUser({
    id: session.user.id,
    email: session.user.email,
    // Ne jamais inclure le mot de passe ou les tokens
  });
}
```

---

## 6. Feature 012 — Changelog / Release Notes

### 6.1 Tasks

- [ ] T018 — Créer `src/content/changelog/` (dossier)
- [ ] T019 — Créer `src/content/changelog/v0-1.md`, `v0-2.md`, `v1-0.md`
- [ ] T020 — Créer `src/lib/changelog.ts` (helper de lecture Markdown)
- [ ] T021 — Créer `src/app/changelog/page.tsx`

### 6.2 Code complet

#### `src/content/changelog/v1-0.md`

```markdown
---
version: "1.0.0"
date: "2026-07-10"
title: "General Availability"
---

## New

- **Axiom Intelligence Engine** — Five AI-powered endpoints: task prioritization, effort estimation, description generation, blocker detection, and smart assignment. Powered by Groq (Llama 3.1) with Gemini Flash fallback.
- **Sprint Analytics** — Burndown charts, velocity tracking across sprints, and AI-generated sprint health summaries.
- **Dark & Light Mode** — Full theme system with CSS variable tokens, next-themes, and system preference detection.
- **Command Palette** — Global ⌘K search across all tasks and boards with keyboard navigation.
- **Onboarding Tour** — Interactive 5-step guided tour for new users, powered by driver.js.

## Improved

- Real-time collaboration now handles 200+ concurrent users per board via Pusher Channels.
- Task cards animate on hover and drag with Framer Motion v12 spring physics.
- Board columns scroll horizontally on mobile with snap points.

## Fixed

- Task modal now renders fullscreen on mobile (h-[100dvh]) instead of overflowing the viewport.
- AI rate limiter now resets accurately at midnight UTC.
```

#### `src/content/changelog/v0-2.md`

```markdown
---
version: "0.2.0"
date: "2026-06-20"
title: "AI & Analytics Beta"
---

## New

- **Axiom Intelligence (Beta)** — First AI suggestions: task prioritization and effort estimation. Streaming reasoning via Server-Sent Events.
- **Sprint Management** — Create sprints, assign tasks, track progress with burndown charts.
- **Mobile Layout** — Responsive sidebar drawer, horizontal board scroll, and touch-friendly drag and drop.

## Improved

- Drag-and-drop column reordering now persists to the database via optimistic updates.
- Task detail modal shows full activity timeline with member avatars.

## Fixed

- Invitation emails now correctly expire after 7 days.
- Workspace slug conflicts are now detected before creation.
```

#### `src/content/changelog/v0-1.md`

```markdown
---
version: "0.1.0"
date: "2026-06-01"
title: "Initial Release"
---

## New

- **Core Kanban Board** — Create boards, columns, and tasks. Drag-and-drop powered by @dnd-kit with keyboard accessibility.
- **Workspaces & Teams** — Multi-workspace support with role-based access (Owner, Admin, Member, Viewer).
- **Authentication** — Email/password and Google OAuth via Better Auth. Secure session management.
- **Real-time Sync** — Board state synchronizes in real time across all connected clients via Pusher Channels.
- **Task Details** — Rich task panel with description, labels, assignees, priority, estimates, and activity log.
- **Comments** — Threaded comments with user attribution and timestamps.
```

#### `src/lib/changelog.ts`

```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  contentHtml: string;
  slug: string;
}

const CHANGELOG_DIR = path.join(process.cwd(), "src/content/changelog");

export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  const fileNames = fs.readdirSync(CHANGELOG_DIR).filter((f) => f.endsWith(".md"));

  const entries = await Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(CHANGELOG_DIR, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      const processedContent = await remark().use(remarkHtml).process(content);

      return {
        slug,
        version: data.version as string,
        date: data.date as string,
        title: data.title as string,
        contentHtml: processedContent.toString(),
      };
    })
  );

  // Sort by version descending (newest first)
  return entries.sort((a, b) => (a.version > b.version ? -1 : 1));
}
```

#### `src/app/changelog/page.tsx`

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { getAllChangelogEntries } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Latest updates and improvements to Axiom.",
  openGraph: {
    title: "Axiom Changelog",
    description: "Latest updates and improvements to Axiom.",
  },
};

// Render once at build time — no DB needed
export const dynamic = "force-static";

export default async function ChangelogPage() {
  const entries = await getAllChangelogEntries();

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Nav */}
      <nav className="border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5">
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Axiom
          </Link>
          <span className="text-on-surface-variant/30">/</span>
          <span className="text-[13px] text-on-surface">Changelog</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16">
          <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            Release History
          </div>
          <h1 className="text-4xl font-semibold text-on-surface tracking-tight mb-3">
            Changelog
          </h1>
          <p className="text-[15px] text-on-surface-variant">
            New features, improvements, and bug fixes for every Axiom release.
          </p>
        </div>

        {/* Entries */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-0 bottom-0 w-px bg-outline-variant/30 hidden md:block" />

          <div className="space-y-16">
            {entries.map((entry, index) => (
              <div key={entry.slug} className="md:pl-8 relative">
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background hidden md:block" />

                {/* Version header */}
                <div className="flex items-center gap-3 flex-wrap mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-semibold border border-primary/20">
                    v{entry.version}
                  </span>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-[11px] font-semibold border border-green-500/20">
                      Latest
                    </span>
                  )}
                  <span className="text-[13px] text-on-surface-variant">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold text-on-surface mb-6">
                  {entry.title}
                </h2>

                {/* Rendered Markdown content */}
                <div
                  className="prose-axiom"
                  dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
```

#### Ajouter les styles `prose-axiom` dans `globals.css`

```css
/* Changelog prose styles */
.prose-axiom h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 20px 0 12px;
  padding-top: 12px;
  border-top: 1px solid var(--outline-variant);
}

.prose-axiom h2:first-child {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}

.prose-axiom ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prose-axiom ul li {
  font-size: 14px;
  color: var(--on-surface-variant);
  line-height: 1.6;
  padding-left: 16px;
  position: relative;
}

.prose-axiom ul li::before {
  content: "—";
  position: absolute;
  left: 0;
  color: var(--outline);
}

.prose-axiom strong {
  color: var(--on-surface);
  font-weight: 600;
}
```

---

## 7. Feature 015 — Public Roadmap

### 7.1 Tasks

- [ ] T022 — Créer `src/content/roadmap.ts` (config statique)
- [ ] T023 — Créer `src/app/roadmap/page.tsx`

### 7.2 Code complet

#### `src/content/roadmap.ts`

```typescript
export type RoadmapStatus = "shipped" | "in-progress" | "planned" | "considering";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  date?: string; // For shipped items
}

export interface RoadmapColumn {
  id: "now" | "next" | "later";
  label: string;
  description: string;
  items: RoadmapItem[];
}

export const ROADMAP: RoadmapColumn[] = [
  {
    id: "now",
    label: "Now",
    description: "What we're shipping or just shipped",
    items: [
      {
        id: "kanban-core",
        title: "Core Kanban Board",
        description: "Drag-and-drop columns and tasks, real-time sync via Pusher Channels.",
        status: "shipped",
        date: "Jun 2026",
      },
      {
        id: "ai-intelligence",
        title: "Axiom Intelligence Engine",
        description: "AI-powered prioritization, estimation, blocker detection, and smart assignment.",
        status: "shipped",
        date: "Jun 2026",
      },
      {
        id: "sprint-analytics",
        title: "Sprint Analytics",
        description: "Burndown charts, velocity tracking, AI-generated sprint health summaries.",
        status: "shipped",
        date: "Jun 2026",
      },
      {
        id: "dark-light",
        title: "Dark & Light Mode",
        description: "Full design token system with next-themes and system preference detection.",
        status: "shipped",
        date: "Jul 2026",
      },
      {
        id: "cmd-palette",
        title: "Command Palette",
        description: "Global ⌘K search across all tasks and boards with keyboard navigation.",
        status: "in-progress",
      },
    ],
  },
  {
    id: "next",
    label: "Next",
    description: "What's coming in the next 60 days",
    items: [
      {
        id: "webhooks",
        title: "Webhooks & Public API",
        description: "REST API for external integrations. Subscribe to task/column events via webhook.",
        status: "planned",
      },
      {
        id: "pwa",
        title: "Progressive Web App",
        description: "Install Axiom on desktop or mobile, work offline, get push notifications.",
        status: "planned",
      },
      {
        id: "i18n",
        title: "Internationalization",
        description: "Full French and English support with auto-detection from browser locale.",
        status: "planned",
      },
      {
        id: "emails",
        title: "Transactional Emails",
        description: "On-brand email notifications for invitations, mentions, and sprint milestones.",
        status: "planned",
      },
    ],
  },
  {
    id: "later",
    label: "Later",
    description: "Longer-term vision",
    items: [
      {
        id: "billing",
        title: "Billing & Pricing Plans",
        description: "Stripe-powered subscription with Free, Pro, and Team tiers.",
        status: "considering",
      },
      {
        id: "audit-log",
        title: "Audit Log & Compliance",
        description: "Full activity audit trail for workspace owners, exportable as CSV.",
        status: "considering",
      },
      {
        id: "native-mobile",
        title: "Native Mobile App",
        description: "React Native app with offline board access and push notifications.",
        status: "considering",
      },
      {
        id: "integrations",
        title: "GitHub / Linear Integration",
        description: "Sync tasks with GitHub Issues and Linear tickets bidirectionally.",
        status: "considering",
      },
    ],
  },
];
```

#### `src/app/roadmap/page.tsx`

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { ROADMAP, type RoadmapStatus } from "@/content/roadmap";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Where Axiom is headed. See what's shipped, what's in progress, and what's coming.",
  openGraph: {
    title: "Axiom Roadmap — Where we're headed",
    description: "See what's shipped, what's in progress, and what's coming to Axiom.",
  },
};

export const dynamic = "force-static";

const STATUS_CONFIG: Record<
  RoadmapStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  shipped: {
    label: "Shipped",
    dotClass: "bg-green-400",
    badgeClass: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  "in-progress": {
    label: "In Progress",
    dotClass: "bg-[#22D3EE] animate-pulse",
    badgeClass: "bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/20",
  },
  planned: {
    label: "Planned",
    dotClass: "bg-primary",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
  considering: {
    label: "Considering",
    dotClass: "bg-on-surface-variant/40",
    badgeClass: "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
  },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Nav */}
      <nav className="border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5">
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Axiom
          </Link>
          <span className="text-on-surface-variant/30">/</span>
          <span className="text-[13px] text-on-surface">Roadmap</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            Product Vision
          </div>
          <h1 className="text-4xl font-semibold text-on-surface tracking-tight mb-3">
            Public Roadmap
          </h1>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            Where Axiom is headed. This is a living document — priorities evolve as we learn from
            real usage. Shipped items are locked; everything else is subject to change.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap mb-12">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
              <span className="text-[12px] text-on-surface-variant">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROADMAP.map((col) => (
            <div key={col.id}>
              {/* Column header */}
              <div className="mb-5">
                <h2 className="text-[18px] font-semibold text-on-surface mb-1">{col.label}</h2>
                <p className="text-[12px] text-on-surface-variant/60">{col.description}</p>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {col.items.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border border-outline-variant/20 bg-surface-container transition-colors ${
                        item.status === "shipped" ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[14px] font-medium text-on-surface leading-snug">
                          {item.title}
                        </h3>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badgeClass}`}
                        >
                          {item.status === "shipped" && item.date
                            ? item.date
                            : cfg.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant/70 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 mt-16 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[12px] text-on-surface-variant/50">
          <span>Last updated July 2026</span>
          <div className="flex items-center gap-6">
            <Link href="/changelog" className="hover:text-on-surface-variant transition-colors">Changelog</Link>
            <Link href="/" className="hover:text-on-surface-variant transition-colors">Back to Axiom</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

---

## 8. Ordre d'exécution recommandé

```bash
# 1. Feature 019 — SEO & Landing Page
git checkout main && git pull
git checkout -b feat-019-seo-open-graph
# T001 → T007 : landing page + metadata + OG image + robots + sitemap
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 2. Feature 011 — Vercel Analytics (rapide, 5 min)
git checkout main && git pull
git checkout -b feat-011-vercel-analytics
# T008 → T009 : installer packages + ajouter composants dans layout.tsx
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 3. Feature 010 — Sentry
git checkout main && git pull
git checkout -b feat-010-sentry
# T010 → T017 : configs sentry + Error Boundary + global-error
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 4. Feature 012 — Changelog (peut être parallélisé avec Sentry)
git checkout main && git pull
git checkout -b feat-012-changelog
# T018 → T021 : content/ + lib/changelog.ts + page
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 5. Feature 015 — Roadmap
git checkout main && git pull
git checkout -b feat-015-public-roadmap
# T022 → T023 : content/roadmap.ts + page
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge
```

---

## 9. Checklist de validation finale

- [ ] `http://localhost:3000` redirige vers app si authentifié, affiche landing si non-authentifié
- [ ] `/changelog` accessible sans login, 3 entrées affichées avec versions et dates
- [ ] `/roadmap` accessible sans login, 3 colonnes Now/Next/Later avec items
- [ ] `http://localhost:3000/og/image` retourne une image PNG 1200×630 (vérifier dans le browser)
- [ ] `http://localhost:3000/sitemap.xml` liste `/`, `/changelog`, `/roadmap`
- [ ] `http://localhost:3000/robots.txt` bloque `/api/` et `/workspaces/`
- [ ] `<Analytics />` et `<SpeedInsights />` présents dans le DOM en production (vérifier dans les devtools Vercel)
- [ ] `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` à la racine
- [ ] `global-error.tsx` et `ErrorBoundary` en place — tester avec `throw new Error("test")` dans un composant
- [ ] `SENTRY_DSN` et `NEXT_PUBLIC_APP_URL` ajoutés dans Vercel → Environment Variables
- [ ] `PROGRESS.md` mis à jour après chaque merge (incrémenter les phases et %)
