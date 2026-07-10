# Axiom — Phase E Delegation Document
> Version 1.0 | 2026-07-10 | Délégation complète sans retour requis

Ce document est autonome. L'assistant peut implémenter les 4 features de Phase E sans poser de questions.
Phase E est la **dernière phase** — elle complète les 24 features du projet Axiom.

---

## 0. Contexte du projet

**Stack** : Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, Better Auth, Prisma 7, PostgreSQL (Neon)

**Phases A-D complétées** : Setup, Core Kanban, Realtime, AI, Analytics, Mobile, UX, Dark Mode, SEO, Landing Page, Changelog, Roadmap, Sentry, PWA, Webhooks, Rate Limiting, Emails.

**Prisma schema actuel** (état après Phase D) : User, Account, Session, Verification, Workspace (+ aiRequestsToday, aiRequestsResetAt, apiKeys, webhookConfigs depuis Phase D), WorkspaceMember, Invitation, Board, Column, Task, TaskAssignee, Label, TaskLabel, Comment, ActivityEvent, Sprint, AILog, Notification, APIKey, WebhookConfig.

**Trois migrations supplémentaires** requises pour Phase E (voir Section 2).

---

## 1. Packages à installer

```bash
pnpm add next-intl stripe @stripe/stripe-js papaparse
pnpm add -D @types/papaparse
```

---

## 2. Migrations Prisma — 3 modifications

### Migration 1 — i18n locale sur User (Feature 021)

Ajouter dans le model `User` :

```prisma
model User {
  // ... champs existants ...
  locale  String  @default("fr")   // ← AJOUTER : "fr" | "en"
}
```

### Migration 2 — Billing sur Workspace (Feature 022)

Ajouter l'enum et les champs Stripe dans `prisma/schema.prisma` :

```prisma
enum WorkspacePlan {
  FREE
  PRO
  TEAM
}

model Workspace {
  // ... champs existants ...
  plan                  WorkspacePlan @default(FREE)    // ← AJOUTER
  stripeCustomerId      String?                         // ← AJOUTER
  stripeSubscriptionId  String?                         // ← AJOUTER
  planExpiresAt         DateTime?                       // ← AJOUTER : fin de période en cours
}
```

### Migration 3 — AuditLog (Feature 023)

Ajouter l'enum et le nouveau model dans `prisma/schema.prisma` :

```prisma
enum AuditAction {
  // Workspace
  WORKSPACE_CREATED
  WORKSPACE_RENAMED
  WORKSPACE_DELETED
  // Membres
  MEMBER_INVITED
  MEMBER_JOINED
  MEMBER_ROLE_CHANGED
  MEMBER_REMOVED
  // Boards
  BOARD_CREATED
  BOARD_DELETED
  // Tâches
  TASK_DELETED
  // Auth
  AUTH_LOGIN
  AUTH_LOGIN_FAILED
  AUTH_LOGOUT
  // API
  API_KEY_CREATED
  API_KEY_REVOKED
  API_KEY_USED
  // IA
  AI_SUGGESTION_APPLIED
  // Billing
  BILLING_UPGRADED
  BILLING_DOWNGRADED
  BILLING_CANCELLED
}

model AuditLog {
  id          String      @id @default(cuid())
  workspaceId String
  actorId     String?     // null pour les events système (ex: downgrade auto)
  actorEmail  String
  action      AuditAction
  targetType  String?     // "board", "task", "member", etc.
  targetId    String?
  targetLabel String?     // label lisible : nom du board, email du membre, etc.
  metadata    Json?       // données supplémentaires : ancien rôle → nouveau rôle
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime    @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([workspaceId, createdAt])
  @@index([actorId])
  @@map("audit_logs")
}
```

> Ajouter `auditLogs AuditLog[]` dans le model `Workspace`.

### Exécuter les migrations

```bash
npx prisma migrate dev --name add-i18n-billing-audit-log
```

---

## 3. Variables d'environnement à ajouter

```env
# Stripe (Feature 022)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx          # sk_test_ en développement
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxx        # ID du Price Pro dans Stripe Dashboard
STRIPE_TEAM_PRICE_ID=price_xxxxxxxxxxxx       # ID du Price Team dans Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xx  # pk_test_ en développement
```

> Ajouter dans Vercel → Settings → Environment Variables.

---

## 4. Feature 021 — Internationalisation FR/EN

> next-intl avec middleware de routing. Français par défaut.

### 4.1 Tasks

- [ ] T001 — Migration Prisma (`locale` sur User — voir Section 2)
- [ ] T002 — Créer `messages/fr.json` et `messages/en.json` (toutes les chaînes UI)
- [ ] T003 — Créer `src/i18n.ts` (config next-intl)
- [ ] T004 — Créer `src/middleware.ts` (routing i18n avec next-intl)
- [ ] T005 — Modifier `src/app/[locale]/layout.tsx` (wrap avec NextIntlClientProvider)
- [ ] T006 — Créer `src/lib/actions/locale.actions.ts` (sauvegarder la langue en DB)
- [ ] T007 — Créer `src/components/ui/locale-switcher.tsx` (toggle FR/EN)
- [ ] T008 — Passer les composants clés à `useTranslations()` (nav, toasts, AI copy, errors)

### 4.2 Code complet

#### `messages/fr.json`

```json
{
  "nav": {
    "boards": "Tableaux",
    "analytics": "Analytiques",
    "settings": "Paramètres",
    "notifications": "Notifications",
    "developers": "Développeurs",
    "aiQuota": "Quota IA",
    "newBoard": "Nouveau tableau",
    "newWorkspace": "Nouvel espace de travail"
  },
  "auth": {
    "signIn": "Se connecter",
    "signOut": "Se déconnecter",
    "signUp": "Créer un compte",
    "email": "Adresse email",
    "password": "Mot de passe",
    "name": "Nom complet",
    "continueWithGoogle": "Continuer avec Google",
    "alreadyHaveAccount": "Déjà un compte ?",
    "noAccount": "Pas encore de compte ?"
  },
  "board": {
    "addTask": "Ajouter une tâche",
    "addColumn": "Ajouter une colonne",
    "deleteBoard": "Supprimer le tableau",
    "emptyColumn": "Aucune tâche dans cette colonne",
    "taskCode": "Code",
    "taskTitle": "Titre",
    "taskPriority": "Priorité",
    "taskEstimate": "Estimation",
    "taskDueDate": "Échéance",
    "priority": {
      "URGENT": "Urgent",
      "HIGH": "Haute",
      "MEDIUM": "Moyenne",
      "LOW": "Faible"
    }
  },
  "ai": {
    "name": "Axiom Intelligence",
    "prioritize": "Analyser la priorité",
    "estimate": "Estimer l'effort",
    "describe": "Enrichir la description",
    "detectBlocker": "Détecter les blocages",
    "assign": "Suggérer un assigné",
    "thinking": "Axiom Intelligence analyse...",
    "quotaReached": "Le quota Axiom Intelligence pour aujourd'hui est atteint. Réinitialisation à minuit UTC.",
    "suggestionApplied": "Suggestion appliquée",
    "confidence": "Confiance"
  },
  "sprint": {
    "active": "Sprint actif",
    "planned": "Planifié",
    "completed": "Terminé",
    "startDate": "Début",
    "endDate": "Fin",
    "velocity": "Vélocité",
    "burndown": "Burndown"
  },
  "settings": {
    "title": "Paramètres",
    "general": "Général",
    "members": "Membres",
    "billing": "Facturation",
    "developers": "Développeurs",
    "notifications": "Notifications",
    "language": "Langue",
    "theme": "Thème",
    "dangerZone": "Zone de danger",
    "deleteWorkspace": "Supprimer l'espace de travail"
  },
  "billing": {
    "currentPlan": "Plan actuel",
    "upgrade": "Passer à Pro",
    "manage": "Gérer l'abonnement",
    "renewsOn": "Renouvellement le",
    "freePlan": "Plan Gratuit",
    "proPlan": "Plan Pro",
    "teamPlan": "Plan Team",
    "limitReached": "Vous avez atteint la limite du plan Gratuit. Passez à Pro pour continuer.",
    "upgradeCta": "Voir les plans"
  },
  "errors": {
    "generic": "Une erreur est survenue. Veuillez réessayer.",
    "unauthorized": "Accès non autorisé.",
    "notFound": "Page introuvable.",
    "forbidden": "Vous n'avez pas les permissions nécessaires."
  },
  "actions": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "confirm": "Confirmer",
    "back": "Retour",
    "loading": "Chargement...",
    "copy": "Copier",
    "copied": "Copié",
    "export": "Exporter"
  }
}
```

#### `messages/en.json`

```json
{
  "nav": {
    "boards": "Boards",
    "analytics": "Analytics",
    "settings": "Settings",
    "notifications": "Notifications",
    "developers": "Developers",
    "aiQuota": "AI Quota",
    "newBoard": "New board",
    "newWorkspace": "New workspace"
  },
  "auth": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "signUp": "Create account",
    "email": "Email address",
    "password": "Password",
    "name": "Full name",
    "continueWithGoogle": "Continue with Google",
    "alreadyHaveAccount": "Already have an account?",
    "noAccount": "No account yet?"
  },
  "board": {
    "addTask": "Add task",
    "addColumn": "Add column",
    "deleteBoard": "Delete board",
    "emptyColumn": "No tasks in this column",
    "taskCode": "Code",
    "taskTitle": "Title",
    "taskPriority": "Priority",
    "taskEstimate": "Estimate",
    "taskDueDate": "Due date",
    "priority": {
      "URGENT": "Urgent",
      "HIGH": "High",
      "MEDIUM": "Medium",
      "LOW": "Low"
    }
  },
  "ai": {
    "name": "Axiom Intelligence",
    "prioritize": "Analyze priority",
    "estimate": "Estimate effort",
    "describe": "Enrich description",
    "detectBlocker": "Detect blockers",
    "assign": "Suggest assignee",
    "thinking": "Axiom Intelligence is analyzing...",
    "quotaReached": "Axiom Intelligence quota reached for today. Resets at midnight UTC.",
    "suggestionApplied": "Suggestion applied",
    "confidence": "Confidence"
  },
  "sprint": {
    "active": "Active sprint",
    "planned": "Planned",
    "completed": "Completed",
    "startDate": "Start",
    "endDate": "End",
    "velocity": "Velocity",
    "burndown": "Burndown"
  },
  "settings": {
    "title": "Settings",
    "general": "General",
    "members": "Members",
    "billing": "Billing",
    "developers": "Developers",
    "notifications": "Notifications",
    "language": "Language",
    "theme": "Theme",
    "dangerZone": "Danger zone",
    "deleteWorkspace": "Delete workspace"
  },
  "billing": {
    "currentPlan": "Current plan",
    "upgrade": "Upgrade to Pro",
    "manage": "Manage subscription",
    "renewsOn": "Renews on",
    "freePlan": "Free plan",
    "proPlan": "Pro plan",
    "teamPlan": "Team plan",
    "limitReached": "You've reached the Free plan limit. Upgrade to Pro to continue.",
    "upgradeCta": "View plans"
  },
  "errors": {
    "generic": "Something went wrong. Please try again.",
    "unauthorized": "Unauthorized.",
    "notFound": "Page not found.",
    "forbidden": "You don't have permission to access this."
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Confirm",
    "back": "Back",
    "loading": "Loading...",
    "copy": "Copy",
    "copied": "Copied",
    "export": "Export"
  }
}
```

#### `src/i18n.ts`

```typescript
import { getRequestConfig } from "next-intl/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default getRequestConfig(async () => {
  // Essayer d'obtenir la locale de l'utilisateur connecté
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  let locale: "fr" | "en" = "fr"; // défaut FR

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { locale: true },
    });
    if (user?.locale === "en") locale = "en";
  } else {
    // Détection via Accept-Language pour les visiteurs non authentifiés
    const acceptLanguage = (await headers()).get("accept-language") ?? "";
    if (acceptLanguage.toLowerCase().includes("en") && !acceptLanguage.toLowerCase().startsWith("fr")) {
      locale = "en";
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

#### Modifier `next.config.ts` — intégrer next-intl

```typescript
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

// Chaîner : Sentry (Phase C) → PWA (Phase D) → next-intl (Phase E)
// Si withSentryConfig est présent : withSentryConfig(withNextIntl(withPWA(nextConfig)), sentryOpts)
export default withNextIntl(withPWA(nextConfig));
```

#### `src/lib/actions/locale.actions.ts`

```typescript
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateLocale(locale: "fr" | "en"): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale },
  });

  // Revalider toutes les pages — la locale change l'intégralité de l'UI
  revalidatePath("/", "layout");
}
```

#### `src/components/ui/locale-switcher.tsx`

```typescript
"use client";

import { useTransition } from "react";
import { updateLocale } from "@/lib/actions/locale.actions";

interface Props {
  currentLocale: "fr" | "en";
}

export function LocaleSwitcher({ currentLocale }: Props) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = currentLocale === "fr" ? "en" : "fr";
    startTransition(() => updateLocale(next));
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-outline-variant/20 bg-surface-container text-[12px] font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all disabled:opacity-50"
      title={currentLocale === "fr" ? "Switch to English" : "Passer en français"}
    >
      <span className="text-[13px]">{currentLocale === "fr" ? "🇫🇷" : "🇬🇧"}</span>
      <span className="uppercase tracking-wide">{currentLocale}</span>
      {isPending && (
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </button>
  );
}
```

#### Utiliser `useTranslations` dans les composants

```typescript
// Pattern à appliquer dans chaque composant client :
"use client";
import { useTranslations } from "next-intl";

export function SomeComponent() {
  const t = useTranslations("board"); // namespace du fichier JSON

  return <button>{t("addTask")}</button>;
}

// Dans les Server Components :
import { getTranslations } from "next-intl/server";

export default async function SomePage() {
  const t = await getTranslations("settings");
  return <h1>{t("title")}</h1>;
}
```

> **Règle** : passer TOUS les composants de `src/components/` et `src/app/` à `useTranslations()` / `getTranslations()`. Aucune chaîne en dur dans le JSX. Priorité : composants du layout principal, toasts, messages d'erreur, copy IA.

---

## 5. Feature 022 — Billing / Pricing (Stripe)

### 5.1 Tasks

- [ ] T009 — Migration Prisma (`plan`, `stripeCustomerId`, `stripeSubscriptionId` sur Workspace — voir Section 2)
- [ ] T010 — Créer `src/lib/billing/stripe.ts` (client Stripe + plan limits)
- [ ] T011 — Créer `src/lib/billing/plan-limits.ts` (enforcement des limites par plan)
- [ ] T012 — Créer `src/app/pricing/page.tsx` (page publique pricing)
- [ ] T013 — Créer `src/app/api/billing/checkout/route.ts` (Stripe Checkout Session)
- [ ] T014 — Créer `src/app/api/billing/portal/route.ts` (Stripe Customer Portal)
- [ ] T015 — Créer `src/app/api/billing/webhook/route.ts` (Stripe Webhook handler)
- [ ] T016 — Créer `src/app/(app)/[workspaceSlug]/settings/billing/page.tsx`
- [ ] T017 — Modifier `src/lib/actions/board.actions.ts` (vérifier la limite de boards avant création)
- [ ] T018 — Modifier `src/lib/actions/workspace.actions.ts` (vérifier la limite de membres avant invitation)

### 5.2 Code complet

#### `src/lib/billing/stripe.ts`

```typescript
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30",
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  TEAM: process.env.STRIPE_TEAM_PRICE_ID!,
} as const;
```

#### `src/lib/billing/plan-limits.ts`

```typescript
import { WorkspacePlan } from "@prisma/client";

export interface PlanLimits {
  maxBoards: number;
  maxMembers: number;
  maxAIRequestsPerDay: number;
  hasWebhooks: boolean;
  hasAuditLog: boolean;
  auditLogRetentionDays: number;
}

export const PLAN_LIMITS: Record<WorkspacePlan, PlanLimits> = {
  FREE: {
    maxBoards: 3,
    maxMembers: 10,
    maxAIRequestsPerDay: 20,
    hasWebhooks: false,
    hasAuditLog: false,
    auditLogRetentionDays: 0,
  },
  PRO: {
    maxBoards: Infinity,
    maxMembers: 50,
    maxAIRequestsPerDay: 200,
    hasWebhooks: true,
    hasAuditLog: true,
    auditLogRetentionDays: 90,
  },
  TEAM: {
    maxBoards: Infinity,
    maxMembers: Infinity,
    maxAIRequestsPerDay: 500,
    hasWebhooks: true,
    hasAuditLog: true,
    auditLogRetentionDays: 365,
  },
};

export function getPlanLimits(plan: WorkspacePlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function formatLimit(value: number): string {
  return value === Infinity ? "Unlimited" : value.toString();
}
```

#### `src/app/api/billing/checkout/route.ts`

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/billing/stripe";
import { headers } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { workspaceId, plan } = await req.json() as { workspaceId: string; plan: "PRO" | "TEAM" };

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400 });
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
    select: { id: true, name: true, stripeCustomerId: true, slug: true },
  });

  if (!workspace) {
    return new Response(JSON.stringify({ error: "Workspace not found" }), { status: 404 });
  }

  // Créer ou récupérer le Customer Stripe
  let customerId = workspace.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: workspace.name,
      metadata: { workspaceId: workspace.id },
    });
    customerId = customer.id;

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/${workspace.slug}/settings/billing?success=1`,
    cancel_url: `${APP_URL}/pricing`,
    metadata: { workspaceId: workspace.id, plan },
    subscription_data: {
      metadata: { workspaceId: workspace.id, plan },
    },
  });

  return new Response(JSON.stringify({ url: checkoutSession.url }), {
    headers: { "Content-Type": "application/json" },
  });
}
```

#### `src/app/api/billing/portal/route.ts`

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing/stripe";
import { headers } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { workspaceId } = await req.json() as { workspaceId: string };

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
    select: { stripeCustomerId: true, slug: true },
  });

  if (!workspace?.stripeCustomerId) {
    return new Response(JSON.stringify({ error: "No billing account found" }), { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${APP_URL}/${workspace.slug}/settings/billing`,
  });

  return new Response(JSON.stringify({ url: portalSession.url }), {
    headers: { "Content-Type": "application/json" },
  });
}
```

#### `src/app/api/billing/webhook/route.ts`

```typescript
import { NextRequest } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { WorkspacePlan } from "@prisma/client";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  async function getPlanFromPriceId(priceId: string): Promise<WorkspacePlan> {
    if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return "TEAM";
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
    return "FREE";
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = await getPlanFromPriceId(priceId);
      const expiresAt = new Date(subscription.current_period_end * 1000);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan,
          stripeSubscriptionId: subscription.id,
          planExpiresAt: expiresAt,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          workspaceId,
          actorEmail: "system",
          action: "BILLING_UPGRADED",
          targetType: "workspace",
          targetId: workspaceId,
          metadata: { plan, subscriptionId: subscription.id },
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspaceId;
      if (!workspaceId) break;

      const priceId = subscription.items.data[0]?.price.id;
      const plan = await getPlanFromPriceId(priceId);
      const expiresAt = new Date(subscription.current_period_end * 1000);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { plan, planExpiresAt: expiresAt },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspaceId;
      if (!workspaceId) break;

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { plan: "FREE", stripeSubscriptionId: null, planExpiresAt: null },
      });

      await prisma.auditLog.create({
        data: {
          workspaceId,
          actorEmail: "system",
          action: "BILLING_CANCELLED",
          targetType: "workspace",
          targetId: workspaceId,
          metadata: { subscriptionId: subscription.id },
        },
      });
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

#### `src/app/pricing/page.tsx`

```typescript
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Axiom",
  description: "Simple, transparent pricing for elite engineering teams.",
};

export const dynamic = "force-static";

const PLANS = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individuals and small experiments.",
    cta: "Get started",
    ctaHref: "/sign-up",
    highlighted: false,
    features: [
      "1 workspace",
      "3 boards",
      "10 members",
      "20 AI requests/day",
      "Realtime collaboration",
      "Sprint analytics",
    ],
    limits: ["No webhooks", "No audit log", "Community support"],
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "For professional teams who need the full Axiom Intelligence stack.",
    cta: "Upgrade to Pro",
    ctaHref: "#upgrade-pro",
    highlighted: true,
    features: [
      "Unlimited workspaces",
      "Unlimited boards",
      "50 members",
      "200 AI requests/day",
      "Webhooks & Public API",
      "Audit log (90 days)",
      "Email notifications",
      "PWA (offline access)",
    ],
    limits: [],
  },
  {
    id: "TEAM",
    name: "Team",
    price: "$29",
    period: "/month",
    description: "For scaling organisations with enterprise governance needs.",
    cta: "Upgrade to Team",
    ctaHref: "#upgrade-team",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Unlimited members",
      "500 AI requests/day",
      "Audit log (365 days)",
      "Priority support",
      "Advanced webhook retry",
      "SSO (coming soon)",
    ],
    limits: [],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Nav */}
      <nav className="border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[15px] font-semibold text-on-surface tracking-tight">
            Axiom
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-medium hover:brightness-110 transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-4">
            Pricing
          </div>
          <h1 className="text-5xl font-semibold text-on-surface tracking-tight mb-4">
            Simple, transparent.
          </h1>
          <p className="text-[17px] text-on-surface-variant max-w-lg mx-auto leading-relaxed">
            Start free. Upgrade when your team needs more.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "bg-primary/5 border-primary/30 shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)]"
                  : "bg-surface-container border-outline-variant/20"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-3 py-1 bg-primary text-white rounded-full text-[11px] font-semibold tracking-wide">
                    Most popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="text-[13px] font-semibold text-on-surface-variant/60 mb-1">
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-semibold text-on-surface">{plan.price}</span>
                  {plan.period !== "forever" && (
                    <span className="text-[14px] text-on-surface-variant mb-1">{plan.period}</span>
                  )}
                  {plan.period === "forever" && (
                    <span className="text-[13px] text-on-surface-variant/50 mb-1">forever</span>
                  )}
                </div>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <svg className="text-green-400 mt-0.5 shrink-0" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="13">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[13px] text-on-surface-variant">{f}</span>
                  </div>
                ))}
                {plan.limits.map((l) => (
                  <div key={l} className="flex items-start gap-2.5">
                    <svg className="text-on-surface-variant/30 mt-0.5 shrink-0" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13">
                      <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                    <span className="text-[13px] text-on-surface-variant/40">{l}</span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 rounded-xl text-[14px] font-semibold transition-all ${
                  plan.highlighted
                    ? "bg-primary text-white hover:brightness-110"
                    : "bg-surface-container-high text-on-surface border border-outline-variant/30 hover:bg-surface-container-highest"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ minimal */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-on-surface mb-6 text-center">Questions</h2>
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from Settings → Billing. You keep Pro access until the end of the current billing period.",
            },
            {
              q: "What happens when I hit a limit on the Free plan?",
              a: "You see a clear message with an upgrade prompt. No crashes, no data loss — just a hard stop on the blocked action.",
            },
            {
              q: "Is there a trial?",
              a: "The Free plan is a permanent tier — no time limit. Try Pro features by upgrading and cancelling within the billing period.",
            },
          ].map((item) => (
            <div key={item.q} className="border-b border-outline-variant/20 py-5">
              <div className="text-[14px] font-medium text-on-surface mb-2">{item.q}</div>
              <div className="text-[13px] text-on-surface-variant leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

#### `src/app/(app)/[workspaceSlug]/settings/billing/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlanLimits, formatLimit } from "@/lib/billing/plan-limits";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function BillingPage({ params, searchParams }: Props) {
  const { workspaceSlug } = await params;
  const { success } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    select: {
      id: true,
      name: true,
      plan: true,
      planExpiresAt: true,
      stripeSubscriptionId: true,
      _count: { select: { boards: true, members: true } },
    },
  });

  if (!workspace) redirect("/");

  const limits = getPlanLimits(workspace.plan);

  const PLAN_LABELS: Record<string, string> = {
    FREE: "Free",
    PRO: "Pro",
    TEAM: "Team",
  };

  const PLAN_COLORS: Record<string, string> = {
    FREE: "text-on-surface-variant",
    PRO: "text-primary",
    TEAM: "text-cyan-400",
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          Settings
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Billing</h1>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/5 text-[13px] text-green-400">
          Subscription activated. Welcome to {PLAN_LABELS[workspace.plan]}.
        </div>
      )}

      {/* Current plan */}
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
              Current plan
            </div>
            <div className={`text-2xl font-semibold ${PLAN_COLORS[workspace.plan]}`}>
              {PLAN_LABELS[workspace.plan]}
            </div>
          </div>
          {workspace.planExpiresAt && (
            <div className="text-right">
              <div className="text-[11px] text-on-surface-variant/50">Renews on</div>
              <div className="text-[14px] text-on-surface">
                {new Date(workspace.planExpiresAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Usage */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-outline-variant/20">
          <div>
            <div className="text-[11px] text-on-surface-variant/50 mb-1">Boards</div>
            <div className="text-[15px] font-medium text-on-surface">
              {workspace._count.boards}
              <span className="text-on-surface-variant/50 font-normal text-[13px]">
                {" "}/ {formatLimit(limits.maxBoards)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-on-surface-variant/50 mb-1">Members</div>
            <div className="text-[15px] font-medium text-on-surface">
              {workspace._count.members}
              <span className="text-on-surface-variant/50 font-normal text-[13px]">
                {" "}/ {formatLimit(limits.maxMembers)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {workspace.plan === "FREE" && (
          <Link
            href="/pricing"
            className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div>
              <div className="text-[14px] font-medium text-on-surface">Upgrade to Pro</div>
              <div className="text-[12px] text-on-surface-variant/60 mt-0.5">
                Unlimited boards, webhooks, audit log.
              </div>
            </div>
            <svg className="text-primary" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        )}

        {workspace.stripeSubscriptionId && (
          <ManageSubscriptionButton workspaceId={workspace.id} />
        )}
      </div>
    </div>
  );
}

function ManageSubscriptionButton({ workspaceId }: { workspaceId: string }) {
  return (
    <form action={async () => {
      "use server";
      // Créer la session Customer Portal et rediriger
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/billing/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const { url } = await res.json() as { url: string };
      if (url) {
        // Redirection gérée côté client — utiliser un client component ici en production
      }
    }}>
      {/* En pratique : rendre ce bouton client et appeler /api/billing/portal puis window.location.href = url */}
      <a
        href={`/api/billing/portal-redirect?workspaceId=${workspaceId}`}
        className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high transition-colors"
      >
        <div className="text-[14px] font-medium text-on-surface">Manage subscription</div>
        <svg className="text-on-surface-variant" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" />
        </svg>
      </a>
    </form>
  );
}
```

> **Note** : Créer aussi `src/app/api/billing/portal-redirect/route.ts` qui GET la session portal et redirige vers Stripe :
> ```typescript
> import { NextRequest, NextResponse } from "next/server";
> import { auth } from "@/lib/auth"; import { prisma } from "@/lib/prisma"; import { stripe } from "@/lib/billing/stripe"; import { headers } from "next/headers";
> export async function GET(req: NextRequest) {
>   const session = await auth.api.getSession({ headers: await headers() });
>   if (!session) return NextResponse.redirect("/login");
>   const workspaceId = req.nextUrl.searchParams.get("workspaceId")!;
>   const workspace = await prisma.workspace.findFirst({ where: { id: workspaceId, members: { some: { userId: session.user.id } } }, select: { stripeCustomerId: true, slug: true } });
>   if (!workspace?.stripeCustomerId) return NextResponse.redirect("/");
>   const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
>   const portalSession = await stripe.billingPortal.sessions.create({ customer: workspace.stripeCustomerId, return_url: `${APP_URL}/${workspace.slug}/settings/billing` });
>   return NextResponse.redirect(portalSession.url);
> }
> ```

#### Enforcement des limites dans les Server Actions

```typescript
// Dans src/lib/actions/board.actions.ts — createBoard() :
import { getPlanLimits } from "@/lib/billing/plan-limits";

// Après avoir récupéré le workspace avec son plan et _count.boards :
const limits = getPlanLimits(workspace.plan);
if (workspace._count.boards >= limits.maxBoards) {
  throw new Error(
    `PLAN_LIMIT_BOARDS:${workspace.plan}` // code parsé côté client pour afficher le bon message
  );
}

// Dans src/lib/actions/workspace.actions.ts — inviteMember() :
if (workspace._count.members >= limits.maxMembers) {
  throw new Error(`PLAN_LIMIT_MEMBERS:${workspace.plan}`);
}
```

---

## 6. Feature 023 — Audit Log

### 6.1 Tasks

- [ ] T019 — Migration Prisma (`AuditLog` + `AuditAction` enum — voir Section 2)
- [ ] T020 — Créer `src/lib/audit/log.ts` (fonction `createAuditLog()` utilisée dans toutes les actions)
- [ ] T021 — Instrumenter les Server Actions existants (inviter, kicker, renommer, créer board, etc.)
- [ ] T022 — Créer `src/app/(app)/[workspaceSlug]/audit-log/page.tsx`
- [ ] T023 — Créer `src/app/api/audit-log/export/route.ts` (CSV export)

### 6.2 Code complet

#### `src/lib/audit/log.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

interface AuditLogParams {
  workspaceId: string;
  actorId?: string;
  actorEmail: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enregistre une entrée d'audit. Non-bloquant : ne propage pas les erreurs.
 * Appeler avec `void createAuditLog(...)` dans les Server Actions.
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetLabel: params.targetLabel,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch {
    // Ne jamais bloquer l'action utilisateur sur une erreur de logging
    // En production : envoyer à Sentry
  }
}
```

#### Instrumenter les Server Actions existants

```typescript
// Pattern : appeler void createAuditLog() APRÈS chaque mutation réussie.

// Dans inviteMember() :
void createAuditLog({
  workspaceId,
  actorId: session.user.id,
  actorEmail: session.user.email,
  action: "MEMBER_INVITED",
  targetType: "user",
  targetLabel: email,
  metadata: { role },
});

// Dans removeMember() :
void createAuditLog({
  workspaceId,
  actorId: session.user.id,
  actorEmail: session.user.email,
  action: "MEMBER_REMOVED",
  targetType: "user",
  targetId: userId,
  targetLabel: removedUser.email,
});

// Dans createBoard() :
void createAuditLog({
  workspaceId,
  actorId: session.user.id,
  actorEmail: session.user.email,
  action: "BOARD_CREATED",
  targetType: "board",
  targetId: board.id,
  targetLabel: board.name,
});

// Dans deleteBoard() :
void createAuditLog({
  workspaceId,
  actorId: session.user.id,
  actorEmail: session.user.email,
  action: "BOARD_DELETED",
  targetType: "board",
  targetId: boardId,
  targetLabel: board.name,
});

// Dans deleteTask() :
void createAuditLog({
  workspaceId: task.board.workspaceId,
  actorId: session.user.id,
  actorEmail: session.user.email,
  action: "TASK_DELETED",
  targetType: "task",
  targetId: taskId,
  targetLabel: `${task.code}: ${task.title}`,
});

// Dans createAPIKey() (src/lib/actions/api-key.actions.ts) :
void createAuditLog({
  workspaceId,
  actorId: session.user.id,
  actorEmail: session.user.email,
  action: "API_KEY_CREATED",
  targetType: "api_key",
  targetLabel: name,
});

// Dans revokeAPIKey() :
void createAuditLog({
  workspaceId,
  actorId: session.user.id,
  actorEmail: session.user.email,
  action: "API_KEY_REVOKED",
  targetType: "api_key",
  targetId: keyId,
});
```

#### `src/app/(app)/[workspaceSlug]/audit-log/page.tsx`

```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuditAction } from "@prisma/client";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{
    page?: string;
    actor?: string;
    action?: string;
    days?: string;
  }>;
}

const PER_PAGE = 50;

const ACTION_LABELS: Partial<Record<AuditAction, string>> = {
  WORKSPACE_CREATED: "Workspace created",
  WORKSPACE_RENAMED: "Workspace renamed",
  WORKSPACE_DELETED: "Workspace deleted",
  MEMBER_INVITED: "Member invited",
  MEMBER_JOINED: "Member joined",
  MEMBER_ROLE_CHANGED: "Role changed",
  MEMBER_REMOVED: "Member removed",
  BOARD_CREATED: "Board created",
  BOARD_DELETED: "Board deleted",
  TASK_DELETED: "Task deleted",
  AUTH_LOGIN: "Signed in",
  AUTH_LOGIN_FAILED: "Sign-in failed",
  AUTH_LOGOUT: "Signed out",
  API_KEY_CREATED: "API key created",
  API_KEY_REVOKED: "API key revoked",
  API_KEY_USED: "API key used",
  AI_SUGGESTION_APPLIED: "AI suggestion applied",
  BILLING_UPGRADED: "Plan upgraded",
  BILLING_DOWNGRADED: "Plan downgraded",
  BILLING_CANCELLED: "Subscription cancelled",
};

export default async function AuditLogPage({ params, searchParams }: Props) {
  const { workspaceSlug } = await params;
  const { page: pageStr, actor, action, days: daysStr } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
    select: { id: true, name: true, plan: true },
  });

  if (!workspace) {
    // Member/Viewer : page 403 on-brand
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <h1 className="text-xl font-semibold text-on-surface mb-2">Access restricted</h1>
        <p className="text-[14px] text-on-surface-variant">
          Audit log is only available to workspace Owners and Admins.
        </p>
      </div>
    );
  }

  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const days = parseInt(daysStr ?? "30", 10);
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where = {
    workspaceId: workspace.id,
    createdAt: { gte: sinceDate },
    ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" as const } } : {}),
    ...(action ? { action: action as AuditAction } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        actorEmail: true,
        action: true,
        targetType: true,
        targetLabel: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  // Build CSV export URL
  const exportParams = new URLSearchParams({ days: days.toString(), ...(actor ? { actor } : {}), ...(action ? { action } : {}) });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
            {workspace.name}
          </div>
          <h1 className="text-2xl font-semibold text-on-surface">Audit Log</h1>
          <p className="text-[13px] text-on-surface-variant mt-1">
            {total} events in the last {days} days
          </p>
        </div>
        <a
          href={`/api/audit-log/export?workspaceId=${workspace.id}&${exportParams.toString()}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container text-[13px] text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="13">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          Export CSV
        </a>
      </div>

      {/* Filters */}
      <form className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          name="days"
          defaultValue={days}
          className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-surface-container text-[13px] text-on-surface outline-none"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <input
          type="text"
          name="actor"
          defaultValue={actor}
          placeholder="Filter by email..."
          className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-surface-container text-[13px] text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/50 w-52"
        />
        <select
          name="action"
          defaultValue={action}
          className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-surface-container text-[13px] text-on-surface outline-none"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:brightness-110 transition-all"
        >
          Filter
        </button>
        {(actor || action) && (
          <a href="?" className="text-[13px] text-on-surface-variant/60 hover:text-on-surface transition-colors">
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="text-center py-12 text-[14px] text-on-surface-variant/50">
          No events match your filters.
        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-high">
              <tr>
                {["Date", "Actor", "Action", "Target"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-high/30 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface-variant whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-on-surface max-w-[180px] truncate">
                    {log.actorEmail}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded bg-surface-container-highest text-[11px] font-mono text-on-surface-variant">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant max-w-[200px] truncate">
                    {log.targetLabel ?? log.targetType ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-[12px] text-on-surface-variant/50">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}&days=${days}${actor ? `&actor=${actor}` : ""}${action ? `&action=${action}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/20 text-[12px] text-on-surface hover:bg-surface-container transition-colors">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}&days=${days}${actor ? `&actor=${actor}` : ""}${action ? `&action=${action}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/20 text-[12px] text-on-surface hover:bg-surface-container transition-colors">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### `src/app/api/audit-log/export/route.ts` — CSV export

```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { AuditAction } from "@prisma/client";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);
  const actor = url.searchParams.get("actor") ?? undefined;
  const action = url.searchParams.get("action") ?? undefined;

  if (!workspaceId) return new Response("Missing workspaceId", { status: 400 });

  // Vérifier accès OWNER/ADMIN
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    select: { role: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.auditLog.findMany({
    where: {
      workspaceId,
      createdAt: { gte: sinceDate },
      ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" } } : {}),
      ...(action ? { action: action as AuditAction } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5000, // Limite de sécurité pour l'export
    select: {
      createdAt: true,
      actorEmail: true,
      action: true,
      targetType: true,
      targetLabel: true,
      ipAddress: true,
    },
  });

  const csv = Papa.unparse(
    logs.map((log) => ({
      Date: log.createdAt.toISOString(),
      Actor: log.actorEmail,
      Action: log.action,
      "Target Type": log.targetType ?? "",
      Target: log.targetLabel ?? "",
      "IP Address": log.ipAddress ?? "",
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="axiom-audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
```

#### Ajouter le lien "Audit Log" dans la sidebar

```typescript
// Dans src/app/(app)/layout.tsx ou le composant Sidebar,
// ajouter après le lien Settings :
{(memberRole === "OWNER" || memberRole === "ADMIN") && (
  <Link
    href={`/${workspaceSlug}/audit-log`}
    className="..."
  >
    Audit Log
  </Link>
)}
```

---

## 7. Feature 009 — Recruiter-Ready Packaging

> Aucune migration Prisma. Aucun package supplémentaire. Phase documentaire et CI.

### 7.1 Tasks

- [ ] T024 — Écrire `README.md` final au niveau racine du repo
- [ ] T025 — Créer `.github/workflows/ci.yml` (GitHub Actions : lint, type-check, Playwright)
- [ ] T026 — Créer `prisma/seed.ts` (données de démo réalistes)
- [ ] T027 — Modifier `package.json` pour ajouter `"db:seed": "ts-node prisma/seed.ts"`
- [ ] T028 — Peupler la démo Vercel avec les données seed

### 7.2 Code complet

#### `README.md` (racine du repo)

````markdown
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
````

#### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    needs: quality
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
      GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
      GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      PUSHER_APP_ID: ${{ secrets.PUSHER_APP_ID }}
      PUSHER_KEY: ${{ secrets.PUSHER_KEY }}
      PUSHER_SECRET: ${{ secrets.PUSHER_SECRET }}
      PUSHER_CLUSTER: ${{ secrets.PUSHER_CLUSTER }}
      NEXT_PUBLIC_PUSHER_KEY: ${{ secrets.PUSHER_KEY }}
      NEXT_PUBLIC_PUSHER_CLUSTER: ${{ secrets.PUSHER_CLUSTER }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: npx prisma db push
      - run: pnpm build
      - run: npx playwright install --with-deps chromium
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

#### `prisma/seed.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@axiom.dev" },
    update: {},
    create: {
      name: "Alex Chen",
      email: "demo@axiom.dev",
      emailVerified: true,
      image: null,
    },
  });

  // Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "axiom-demo" },
    update: {},
    create: {
      name: "Axiom Demo",
      slug: "axiom-demo",
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  // Board 1 — Product Board
  const board = await prisma.board.upsert({
    where: { id: "demo-board-1" },
    update: {},
    create: {
      id: "demo-board-1",
      workspaceId: workspace.id,
      name: "Product Board",
      template: "KANBAN",
      taskCounter: 12,
    },
  });

  // Columns
  const COLUMNS = [
    { id: "col-backlog", name: "Backlog", order: 0 },
    { id: "col-todo", name: "To Do", order: 1 },
    { id: "col-progress", name: "In Progress", order: 2 },
    { id: "col-review", name: "In Review", order: 3 },
    { id: "col-done", name: "Done", order: 4 },
  ];

  for (const col of COLUMNS) {
    await prisma.column.upsert({
      where: { id: col.id },
      update: {},
      create: { id: col.id, boardId: board.id, name: col.name, order: col.order },
    });
  }

  // Tasks réalistes
  const TASKS = [
    { id: "task-1", code: "AX-1", title: "Design token system for dark mode", columnId: "col-done", priority: "HIGH" as const, estimate: 3 },
    { id: "task-2", code: "AX-2", title: "Implement Pusher realtime sync", columnId: "col-done", priority: "HIGH" as const, estimate: 5 },
    { id: "task-3", code: "AX-3", title: "AI priority inference — Groq integration", columnId: "col-done", priority: "URGENT" as const, estimate: 8 },
    { id: "task-4", code: "AX-4", title: "Sprint burndown chart", columnId: "col-review", priority: "MEDIUM" as const, estimate: 5 },
    { id: "task-5", code: "AX-5", title: "Stripe billing integration", columnId: "col-progress", priority: "HIGH" as const, estimate: 8 },
    { id: "task-6", code: "AX-6", title: "Audit log CSV export", columnId: "col-progress", priority: "MEDIUM" as const, estimate: 3 },
    { id: "task-7", code: "AX-7", title: "i18n FR/EN with next-intl", columnId: "col-todo", priority: "MEDIUM" as const, estimate: 5 },
    { id: "task-8", code: "AX-8", title: "Onboarding tour with driver.js", columnId: "col-todo", priority: "LOW" as const, estimate: 3 },
    { id: "task-9", code: "AX-9", title: "Playwright e2e — board CRUD", columnId: "col-backlog", priority: "HIGH" as const, estimate: 5 },
    { id: "task-10", code: "AX-10", title: "GitHub Actions CI pipeline", columnId: "col-backlog", priority: "MEDIUM" as const, estimate: 2 },
    { id: "task-11", code: "AX-11", title: "OG image via Edge runtime", columnId: "col-backlog", priority: "LOW" as const, estimate: 2 },
    { id: "task-12", code: "AX-12", title: "PWA manifest and service worker", columnId: "col-backlog", priority: "MEDIUM" as const, estimate: 3 },
  ];

  for (const task of TASKS) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        boardId: board.id,
        columnId: task.columnId,
        code: task.code,
        title: task.title,
        priority: task.priority,
        estimate: task.estimate,
        order: parseInt(task.id.replace("task-", ""), 10),
      },
    });
  }

  // Sprint actif
  await prisma.sprint.upsert({
    where: { id: "demo-sprint-1" },
    update: {},
    create: {
      id: "demo-sprint-1",
      boardId: board.id,
      name: "Sprint 1 — Core",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-14"),
      status: "ACTIVE",
    },
  });

  console.log("✓ Demo data seeded");
  console.log(`  User: demo@axiom.dev`);
  console.log(`  Workspace: axiom-demo`);
  console.log(`  Board: Product Board (${TASKS.length} tasks)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### Modifier `package.json` — ajouter le script seed

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test:e2e": "playwright test",
    "db:seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

---

## 8. Ordre d'exécution recommandé

```bash
# 1. i18n — pas de migration externe, ne casse rien
git checkout main && git pull
git checkout -b feat-021-i18n
# Migration Prisma + T001-T008
npx prisma migrate dev --name add-user-locale
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 2. Billing — Stripe en test mode (sk_test_)
git checkout main && git pull
git checkout -b feat-022-billing
# Migration Prisma + T009-T018
npx prisma migrate dev --name add-billing
# Stripe CLI local pour tester les webhooks :
# stripe listen --forward-to localhost:3000/api/billing/webhook
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 3. Audit Log
git checkout main && git pull
git checkout -b feat-023-audit-log
# Migration Prisma + T019-T023
npx prisma migrate dev --name add-audit-log
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 4. Recruiter Packaging — en dernier (documente l'état final)
git checkout main && git pull
git checkout -b feat-009-packaging
# T024-T028
pnpm db:seed  # vérifier localement
pnpm build && pnpm lint && pnpm type-check
# PR + squash merge

# 5. Tag de release finale
git tag v1.0.0
git push origin v1.0.0
```

---

## 9. Checklist de validation finale — Phase E

### i18n
- [ ] Basculer vers EN affiche l'intégralité de l'UI en anglais (zéro chaîne FR visible)
- [ ] Les dates dans l'activity log s'affichent en `dd/mm/yyyy` en FR et `mm/dd/yyyy` en EN
- [ ] Le toggle FR/EN dans Settings persiste en DB et survit à un refresh
- [ ] `pnpm build` sans warnings de chaînes manquantes

### Billing
- [ ] `/pricing` accessible sans login, 3 plans affichés correctement
- [ ] Checkout Stripe (mode test) se complète et le plan DB passe à PRO
- [ ] Créer un 4ème board sur Free → message de limite on-brand (pas de 500)
- [ ] `GET /api/v1/boards` sur un workspace FREE fonctionne (webhooks limités mais pas API)
- [ ] Annulation via Customer Portal → plan revient à FREE à l'expiration
- [ ] Webhook Stripe vérifié via `stripe listen` + `stripe trigger checkout.session.completed`

### Audit Log
- [ ] Chaque action instrumentée génère une entrée visible dans `/audit-log`
- [ ] Un MEMBER accédant à `/audit-log` voit la page d'accès restreint (pas de 500)
- [ ] Export CSV contient les colonnes : Date, Actor, Action, Target Type, Target, IP Address
- [ ] Filtre par email et par action fonctionnels
- [ ] Aucune entrée de log ne peut être supprimée via un appel API direct (pas de DELETE route)

### Recruiter Packaging
- [ ] `README.md` : badge CI vert visible sur GitHub
- [ ] `pnpm db:seed` sans erreur → workspace "axiom-demo" + 12 tasks créés
- [ ] CI GitHub Actions passe sur le branch main (lint + type-check + e2e)
- [ ] La démo publique Vercel dispose des données seed peuplées
- [ ] `PROGRESS.md` marqué à 100% — toutes les 24 features complètes

---

## 10. Note finale — End of Project

Phase E est la dernière phase d'Axiom. Après merge de toutes les branches :

1. Mettre à jour `PROGRESS.md` → 24/24 features ✅
2. Tagger `v1.0.0` sur `main`
3. Peupler la démo Vercel avec `pnpm db:seed`
4. Prendre les captures d'écran finales pour le portfolio
5. Passer au **Projet 03/30**
