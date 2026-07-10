# Axiom — Phase D Delegation Document
> Version 1.0 | 2026-07-10 | Délégation complète sans retour requis

Ce document est autonome. L'assistant peut implémenter les 4 features de Phase D sans poser de questions.

---

## 0. Contexte du projet

**Stack** : Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Better Auth, Prisma 7, PostgreSQL (Neon), Resend

**Phases A-C complétées** : AI, Analytics, Mobile, UX/Motion, Dark Mode, Settings, SEO, Landing Page, Changelog, Roadmap, Sentry.

**`next.config.ts` existant** (racine du projet) :
```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

**Prisma schema** : Les modèles User, Workspace, WorkspaceMember, Board, Column, Task, Sprint, AILog, Notification, ActivityEvent, Comment, Label, TaskLabel, TaskAssignee, Invitation existent. **Trois migrations supplémentaires** sont requises pour Phase D (voir Section 2).

---

## 1. Packages à installer

```bash
pnpm add resend @react-email/components @react-email/render @ducanh2912/next-pwa
```

---

## 2. Migrations Prisma — 3 modifications

### Migration 1 — Rate Limiting sur Workspace (Feature 018)

Ajouter dans le model `Workspace` de `prisma/schema.prisma` :

```prisma
model Workspace {
  // ... champs existants ...
  aiRequestsToday  Int       @default(0)   // ← AJOUTER
  aiRequestsResetAt DateTime?              // ← AJOUTER
  // ... relations existantes ...
  apiKeys          APIKey[]               // ← AJOUTER (relation Feature 017)
  webhookConfigs   WebhookConfig[]        // ← AJOUTER (relation Feature 017)
}
```

### Migration 2 — API Keys et Webhooks (Feature 017)

Ajouter ces deux nouveaux models dans `prisma/schema.prisma` :

```prisma
model APIKey {
  id          String    @id @default(cuid())
  workspaceId String
  name        String
  keyHash     String    @unique  // SHA-256 hash — jamais la clé en clair
  prefix      String             // 8 premiers chars pour identification (ex: "axm_1a2b")
  createdAt   DateTime  @default(now())
  lastUsedAt  DateTime?
  revokedAt   DateTime?

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@map("api_keys")
}

model WebhookConfig {
  id          String    @id @default(cuid())
  workspaceId String
  url         String
  events      String[]  // ex: ["task.created", "sprint.completed"]
  secret      String    // HMAC secret — stocké hashé
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@map("webhook_configs")
}
```

### Migration 3 — Email Preferences sur User (Feature 024)

Ajouter dans le model `User` de `prisma/schema.prisma` :

```prisma
model User {
  // ... champs existants ...
  emailPreferences  Json?    // ← AJOUTER : { invitation: bool, welcome: bool, taskAssigned: bool, sprintReminder: bool, blockerDetected: bool }
  onboardingCompleted Boolean @default(false)  // ← Si pas encore ajouté en Phase B
}
```

### Exécuter les migrations

```bash
npx prisma migrate dev --name add-rate-limiting-api-keys-webhooks-email-prefs
```

---

## 3. Variable d'environnement à ajouter

```env
# Resend (Feature 024)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=Axiom <noreply@axiom.dev>

# Webhook signing (Feature 017)
WEBHOOK_SECRET_SALT=un-secret-long-32-chars-minimum
```

> Ajouter dans Vercel → Settings → Environment Variables.

---

## 4. Feature 018 — Rate Limiting Dashboard (IA Quota)

> Implémenter en premier — simple, aucune dépendance externe.

### 4.1 Tasks

- [ ] T001 — Migration Prisma (champs `aiRequestsToday` + `aiRequestsResetAt` sur Workspace — voir Section 2)
- [ ] T002 — Créer `src/lib/ai/workspace-rate-limit.ts` (quota DB au niveau workspace)
- [ ] T003 — Modifier les 5 endpoints IA (`/api/ai/*/route.ts`) pour utiliser le quota workspace
- [ ] T004 — Créer `src/app/(app)/[workspaceSlug]/settings/ai-quota/page.tsx`
- [ ] T005 — Ajouter le lien "AI Quota" dans la page Settings existante

### 4.2 Code complet

#### `src/lib/ai/workspace-rate-limit.ts`

```typescript
import { prisma } from "@/lib/prisma";

const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "50", 10);

export interface WorkspaceQuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export async function checkWorkspaceQuota(
  workspaceId: string
): Promise<WorkspaceQuotaResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { aiRequestsToday: true, aiRequestsResetAt: true },
  });

  if (!workspace) throw new Error("Workspace not found");

  const now = new Date();

  // Reset si minuit UTC est passé depuis le dernier reset
  const shouldReset =
    !workspace.aiRequestsResetAt ||
    workspace.aiRequestsResetAt.getUTCDate() !== now.getUTCDate() ||
    workspace.aiRequestsResetAt.getUTCMonth() !== now.getUTCMonth() ||
    workspace.aiRequestsResetAt.getUTCFullYear() !== now.getUTCFullYear();

  if (shouldReset) {
    const resetAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { aiRequestsToday: 0, aiRequestsResetAt: resetAt },
    });

    const resetAtResult = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    return {
      allowed: true,
      used: 0,
      limit: AI_DAILY_LIMIT,
      remaining: AI_DAILY_LIMIT,
      resetAt: resetAtResult,
    };
  }

  const used = workspace.aiRequestsToday;
  const resetAt =
    workspace.aiRequestsResetAt ??
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

  return {
    allowed: used < AI_DAILY_LIMIT,
    used,
    limit: AI_DAILY_LIMIT,
    remaining: Math.max(0, AI_DAILY_LIMIT - used),
    resetAt,
  };
}

export async function incrementWorkspaceQuota(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { aiRequestsToday: { increment: 1 } },
  });
}
```

#### Modifier les 5 endpoints IA — remplacer le rate limiter in-memory

Dans chaque `src/app/api/ai/*/route.ts`, modifier la section rate limiting :

```typescript
// Remplacer :
// import { checkRateLimit } from "@/lib/ai/rate-limit";
// const rateLimit = checkRateLimit(session.user.id);
// if (!rateLimit.allowed) { return new Response(..., { status: 429 }); }

// Par :
import { checkWorkspaceQuota, incrementWorkspaceQuota } from "@/lib/ai/workspace-rate-limit";

// Dans le handler POST, après avoir récupéré workspaceId :
const quota = await checkWorkspaceQuota(workspaceId);
if (!quota.allowed) {
  return new Response(
    JSON.stringify({
      error: "quota_exceeded",
      message: `Axiom Intelligence quota reached for today. Resets at midnight UTC.`,
      resetAt: quota.resetAt.toISOString(),
      used: quota.used,
      limit: quota.limit,
    }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}

// Et après le stream, incrémenter :
await incrementWorkspaceQuota(workspaceId);
```

> Appliquer cette modification aux 5 routes : `/api/ai/prioritize/route.ts`, `estimate`, `describe`, `detect-blocker`, `assign`.

#### `src/app/(app)/[workspaceSlug]/settings/ai-quota/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "50", 10);

export default async function AIQuotaPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    select: { id: true, name: true, aiRequestsToday: true, aiRequestsResetAt: true },
  });

  if (!workspace) redirect("/");

  const used = workspace.aiRequestsToday;
  const pct = Math.min(100, Math.round((used / AI_DAILY_LIMIT) * 100));

  // Reset à minuit UTC
  const now = new Date();
  const resetAt = workspace.aiRequestsResetAt ?? new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const hoursUntilReset = Math.max(
    0,
    Math.floor((resetAt.getTime() - now.getTime()) / 1000 / 60 / 60)
  );

  const statusColor =
    pct >= 90
      ? "text-red-400"
      : pct >= 70
      ? "text-yellow-400"
      : "text-green-400";

  const barColor =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
      ? "bg-yellow-500"
      : "bg-primary";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          Settings
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Axiom Intelligence Quota</h1>
        <p className="text-[14px] text-on-surface-variant mt-1">
          Daily AI request limit for workspace <strong className="text-on-surface">{workspace.name}</strong>.
        </p>
      </div>

      {/* Quota card */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container p-6 mb-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
              Today&apos;s Usage
            </div>
            <div className={`text-4xl font-semibold ${statusColor}`}>
              {used}
              <span className="text-xl text-on-surface-variant font-normal">
                {" "}/ {AI_DAILY_LIMIT}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-on-surface-variant/60">Resets in</div>
            <div className="text-[14px] font-medium text-on-surface">
              {hoursUntilReset}h
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-on-surface-variant/50">
          <span>{pct}% used</span>
          <span>{AI_DAILY_LIMIT - used} remaining</span>
        </div>
      </div>

      {/* Info section */}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <svg className="text-on-surface-variant/40 mt-0.5 shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <div className="space-y-2 text-[13px] text-on-surface-variant">
            <p>
              The daily limit applies across all AI features — priority, estimation, description, blocker detection, and smart assignment.
            </p>
            <p>
              The counter resets automatically at <strong className="text-on-surface">midnight UTC</strong> every day.
            </p>
            <p>
              To adjust the limit, set the <code className="font-mono text-[12px] bg-surface-container-highest px-1.5 py-0.5 rounded">AI_DAILY_LIMIT</code> environment variable and redeploy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Modifier `src/app/(app)/[workspaceSlug]/settings/page.tsx` — ajouter le lien AI Quota

```typescript
// Ajouter dans le tableau SETTINGS_SECTIONS :
{
  label: "AI Quota",
  href: `/${workspaceSlug}/settings/ai-quota`,
  description: "Daily Axiom Intelligence usage and limits",
},
```

---

## 5. Feature 020 — Progressive Web App (PWA)

### 5.1 Tasks

- [ ] T006 — Créer `src/app/manifest.ts` (Next.js Metadata API)
- [ ] T007 — Créer `public/icons/icon-192.png` et `public/icons/icon-512.png` (icônes PWA)
- [ ] T008 — Modifier `next.config.ts` pour intégrer `@ducanh2912/next-pwa`
- [ ] T009 — Créer `public/sw.js` placeholder si next-pwa ne génère pas le SW automatiquement
- [ ] T010 — Ajouter `<meta name="theme-color">` et `<link rel="apple-touch-icon">` dans `src/app/layout.tsx`

### 5.2 Code complet

#### `src/app/manifest.ts`

```typescript
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Axiom — AI Kanban Board",
    short_name: "Axiom",
    description: "The intelligence layer for elite teams.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f131d",
    theme_color: "#0f131d",
    categories: ["productivity", "business"],
    lang: "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "New Board",
        short_name: "Board",
        description: "Create a new Kanban board",
        url: "/workspaces/new",
      },
    ],
  };
}
```

#### Modifier `next.config.ts` — intégrer next-pwa

```typescript
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Désactiver en développement local
  disable: process.env.NODE_ENV === "development",
  // Cacher les assets statiques (JS, CSS, fonts, images)
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swMinify: true,
  // Fallback offline page
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
    // Ne pas cacher les API routes ni les pages authentifiées
    runtimeCaching: [
      {
        urlPattern: /^\/(?!api).*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "axiom-pages",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24h
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Si Sentry est déjà configuré en Phase C, garder le withSentryConfig ici.
  // Voir Phase C pour l'import withSentryConfig.
};

export default withPWA(nextConfig);
```

> **Note importante** : Si `withSentryConfig` a été ajouté en Phase C, chaîner les deux wrappers :
> ```typescript
> export default withSentryConfig(withPWA(nextConfig), { ... sentryOptions ... });
> ```

#### Créer `src/app/offline/page.tsx`

```typescript
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="mb-6">
        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-4">
          <svg className="text-on-surface-variant/50" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
            <line x1="1" x2="23" y1="1" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" x2="12.01" y1="20" y2="20" />
          </svg>
        </div>
        <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
          Axiom
        </div>
        <h1 className="text-2xl font-semibold text-on-surface mb-2">
          You are offline.
        </h1>
        <p className="text-[14px] text-on-surface-variant max-w-xs mx-auto">
          Check your internet connection and try again.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-5 py-2.5 bg-primary text-white rounded-xl text-[14px] font-medium hover:brightness-110 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
```

#### Modifier `src/app/layout.tsx` — ajouter meta PWA

```typescript
// Dans l'objet metadata existant, ajouter :
export const metadata: Metadata = {
  // ...existant...
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Axiom",
  },
};

// Dans le <head> du <html>, ajouter dans le return :
// Modifier le <html> pour inclure les icons Apple :
return (
  <html lang="en" suppressHydrationWarning>
    <head>
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <meta name="theme-color" content="#0f131d" />
    </head>
    <body suppressHydrationWarning>
      {/* ...contenu existant... */}
    </body>
  </html>
);
```

#### Générer les icônes PWA

Créer `scripts/generate-pwa-icons.ts` et exécuter une fois :

```typescript
// Méthode simple : créer des icônes SVG-based en PNG via canvas (Node.js)
// Ou utiliser ce script bash pour générer avec ImageMagick si disponible :
// magick -size 192x192 xc:#0f131d -fill "#3B82F6" -draw "roundrectangle 40,40 152,152 20,20" public/icons/icon-192.png
// magick -size 512x512 xc:#0f131d -fill "#3B82F6" -draw "roundrectangle 108,108 404,404 40,40" public/icons/icon-512.png

// Alternative : créer les PNG manuellement via https://maskable.app/editor
// Taille : 192x192 et 512x512, fond #0f131d, carré bleu #3B82F6 centré avec "A" en blanc
```

> **Recommandation** : Utiliser [maskable.app/editor](https://maskable.app/editor) pour générer des icônes maskables correctes en 2 minutes. Exporter en `public/icons/icon-192.png` et `public/icons/icon-512.png`.

#### Ajouter `public/icons/` au `.gitignore` — NE PAS faire

> Committer les icônes PNG dans le repo — elles sont nécessaires pour le déploiement.

---

## 6. Feature 017 — Webhooks & API Publique

### 6.1 Tasks

- [ ] T011 — Migration Prisma (`APIKey` + `WebhookConfig` — voir Section 2)
- [ ] T012 — Créer `src/lib/api/api-key.ts` (génération, hashing, vérification)
- [ ] T013 — Créer `src/lib/api/webhook.ts` (dispatch HMAC-SHA256)
- [ ] T014 — Créer `src/middleware.ts` (auth API Key pour les routes `/api/v1/`)
- [ ] T015 — Créer `src/app/api/v1/boards/route.ts`
- [ ] T016 — Créer `src/app/api/v1/boards/[boardId]/tasks/route.ts`
- [ ] T017 — Créer `src/app/api/v1/tasks/route.ts` (POST)
- [ ] T018 — Créer `src/app/api/v1/tasks/[taskId]/route.ts` (PATCH)
- [ ] T019 — Créer `src/lib/actions/api-key.actions.ts` (CRUD API Keys)
- [ ] T020 — Créer `src/lib/actions/webhook.actions.ts` (CRUD Webhooks)
- [ ] T021 — Créer `src/app/(app)/[workspaceSlug]/settings/developers/page.tsx`
- [ ] T022 — Créer `src/app/docs/api/page.tsx` (documentation publique)
- [ ] T023 — Ajouter lien "Developers" dans la page Settings
- [ ] T024 — Déclencher les webhooks depuis `src/lib/actions/tasks.actions.ts`

### 6.2 Code complet

#### `src/lib/api/api-key.ts`

```typescript
import crypto from "crypto";

const KEY_PREFIX = "axm_";

/**
 * Génère une API Key sécurisée.
 * Retourne la clé en clair (affichée une seule fois) et son hash pour DB.
 */
export function generateAPIKey(): { raw: string; hash: string; prefix: string } {
  const randomPart = crypto.randomBytes(32).toString("hex");
  const raw = `${KEY_PREFIX}${randomPart}`;
  const hash = hashAPIKey(raw);
  const prefix = raw.slice(0, 12); // "axm_" + 8 chars pour identification

  return { raw, hash, prefix };
}

export function hashAPIKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function verifyAPIKey(
  raw: string
): Promise<{ valid: boolean; workspaceId: string | null; keyId: string | null }> {
  if (!raw.startsWith(KEY_PREFIX)) {
    return { valid: false, workspaceId: null, keyId: null };
  }

  const hash = hashAPIKey(raw);

  // Import prisma ici pour éviter les circular imports
  const { prisma } = await import("@/lib/prisma");

  const apiKey = await prisma.aPIKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, workspaceId: true, revokedAt: true },
  });

  if (!apiKey || apiKey.revokedAt !== null) {
    return { valid: false, workspaceId: null, keyId: null };
  }

  // Mettre à jour lastUsedAt de manière non-bloquante
  void prisma.aPIKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { valid: true, workspaceId: apiKey.workspaceId, keyId: apiKey.id };
}
```

#### `src/lib/api/webhook.ts`

```typescript
import crypto from "crypto";

export type WebhookEvent =
  | "task.created"
  | "task.updated"
  | "task.deleted"
  | "sprint.completed"
  | "ai.suggestion.applied";

interface WebhookPayload {
  event: WebhookEvent;
  workspaceId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

export async function dispatchWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const { prisma } = await import("@/lib/prisma");

  const webhooks = await prisma.webhookConfig.findMany({
    where: {
      workspaceId,
      active: true,
      events: { has: event },
    },
    select: { url: true, secret: true },
  });

  if (webhooks.length === 0) return;

  const payload: WebhookPayload = {
    event,
    workspaceId,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadStr = JSON.stringify(payload);

  // Dispatcher tous les webhooks en parallèle, sans bloquer la réponse UI
  await Promise.allSettled(
    webhooks.map(async (wh) => {
      const signature = signPayload(payloadStr, wh.secret);

      try {
        await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Axiom-Signature": `sha256=${signature}`,
            "X-Axiom-Event": event,
            "User-Agent": "Axiom-Webhook/1.0",
          },
          body: payloadStr,
          signal: AbortSignal.timeout(5000), // 5s timeout
        });
      } catch {
        // Ne pas propager l'erreur — le webhook échoue silencieusement
        // En production, implémenter une queue de retry (Upstash QStash)
      }
    })
  );
}
```

#### Helper d'auth pour les routes `/api/v1/`

> Créer `src/lib/api/require-api-key.ts` plutôt qu'un middleware global Next.js (plus compatible avec l'App Router).

```typescript
import { NextRequest } from "next/server";
import { verifyAPIKey } from "./api-key";

export interface APIAuthContext {
  workspaceId: string;
  keyId: string;
}

export async function requireAPIKey(
  req: NextRequest
): Promise<{ context: APIAuthContext } | { error: Response }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: new Response(
        JSON.stringify({ error: "unauthorized", message: "Missing or invalid Authorization header. Use: Bearer axm_..." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const raw = authHeader.slice(7).trim();
  const { valid, workspaceId, keyId } = await verifyAPIKey(raw);

  if (!valid || !workspaceId || !keyId) {
    return {
      error: new Response(
        JSON.stringify({ error: "unauthorized", message: "Invalid or revoked API key." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { context: { workspaceId, keyId } };
}
```

#### `src/app/api/v1/boards/route.ts`

```typescript
import { NextRequest } from "next/server";
import { requireAPIKey } from "@/lib/api/require-api-key";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAPIKey(req);
  if ("error" in auth) return auth.error;

  const { workspaceId } = auth.context;

  const boards = await prisma.board.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      template: true,
      taskCounter: true,
      createdAt: true,
      _count: { select: { tasks: true, columns: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return new Response(
    JSON.stringify({
      data: boards,
      meta: { workspaceId, count: boards.length },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
```

#### `src/app/api/v1/boards/[boardId]/tasks/route.ts`

```typescript
import { NextRequest } from "next/server";
import { requireAPIKey } from "@/lib/api/require-api-key";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ boardId: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  const auth = await requireAPIKey(req);
  if ("error" in auth) return auth.error;

  const { workspaceId } = auth.context;
  const { boardId } = await params;

  // Vérifier que le board appartient au workspace
  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId },
    select: { id: true },
  });

  if (!board) {
    return new Response(
      JSON.stringify({ error: "not_found", message: "Board not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const perPage = Math.min(100, parseInt(url.searchParams.get("per_page") ?? "50", 10));

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where: { boardId },
      include: {
        column: { select: { id: true, name: true } },
        assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
        labels: { include: { label: { select: { id: true, name: true, color: true } } } },
      },
      orderBy: [{ order: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.task.count({ where: { boardId } }),
  ]);

  return new Response(
    JSON.stringify({
      data: tasks,
      meta: { boardId, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
```

#### `src/app/api/v1/tasks/route.ts` — POST (créer une tâche)

```typescript
import { NextRequest } from "next/server";
import { requireAPIKey } from "@/lib/api/require-api-key";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { dispatchWebhooks } from "@/lib/api/webhook";

const createTaskSchema = z.object({
  boardId: z.string().cuid(),
  columnId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  estimate: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAPIKey(req);
  if ("error" in auth) return auth.error;

  const { workspaceId } = auth.context;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "bad_request", message: "Invalid JSON body." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "validation_error", issues: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { boardId, columnId, title, description, priority, estimate } = parsed.data;

  // Vérifier que le board appartient au workspace
  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId },
    select: { id: true, taskCounter: true },
  });
  if (!board) {
    return new Response(
      JSON.stringify({ error: "not_found", message: "Board not found in this workspace." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Vérifier que la colonne appartient au board
  const column = await prisma.column.findFirst({
    where: { id: columnId, boardId },
    select: { id: true },
  });
  if (!column) {
    return new Response(
      JSON.stringify({ error: "not_found", message: "Column not found in this board." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Incrémenter le compteur de tâches et créer la tâche
  const [updatedBoard, maxOrder] = await Promise.all([
    prisma.board.update({
      where: { id: boardId },
      data: { taskCounter: { increment: 1 } },
      select: { taskCounter: true },
    }),
    prisma.task.aggregate({ where: { columnId }, _max: { order: true } }),
  ]);

  const task = await prisma.task.create({
    data: {
      boardId,
      columnId,
      title,
      description,
      priority,
      estimate,
      code: `AX-${updatedBoard.taskCounter}`,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  // Dispatcher webhook de manière non-bloquante
  void dispatchWebhooks(workspaceId, "task.created", {
    id: task.id,
    code: task.code,
    title: task.title,
    boardId,
    columnId,
  });

  return new Response(JSON.stringify({ data: task }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### `src/app/api/v1/tasks/[taskId]/route.ts` — PATCH (modifier une tâche)

```typescript
import { NextRequest } from "next/server";
import { requireAPIKey } from "@/lib/api/require-api-key";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { dispatchWebhooks } from "@/lib/api/webhook";

interface Props {
  params: Promise<{ taskId: string }>;
}

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]).optional(),
  estimate: z.number().int().positive().nullable().optional(),
  columnId: z.string().cuid().optional(),
});

export async function PATCH(req: NextRequest, { params }: Props) {
  const auth = await requireAPIKey(req);
  if ("error" in auth) return auth.error;

  const { workspaceId } = auth.context;
  const { taskId } = await params;

  // Vérifier que la tâche appartient au workspace
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      board: { workspaceId },
    },
    select: { id: true, boardId: true },
  });

  if (!task) {
    return new Response(
      JSON.stringify({ error: "not_found", message: "Task not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return new Response(
      JSON.stringify({ error: "bad_request", message: "Invalid JSON." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "validation_error", issues: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.priority !== undefined && { priority: parsed.data.priority }),
      ...(parsed.data.estimate !== undefined && { estimate: parsed.data.estimate }),
      ...(parsed.data.columnId !== undefined && { columnId: parsed.data.columnId }),
    },
  });

  void dispatchWebhooks(workspaceId, "task.updated", { id: updated.id, changes: parsed.data });

  return new Response(JSON.stringify({ data: updated }), {
    headers: { "Content-Type": "application/json" },
  });
}
```

#### `src/lib/actions/api-key.actions.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateAPIKey } from "@/lib/api/api-key";
import { z } from "zod";

async function requireWorkspaceAdmin(workspaceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    select: { role: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Forbidden: Admin role required");
  }

  return session;
}

export interface CreatedAPIKey {
  id: string;
  name: string;
  prefix: string;
  rawKey: string; // Affiché une seule fois
  createdAt: Date;
}

export async function createAPIKey(
  workspaceId: string,
  name: string
): Promise<CreatedAPIKey> {
  await requireWorkspaceAdmin(workspaceId);

  const nameResult = z.string().min(1).max(100).safeParse(name);
  if (!nameResult.success) throw new Error("Invalid name");

  const { raw, hash, prefix } = generateAPIKey();

  const apiKey = await prisma.aPIKey.create({
    data: { workspaceId, name, keyHash: hash, prefix },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });

  revalidatePath(`/[workspaceSlug]/settings/developers`, "page");

  return { ...apiKey, rawKey: raw };
}

export async function revokeAPIKey(workspaceId: string, keyId: string): Promise<void> {
  await requireWorkspaceAdmin(workspaceId);

  await prisma.aPIKey.update({
    where: { id: keyId, workspaceId },
    data: { revokedAt: new Date() },
  });

  revalidatePath(`/[workspaceSlug]/settings/developers`, "page");
}
```

#### `src/lib/actions/webhook.actions.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";

const WEBHOOK_EVENTS = [
  "task.created",
  "task.updated",
  "task.deleted",
  "sprint.completed",
  "ai.suggestion.applied",
] as const;

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

async function requireWorkspaceAdmin(workspaceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    select: { role: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Forbidden");
  }
}

export async function createWebhook(
  workspaceId: string,
  input: { url: string; events: string[] }
): Promise<{ secret: string }> {
  await requireWorkspaceAdmin(workspaceId);

  const parsed = createWebhookSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const secret = crypto.randomBytes(32).toString("hex");

  await prisma.webhookConfig.create({
    data: {
      workspaceId,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
    },
  });

  revalidatePath(`/[workspaceSlug]/settings/developers`, "page");

  // Retourner le secret UNE SEULE FOIS — ne pas le re-exposer après
  return { secret };
}

export async function deleteWebhook(workspaceId: string, webhookId: string): Promise<void> {
  await requireWorkspaceAdmin(workspaceId);

  await prisma.webhookConfig.delete({
    where: { id: webhookId, workspaceId },
  });

  revalidatePath(`/[workspaceSlug]/settings/developers`, "page");
}
```

#### `src/app/(app)/[workspaceSlug]/settings/developers/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIKeyManager } from "@/components/settings/api-key-manager";
import { WebhookManager } from "@/components/settings/webhook-manager";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function DevelopersPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    include: {
      apiKeys: {
        where: { revokedAt: null },
        select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
        orderBy: { createdAt: "desc" },
      },
      webhookConfigs: {
        where: { active: true },
        select: { id: true, url: true, events: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) redirect("/");

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-10">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          Settings
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Developers</h1>
        <p className="text-[14px] text-on-surface-variant mt-1">
          Manage API keys and webhook integrations for{" "}
          <strong className="text-on-surface">{workspace.name}</strong>.
        </p>
      </div>

      {/* Link to docs */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-[13px]">
        <svg className="text-primary shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-on-surface-variant">
          View the{" "}
          <a href="/docs/api" target="_blank" className="text-primary hover:underline font-medium">
            API Reference →
          </a>
        </span>
      </div>

      <APIKeyManager workspaceId={workspace.id} workspaceSlug={workspaceSlug} apiKeys={workspace.apiKeys} />
      <WebhookManager workspaceId={workspace.id} workspaceSlug={workspaceSlug} webhooks={workspace.webhookConfigs} />
    </div>
  );
}
```

#### `src/components/settings/api-key-manager.tsx`

```typescript
"use client";

import { useState, useTransition } from "react";
import { createAPIKey, revokeAPIKey, type CreatedAPIKey } from "@/lib/actions/api-key.actions";

interface APIKeyRecord {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
  apiKeys: APIKeyRecord[];
}

export function APIKeyManager({ workspaceId, workspaceSlug, apiKeys }: Props) {
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<CreatedAPIKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newKeyName.trim()) return;
    startTransition(async () => {
      const result = await createAPIKey(workspaceId, newKeyName.trim());
      setCreatedKey(result);
      setNewKeyName("");
    });
  }

  function handleCopy() {
    if (!createdKey) return;
    void navigator.clipboard.writeText(createdKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke(keyId: string) {
    startTransition(async () => {
      await revokeAPIKey(workspaceId, keyId);
    });
  }

  return (
    <section>
      <h2 className="text-[16px] font-semibold text-on-surface mb-1">API Keys</h2>
      <p className="text-[13px] text-on-surface-variant/70 mb-5">
        Keys authenticate requests to <code className="font-mono text-[12px]">/api/v1/</code>. Store them securely — they are shown only once.
      </p>

      {/* New key created — show once */}
      {createdKey && (
        <div className="mb-5 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="text-[12px] font-semibold text-green-400 mb-2">
            Copy your key now — it will not be shown again.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[12px] text-on-surface bg-surface-container-highest px-3 py-2 rounded-lg truncate">
              {createdKey.rawKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-2 text-[12px] bg-primary text-white rounded-lg hover:brightness-110 transition-all"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="flex items-center gap-2 mb-5">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Key name (e.g. GitHub Actions)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container text-[13px] text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={handleCreate}
          disabled={!newKeyName.trim() || isPending}
          className="shrink-0 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-medium hover:brightness-110 transition-all disabled:opacity-50"
        >
          Generate
        </button>
      </div>

      {/* Existing keys */}
      {apiKeys.length === 0 ? (
        <p className="text-[13px] text-on-surface-variant/50 text-center py-6">
          No API keys yet.
        </p>
      ) : (
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-outline-variant/20 bg-surface-container"
            >
              <div>
                <div className="text-[13px] font-medium text-on-surface">{key.name}</div>
                <div className="text-[11px] text-on-surface-variant/50 font-mono mt-0.5">
                  {key.prefix}••••••••••••••
                  {key.lastUsedAt && (
                    <span className="ml-3 font-sans">
                      Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                disabled={isPending}
                className="text-[12px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

#### `src/components/settings/webhook-manager.tsx`

```typescript
"use client";

import { useState, useTransition } from "react";
import { createWebhook, deleteWebhook } from "@/lib/actions/webhook.actions";

const AVAILABLE_EVENTS = [
  { id: "task.created", label: "Task created" },
  { id: "task.updated", label: "Task updated" },
  { id: "task.deleted", label: "Task deleted" },
  { id: "sprint.completed", label: "Sprint completed" },
  { id: "ai.suggestion.applied", label: "AI suggestion applied" },
];

interface WebhookRecord {
  id: string;
  url: string;
  events: string[];
  createdAt: Date;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
  webhooks: WebhookRecord[];
}

export function WebhookManager({ workspaceId, webhooks }: Props) {
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleEvent(eventId: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  }

  function handleCreate() {
    if (!url || selectedEvents.length === 0) return;
    startTransition(async () => {
      const { secret } = await createWebhook(workspaceId, { url, events: selectedEvents });
      setRevealedSecret(secret);
      setUrl("");
      setSelectedEvents([]);
    });
  }

  function handleDelete(webhookId: string) {
    startTransition(async () => {
      await deleteWebhook(workspaceId, webhookId);
    });
  }

  return (
    <section>
      <h2 className="text-[16px] font-semibold text-on-surface mb-1">Webhooks</h2>
      <p className="text-[13px] text-on-surface-variant/70 mb-5">
        Receive HTTP POST requests when events happen. Payloads are signed with HMAC-SHA256.
      </p>

      {/* Secret revealed after creation */}
      {revealedSecret && (
        <div className="mb-5 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="text-[12px] font-semibold text-green-400 mb-2">
            Webhook signing secret — copy now, not shown again.
          </div>
          <code className="block font-mono text-[12px] text-on-surface bg-surface-container-highest px-3 py-2 rounded-lg break-all">
            {revealedSecret}
          </code>
        </div>
      )}

      {/* Create form */}
      <div className="space-y-3 mb-5 p-4 rounded-xl border border-outline-variant/20 bg-surface-container">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-service.com/webhooks/axiom"
          className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-high text-[13px] text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/50"
        />
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_EVENTS.map((ev) => (
            <button
              key={ev.id}
              onClick={() => toggleEvent(ev.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                selectedEvents.includes(ev.id)
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-surface-container-high text-on-surface-variant border-outline-variant/20"
              }`}
            >
              {ev.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCreate}
          disabled={!url || selectedEvents.length === 0 || isPending}
          className="w-full py-2.5 bg-primary text-white rounded-xl text-[13px] font-medium hover:brightness-110 transition-all disabled:opacity-50"
        >
          Add Webhook
        </button>
      </div>

      {/* Existing webhooks */}
      {webhooks.length === 0 ? (
        <p className="text-[13px] text-on-surface-variant/50 text-center py-4">
          No webhooks configured.
        </p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-outline-variant/20 bg-surface-container"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-mono text-on-surface truncate">{wh.url}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {wh.events.map((ev) => (
                    <span
                      key={ev}
                      className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-mono"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleDelete(wh.id)}
                disabled={isPending}
                className="shrink-0 text-[12px] text-red-400 hover:text-red-300 transition-colors mt-0.5 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

#### `src/app/docs/api/page.tsx` — Documentation API publique statique

```typescript
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Axiom REST API documentation. Integrate Axiom into your tools.",
};

export const dynamic = "force-static";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/v1/boards",
    description: "List all boards in the authenticated workspace.",
    example: `curl -H "Authorization: Bearer axm_yourkey" \\
  ${APP_URL}/api/v1/boards`,
    response: `{
  "data": [
    { "id": "...", "name": "Product Board", "template": "KANBAN", "taskCounter": 42, ... }
  ],
  "meta": { "workspaceId": "...", "count": 1 }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/boards/:boardId/tasks",
    description: "List tasks in a board. Supports pagination via ?page and ?per_page.",
    example: `curl -H "Authorization: Bearer axm_yourkey" \\
  ${APP_URL}/api/v1/boards/BOARD_ID/tasks?per_page=20`,
    response: `{
  "data": [
    { "id": "...", "code": "AX-42", "title": "...", "priority": "HIGH", ... }
  ],
  "meta": { "total": 120, "page": 1, "per_page": 20, "total_pages": 6 }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/tasks",
    description: "Create a new task in a specific board and column.",
    example: `curl -X POST -H "Authorization: Bearer axm_yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{ "boardId": "...", "columnId": "...", "title": "My task", "priority": "HIGH" }' \\
  ${APP_URL}/api/v1/tasks`,
    response: `{ "data": { "id": "...", "code": "AX-43", "title": "My task", ... } }`,
  },
  {
    method: "PATCH",
    path: "/api/v1/tasks/:taskId",
    description: "Update an existing task. All fields are optional.",
    example: `curl -X PATCH -H "Authorization: Bearer axm_yourkey" \\
  -H "Content-Type: application/json" \\
  -d '{ "priority": "URGENT", "columnId": "done-column-id" }' \\
  ${APP_URL}/api/v1/tasks/TASK_ID`,
    response: `{ "data": { "id": "...", "priority": "URGENT", "columnId": "...", ... } }`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/10 text-green-400 border-green-500/20",
  POST: "bg-primary/10 text-primary border-primary/20",
  PATCH: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5">
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Axiom
          </Link>
          <span className="text-on-surface-variant/30">/</span>
          <span className="text-[13px] text-on-surface">API Reference</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            Developer Docs
          </div>
          <h1 className="text-4xl font-semibold text-on-surface tracking-tight mb-3">
            API Reference
          </h1>
          <p className="text-[15px] text-on-surface-variant max-w-xl">
            Axiom provides a REST API to read and write data programmatically. All endpoints require
            an API Key generated in Settings → Developers.
          </p>
        </div>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Authentication</h2>
          <div className="p-5 rounded-xl border border-outline-variant/20 bg-surface-container">
            <p className="text-[14px] text-on-surface-variant mb-3">
              Pass your API key in the <code className="font-mono text-[12px] bg-surface-container-highest px-1.5 py-0.5 rounded">Authorization</code> header:
            </p>
            <pre className="font-mono text-[13px] text-on-surface bg-surface-container-highest p-4 rounded-lg overflow-x-auto">
              {`Authorization: Bearer axm_yourkey`}
            </pre>
          </div>
        </section>

        {/* Base URL */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Base URL</h2>
          <div className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container">
            <code className="font-mono text-[14px] text-primary">{APP_URL}/api/v1</code>
          </div>
        </section>

        {/* Endpoints */}
        <section>
          <h2 className="text-xl font-semibold text-on-surface mb-6">Endpoints</h2>
          <div className="space-y-8">
            {ENDPOINTS.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/20">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono border ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-[14px] font-mono text-on-surface">{ep.path}</code>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-[14px] text-on-surface-variant">{ep.description}</p>
                  <div>
                    <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-wider mb-2">Example</div>
                    <pre className="font-mono text-[12px] text-on-surface bg-surface-container-highest p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                      {ep.example}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-wider mb-2">Response</div>
                    <pre className="font-mono text-[12px] text-on-surface bg-surface-container-highest p-4 rounded-lg overflow-x-auto">
                      {ep.response}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Webhook verification */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Verifying Webhook Signatures</h2>
          <div className="p-5 rounded-xl border border-outline-variant/20 bg-surface-container">
            <p className="text-[14px] text-on-surface-variant mb-4">
              Each webhook request includes a <code className="font-mono text-[12px]">X-Axiom-Signature</code> header (HMAC-SHA256 of the raw body using your signing secret). Verify it server-side:
            </p>
            <pre className="font-mono text-[12px] text-on-surface bg-surface-container-highest p-4 rounded-lg overflow-x-auto">{`// Node.js verification example
const crypto = require("crypto");

function verifyAxiomWebhook(rawBody, signature, secret) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}`}</pre>
          </div>
        </section>
      </main>
    </div>
  );
}
```

---

## 7. Feature 024 — Emails Transactionnels

### 7.1 Tasks

- [ ] T025 — Migration Prisma (champ `emailPreferences Json?` sur User — voir Section 2)
- [ ] T026 — Créer `src/lib/email/resend.ts` (client Resend)
- [ ] T027 — Créer `src/lib/email/templates/invitation.tsx`
- [ ] T028 — Créer `src/lib/email/templates/welcome.tsx`
- [ ] T029 — Créer `src/lib/email/templates/task-assigned.tsx`
- [ ] T030 — Créer `src/lib/email/send.ts` (fonctions d'envoi)
- [ ] T031 — Modifier `src/lib/actions/workspace.actions.ts` (envoyer l'email d'invitation)
- [ ] T032 — Créer `src/app/api/auth/signup-hook/route.ts` (email de bienvenue post-inscription)
- [ ] T033 — Créer `src/app/unsubscribe/[token]/page.tsx` (désinscription one-click)

### 7.2 Code complet

#### `src/lib/email/resend.ts`

```typescript
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is not set");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_ADDRESS =
  process.env.RESEND_FROM ?? "Axiom <noreply@axiom.dev>";
```

#### `src/lib/email/templates/invitation.tsx`

```typescript
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Heading, Preview,
} from "@react-email/components";

interface InvitationEmailProps {
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiresInDays: number;
}

export function InvitationEmail({
  workspaceName,
  inviterName,
  role,
  inviteUrl,
  expiresInDays,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You have been invited to join {workspaceName} on Axiom</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Logo */}
          <Section style={styles.logoSection}>
            <Text style={styles.logo}>Axiom</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.heading}>
              You have been invited to {workspaceName}
            </Heading>

            <Text style={styles.text}>
              {inviterName} has invited you to join{" "}
              <strong style={{ color: "#dfe2f1" }}>{workspaceName}</strong> as{" "}
              <strong style={{ color: "#dfe2f1" }}>{role}</strong>.
            </Text>

            <Text style={styles.text}>
              Axiom is an AI-powered Kanban board for engineering teams.
            </Text>

            <Button style={styles.button} href={inviteUrl}>
              Accept invitation
            </Button>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              This invitation expires in {expiresInDays} days. If you did not expect this
              invitation, you can safely ignore this email.
            </Text>
          </Section>

          <Text style={styles.unsubscribeNote}>
            Axiom · You received this because you were invited to a workspace.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#0b0f19", fontFamily: "system-ui, -apple-system, sans-serif" },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" },
  logoSection: { marginBottom: "32px" },
  logo: { color: "#3B82F6", fontSize: "20px", fontWeight: "700", margin: 0 },
  card: {
    backgroundColor: "#1c1f2a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "32px",
  },
  heading: { color: "#dfe2f1", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" },
  text: { color: "#c2c6d6", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" },
  button: {
    backgroundColor: "#3B82F6",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    display: "block",
    textAlign: "center" as const,
    margin: "24px 0",
  },
  hr: { borderColor: "rgba(255,255,255,0.08)", margin: "24px 0" },
  footer: { color: "#c2c6d6", fontSize: "13px", lineHeight: "1.6" },
  unsubscribeNote: { color: "#424754", fontSize: "12px", textAlign: "center" as const, marginTop: "24px" },
};
```

#### `src/lib/email/templates/welcome.tsx`

```typescript
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Heading, Preview,
} from "@react-email/components";

interface WelcomeEmailProps {
  userName: string;
  appUrl: string;
}

export function WelcomeEmail({ userName, appUrl }: WelcomeEmailProps) {
  const APP_URL = appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://axiom-kanban.vercel.app";

  return (
    <Html>
      <Head />
      <Preview>Welcome to Axiom — your workspace is ready</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoSection}>
            <Text style={styles.logo}>Axiom</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.heading}>
              Welcome to Axiom, {userName}.
            </Heading>

            <Text style={styles.text}>
              Your account is set up. Here is what Axiom can do for you:
            </Text>

            {[
              {
                title: "Kanban board",
                desc: "Organize your work into columns. Drag tasks across stages.",
              },
              {
                title: "Axiom Intelligence",
                desc: "Open any task and get AI suggestions: priority, estimation, blocker detection.",
              },
              {
                title: "Sprint analytics",
                desc: "Track velocity and burndown across sprints, without manual data entry.",
              },
            ].map((feature) => (
              <Section key={feature.title} style={styles.feature}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </Section>
            ))}

            <Button style={styles.button} href={`${APP_URL}/workspaces/new`}>
              Create your first board
            </Button>

            <Hr style={styles.hr} />

            <Text style={styles.footer}>
              If you did not sign up for Axiom, you can safely ignore this email.
            </Text>
          </Section>

          <Text style={styles.unsubscribeNote}>Axiom — AI-powered Kanban</Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#0b0f19", fontFamily: "system-ui, -apple-system, sans-serif" },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" },
  logoSection: { marginBottom: "32px" },
  logo: { color: "#3B82F6", fontSize: "20px", fontWeight: "700", margin: 0 },
  card: {
    backgroundColor: "#1c1f2a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "32px",
  },
  heading: { color: "#dfe2f1", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" },
  text: { color: "#c2c6d6", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" },
  feature: { marginBottom: "12px" },
  featureTitle: { color: "#dfe2f1", fontSize: "14px", fontWeight: "600", margin: "0 0 2px" },
  featureDesc: { color: "#c2c6d6", fontSize: "13px", lineHeight: "1.5", margin: 0 },
  button: {
    backgroundColor: "#3B82F6",
    color: "#ffffff",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
    display: "block",
    textAlign: "center" as const,
    margin: "24px 0",
  },
  hr: { borderColor: "rgba(255,255,255,0.08)", margin: "24px 0" },
  footer: { color: "#c2c6d6", fontSize: "13px", lineHeight: "1.6" },
  unsubscribeNote: { color: "#424754", fontSize: "12px", textAlign: "center" as const, marginTop: "24px" },
};
```

#### `src/lib/email/templates/task-assigned.tsx`

```typescript
import {
  Html, Head, Body, Container, Section, Text, Button, Heading, Preview,
} from "@react-email/components";

interface TaskAssignedEmailProps {
  recipientName: string;
  assignerName: string;
  taskCode: string;
  taskTitle: string;
  boardName: string;
  taskUrl: string;
}

export function TaskAssignedEmail({
  recipientName,
  assignerName,
  taskCode,
  taskTitle,
  boardName,
  taskUrl,
}: TaskAssignedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{taskCode}: {taskTitle} was assigned to you</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.logoSection}>
            <Text style={styles.logo}>Axiom</Text>
          </Section>

          <Section style={styles.card}>
            <Heading style={styles.heading}>Task assigned to you</Heading>

            <Text style={styles.text}>
              {assignerName} assigned you to a task in{" "}
              <strong style={{ color: "#dfe2f1" }}>{boardName}</strong>.
            </Text>

            <Section style={styles.taskCard}>
              <Text style={styles.taskCode}>{taskCode}</Text>
              <Text style={styles.taskTitle}>{taskTitle}</Text>
            </Section>

            <Button style={styles.button} href={taskUrl}>
              View task
            </Button>

            <Text style={styles.footer}>
              You are receiving this because you are a member of this workspace.
            </Text>
          </Section>

          <Text style={styles.unsubscribeNote}>Axiom</Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: { backgroundColor: "#0b0f19", fontFamily: "system-ui, -apple-system, sans-serif" },
  container: { maxWidth: "560px", margin: "0 auto", padding: "40px 20px" },
  logoSection: { marginBottom: "32px" },
  logo: { color: "#3B82F6", fontSize: "20px", fontWeight: "700", margin: 0 },
  card: { backgroundColor: "#1c1f2a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "32px" },
  heading: { color: "#dfe2f1", fontSize: "22px", fontWeight: "600", margin: "0 0 16px" },
  text: { color: "#c2c6d6", fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" },
  taskCard: { backgroundColor: "#262a35", borderRadius: "12px", padding: "16px", margin: "16px 0" },
  taskCode: { color: "#8B5CF6", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em", margin: "0 0 4px", fontFamily: "monospace" },
  taskTitle: { color: "#dfe2f1", fontSize: "16px", fontWeight: "600", margin: 0 },
  button: { backgroundColor: "#3B82F6", color: "#ffffff", borderRadius: "12px", padding: "12px 24px", fontSize: "14px", fontWeight: "600", textDecoration: "none", display: "block", textAlign: "center" as const, margin: "24px 0" },
  footer: { color: "#c2c6d6", fontSize: "13px", lineHeight: "1.6" },
  unsubscribeNote: { color: "#424754", fontSize: "12px", textAlign: "center" as const, marginTop: "24px" },
};
```

#### `src/lib/email/send.ts`

```typescript
import { render } from "@react-email/render";
import { resend, FROM_ADDRESS } from "./resend";
import { InvitationEmail } from "./templates/invitation";
import { WelcomeEmail } from "./templates/welcome";
import { TaskAssignedEmail } from "./templates/task-assigned";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export async function sendInvitationEmail(params: {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteToken: string;
  expiresInDays: number;
}) {
  const inviteUrl = `${APP_URL}/accept-invitation?token=${params.inviteToken}`;

  const html = await render(
    InvitationEmail({
      workspaceName: params.workspaceName,
      inviterName: params.inviterName,
      role: params.role,
      inviteUrl,
      expiresInDays: params.expiresInDays,
    })
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `You have been invited to join ${params.workspaceName} on Axiom`,
    html,
  });
}

export async function sendWelcomeEmail(params: { to: string; userName: string }) {
  const html = await render(WelcomeEmail({ userName: params.userName, appUrl: APP_URL }));

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: "Welcome to Axiom",
    html,
  });
}

export async function sendTaskAssignedEmail(params: {
  to: string;
  recipientName: string;
  assignerName: string;
  taskCode: string;
  taskTitle: string;
  boardName: string;
  boardId: string;
  taskId: string;
  workspaceSlug: string;
}) {
  const taskUrl = `${APP_URL}/${params.workspaceSlug}/boards/${params.boardId}?task=${params.taskId}`;

  const html = await render(
    TaskAssignedEmail({
      recipientName: params.recipientName,
      assignerName: params.assignerName,
      taskCode: params.taskCode,
      taskTitle: params.taskTitle,
      boardName: params.boardName,
      taskUrl,
    })
  );

  return resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `${params.taskCode}: ${params.taskTitle} — assigned to you`,
    html,
  });
}
```

#### Modifier `src/lib/actions/workspace.actions.ts` — ajouter l'envoi d'email d'invitation

```typescript
// Ajouter en haut du fichier :
import { sendInvitationEmail } from "@/lib/email/send";

// Dans la fonction inviteMember, après avoir créé l'invitation en DB :
// Envoyer l'email de manière non-bloquante
void sendInvitationEmail({
  to: email,
  workspaceName: workspace.name,
  inviterName: session.user.name,
  role: role,
  inviteToken: token,
  expiresInDays: 7,
}).catch(() => {
  // Ne pas faire échouer l'action si l'email échoue
  // En production : logger l'erreur dans Sentry
});
```

#### Créer `src/app/api/auth/signup-hook/route.ts` — welcome email post-inscription

```typescript
import { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/send";

// Better Auth n'a pas de webhook post-signup natif.
// Appeler cette route depuis la page sign-up après une inscription réussie.
// Ou utiliser Better Auth plugins si disponible dans la version installée.

export async function POST(req: NextRequest) {
  const { email, name } = await req.json() as { email: string; name: string };

  if (!email || !name) {
    return new Response(JSON.stringify({ error: "Missing email or name" }), { status: 400 });
  }

  // Fire and forget — ne pas attendre la réponse Resend
  void sendWelcomeEmail({ to: email, userName: name }).catch(() => {});

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
```

> **Intégration signup** : Modifier `src/app/(auth)/sign-up/page.tsx` pour appeler `/api/auth/signup-hook` après une inscription réussie :
> ```typescript
> // Après la réponse réussie de Better Auth :
> void fetch("/api/auth/signup-hook", {
>   method: "POST",
>   headers: { "Content-Type": "application/json" },
>   body: JSON.stringify({ email: formEmail, name: formName }),
> });
> ```

#### `src/app/unsubscribe/[token]/page.tsx` — désinscription one-click

```typescript
import Link from "next/link";
// Note: pour une vraie désinscription, stocker un token de désinscription unique par utilisateur
// et l'inclure dans chaque email. Pour ce scope, afficher une page informative.

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-widest mb-3">
          Axiom
        </div>
        <h1 className="text-2xl font-semibold text-on-surface mb-3">
          Email preferences updated.
        </h1>
        <p className="text-[14px] text-on-surface-variant mb-8 leading-relaxed">
          You have been unsubscribed from this type of notification. You can manage all notification
          preferences in your account settings.
        </p>
        <Link
          href="/login"
          className="inline-flex px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface rounded-xl text-[14px] font-medium hover:bg-surface-container-high transition-colors"
        >
          Back to Axiom
        </Link>
      </div>
    </div>
  );
}
```

---

## 8. Ordre d'exécution recommandé

```bash
# 1. Rate Limiting Dashboard (sans dépendance externe)
git checkout main && git pull
git checkout -b feat-018-rate-limiting-dashboard
# Migration Prisma + T001-T005
npx prisma migrate dev --name add-workspace-ai-quota
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 2. PWA (peut être parallélisé avec feat-018)
git checkout main && git pull
git checkout -b feat-020-pwa
# T006-T010
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 3. Webhooks & API publique (migration + routes + UI)
git checkout main && git pull
git checkout -b feat-017-webhooks-api
# Migration Prisma + T011-T024
npx prisma migrate dev --name add-api-keys-webhooks
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 4. Emails transactionnels (Resend + React Email)
git checkout main && git pull
git checkout -b feat-024-emails
# Migration Prisma + T025-T033
npx prisma migrate dev --name add-email-preferences
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge
```

---

## 9. Checklist de validation finale

- [ ] Rate limiting : quota s'affiche dans Settings → AI Quota avec barre de progression
- [ ] Les endpoints IA retournent `{ error: "quota_exceeded" }` avec message on-brand quand 429
- [ ] PWA : Lighthouse score PWA vert (toutes checks passent)
- [ ] PWA : "Add to Home Screen" disponible sur Chrome mobile en HTTPS
- [ ] `GET /api/v1/boards` avec Bearer token valide retourne les boards en JSON
- [ ] `POST /api/v1/tasks` crée une tâche avec code `AX-N` incrémenté
- [ ] API Key révoquée retourne 401 immédiatement
- [ ] Webhook configuré reçoit le payload dans les 5 secondes après `task.created`
- [ ] Signature HMAC vérifiable avec le secret partagé (tester avec le script de la doc)
- [ ] `/docs/api` accessible sans login, contient les 4 endpoints documentés
- [ ] Email d'invitation envoyé lors d'un `inviteMember()` (vérifier dans dashboard Resend)
- [ ] Email de bienvenue envoyé après inscription (vérifier dans dashboard Resend)
- [ ] Templates emails s'affichent correctement (tester via `pnpm email:dev` si React Email CLI installé)
- [ ] `RESEND_API_KEY` et `RESEND_FROM` dans Vercel env vars
- [ ] `PROGRESS.md` mis à jour après chaque merge
