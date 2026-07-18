# Axiom — Plan Limits & Upgrade Flow Delegation
> Enforcement des limites Free + UX d'upgrade premium

---

## 0. Contexte

**Ce qui existe déjà :**
- `plan-limits.ts` — constantes de plans (valeurs à corriger)
- `board.actions.ts` → `createBoard` — déjà check le plan, lève `PLAN_LIMIT_BOARDS:FREE`
- `workspace.actions.ts` → `createWorkspace` — **aucun check de limite workspace**
- `workspace-rate-limit.ts` — utilise `AI_DAILY_LIMIT` env var au lieu du plan
- `workspace-form.tsx` — affiche l'erreur en string brut
- `board-create-modal.tsx` — catch générique, pas d'upgrade modal

**Ce qu'on ajoute :**
1. Corriger les limites FREE (1 workspace / 2 boards / 10 AI)
2. Ajouter le check workspace dans `createWorkspace`
3. Brancher la limite AI sur le plan Prisma
4. `<UpgradeModal>` — modal réutilisable pour tous les gates
5. `<PlanCard>` — sidebar card avec indicateurs d'usage live
6. Wiring dans `workspace-form.tsx` et `board-create-modal.tsx`

---

## 1. Limites cibles

| Ressource | FREE | PRO | TEAM |
|---|---|---|---|
| Workspaces | **1** | ∞ | ∞ |
| Boards / workspace | **2** | ∞ | ∞ |
| AI requests / jour | **10** | 200 | 500 |
| Membres | 10 | 50 | ∞ |

---

## 2. Modification 1 — `src/lib/billing/plan-limits.ts`

**Remplacer le contenu complet :**

```typescript
import { WorkspacePlan } from "@prisma/client";

export interface PlanLimits {
  maxWorkspaces: number;   // ← NOUVEAU
  maxBoards: number;
  maxMembers: number;
  maxAIRequestsPerDay: number;
  hasWebhooks: boolean;
  hasAuditLog: boolean;
  auditLogRetentionDays: number;
}

export const PLAN_LIMITS: Record<WorkspacePlan, PlanLimits> = {
  FREE: {
    maxWorkspaces: 1,          // ← 1 seul workspace
    maxBoards: 2,              // ← 2 boards max
    maxMembers: 10,
    maxAIRequestsPerDay: 10,   // ← 10 requêtes AI/jour
    hasWebhooks: false,
    hasAuditLog: false,
    auditLogRetentionDays: 0,
  },
  PRO: {
    maxWorkspaces: Infinity,
    maxBoards: Infinity,
    maxMembers: 50,
    maxAIRequestsPerDay: 200,
    hasWebhooks: true,
    hasAuditLog: true,
    auditLogRetentionDays: 90,
  },
  TEAM: {
    maxWorkspaces: Infinity,
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

export const PLAN_PRICES: Record<WorkspacePlan, number> = {
  FREE: 0,
  PRO: 12,
  TEAM: 29,
};

type UpgradablePlan = Exclude<WorkspacePlan, "FREE">;
const PLAN_ORDER: WorkspacePlan[] = ["FREE", "PRO", "TEAM"];

export function getNextPlan(plan: WorkspacePlan): UpgradablePlan | null {
  const index = PLAN_ORDER.indexOf(plan);
  return index >= 0 && index < PLAN_ORDER.length - 1
    ? (PLAN_ORDER[index + 1] as UpgradablePlan)
    : null;
}

export function formatLimit(value: number): string {
  return value === Infinity ? "Unlimited" : value.toString();
}
```

---

## 3. Modification 2 — `src/lib/actions/workspace.actions.ts`

**Ajouter le check workspace AVANT la création du workspace** (après la vérification du slug, avant `prisma.workspace.create`).

Insérer ce bloc entre la vérification `existingWorkspace` et `prisma.workspace.create` :

```typescript
// ── Plan limit : workspace count ────────────────────────────────────────
const ownedWorkspaces = await prisma.workspace.count({
  where: {
    ownerId: session.user.id,
    deletedAt: null,
    archivedAt: null,
  },
});

// On récupère le plan du premier workspace de l'user pour déterminer ses droits
// (le plan est attaché au workspace, pas à l'user — on prend le plus élevé)
const userPlan = await prisma.workspace.findFirst({
  where: { ownerId: session.user.id, deletedAt: null },
  orderBy: { createdAt: "asc" },
  select: { plan: true },
});

const effectivePlan = userPlan?.plan ?? "FREE";
const { getPlanLimits } = await import("../billing/plan-limits");
const limits = getPlanLimits(effectivePlan);

if (ownedWorkspaces >= limits.maxWorkspaces) {
  throw new Error(`PLAN_LIMIT_WORKSPACES:${effectivePlan}`);
}
// ────────────────────────────────────────────────────────────────────────
```

> **Note architecture** : la limite workspace est calculée sur `ownerId` car un user FREE ne peut posséder qu'1 workspace. Il peut être membre de workspaces d'autres users sans limite.

---

## 4. Modification 3 — `src/lib/ai/workspace-rate-limit.ts`

**Remplacer le fichier complet** pour brancher la limite sur le plan Prisma :

```typescript
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/billing/plan-limits";

export interface WorkspaceQuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  plan: string;
}

export async function checkWorkspaceQuota(
  workspaceId: string
): Promise<WorkspaceQuotaResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { aiRequestsToday: true, aiRequestsResetAt: true, plan: true },
  });

  if (!workspace) throw new Error("Workspace not found");

  // Limite basée sur le plan Prisma (plus d'env var)
  const limits = getPlanLimits(workspace.plan);
  const dailyLimit = limits.maxAIRequestsPerDay;

  const now = new Date();
  const shouldReset =
    !workspace.aiRequestsResetAt || now >= workspace.aiRequestsResetAt;

  if (shouldReset) {
    const resetAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { aiRequestsToday: 0, aiRequestsResetAt: resetAt },
    });
    return {
      allowed: true,
      used: 0,
      limit: dailyLimit,
      remaining: dailyLimit,
      resetAt,
      plan: workspace.plan,
    };
  }

  const used = workspace.aiRequestsToday;
  const resetAt =
    workspace.aiRequestsResetAt ??
    new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );

  return {
    allowed: used < dailyLimit,
    used,
    limit: dailyLimit,
    remaining: Math.max(0, dailyLimit - used),
    resetAt,
    plan: workspace.plan,
  };
}

export async function incrementWorkspaceQuota(workspaceId: string): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { aiRequestsToday: { increment: 1 } },
  });
}
```

---

## 5. Création — `src/components/ui/upgrade-modal.tsx`

**Créer ce fichier (nouveau composant) :**

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MOTION } from "@/lib/motion";

export type LimitType = "workspaces" | "boards" | "ai" | "members";

interface UpgradeModalProps {
  open: boolean;
  limitType: LimitType;
  currentPlan?: string;
  workspaceSlug?: string;
  onClose: () => void;
}

const LIMIT_COPY: Record<
  LimitType,
  { icon: string; title: string; description: string; highlight: string }
> = {
  workspaces: {
    icon: "🏗️",
    title: "Limite workspace atteinte",
    description:
      "Le plan Free inclut 1 workspace. Passez en Pro pour créer des workspaces illimités.",
    highlight: "Workspaces illimités",
  },
  boards: {
    icon: "📋",
    title: "Limite de boards atteinte",
    description:
      "Le plan Free inclut 2 boards par workspace. Passez en Pro pour des boards illimités.",
    highlight: "Boards illimités",
  },
  ai: {
    icon: "✦",
    title: "Quota Axiom Intelligence épuisé",
    description:
      "Vous avez utilisé vos 10 requêtes AI gratuites aujourd'hui. Le quota se réinitialise à minuit UTC.",
    highlight: "200 requêtes AI / jour",
  },
  members: {
    icon: "👥",
    title: "Limite de membres atteinte",
    description:
      "Le plan Free inclut 10 membres. Passez en Pro pour inviter jusqu'à 50 membres.",
    highlight: "50 membres",
  },
};

const PRO_FEATURES = [
  "Workspaces illimités",
  "Boards illimités",
  "200 requêtes AI / jour",
  "Webhooks & Public API",
  "Audit log (90 jours)",
  "50 membres par workspace",
];

export function UpgradeModal({
  open,
  limitType,
  workspaceSlug,
  onClose,
}: UpgradeModalProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const copy = LIMIT_COPY[limitType];

  function handleUpgrade() {
    setIsRedirecting(true);
    const target = workspaceSlug
      ? `/${workspaceSlug}/settings/billing`
      : "/pricing";
    router.push(target);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-surface-container-lowest/85 backdrop-blur-sm"
            variants={MOTION.variants.modalOverlay}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
            }}
          />

          {/* Card */}
          <motion.div
            className="onboarding-glass-card relative w-full max-w-md rounded-2xl p-8 shadow-2xl z-10"
            variants={MOTION.variants.modalContent}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>

            {/* Icon + title */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {copy.icon}
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-on-surface leading-tight">
                  {copy.title}
                </h2>
                <p className="text-[13px] text-on-surface-variant mt-1">
                  {copy.description}
                </p>
              </div>
            </div>

            {/* Pro features */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-3">
                Axiom Pro — $12 / mois
              </p>
              <ul className="space-y-2">
                {PRO_FEATURES.map((f) => (
                  <li
                    key={f}
                    className={`flex items-center gap-2 text-[13px] ${
                      f === copy.highlight
                        ? "text-primary font-semibold"
                        : "text-on-surface-variant"
                    }`}
                  >
                    <svg
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="14"
                      className={
                        f === copy.highlight
                          ? "text-primary"
                          : "text-on-surface-variant/40"
                      }
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface-variant text-[13px] font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Plus tard
              </button>
              <button
                onClick={handleUpgrade}
                disabled={isRedirecting}
                className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary text-[13px] font-semibold hover:brightness-110 disabled:opacity-70 transition-all cursor-pointer"
              >
                {isRedirecting ? "Redirection…" : "Passer en Pro →"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

---

## 6. Modification 4 — `src/components/workspace/workspace-form.tsx`

**Remplacer le `handleSubmit` uniquement :**

Ajouter l'import en haut du fichier :
```typescript
import { UpgradeModal } from "@/components/ui/upgrade-modal";
```

Ajouter le state en haut du composant :
```typescript
const [showUpgrade, setShowUpgrade] = useState(false);
```

Remplacer `handleSubmit` :
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!name.trim()) return;

  setIsSubmitting(true);
  setError(null);
  try {
    await createWorkspace({ name: name.trim() });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    const message = err instanceof Error ? err.message : "";
    if (message.startsWith("PLAN_LIMIT_WORKSPACES")) {
      setShowUpgrade(true);
    } else {
      setError(message || t("createFailed"));
    }
    setIsSubmitting(false);
  }
}
```

Ajouter avant le `return` final :
```tsx
if (showUpgrade) {
  return (
    <UpgradeModal
      open={true}
      limitType="workspaces"
      onClose={() => setShowUpgrade(false)}
    />
  );
}
```

---

## 7. Modification 5 — `src/components/board-admin/board-create-modal.tsx`

**Même pattern.** Ajouter import + state, modifier `handleSubmit` :

```typescript
import { UpgradeModal } from "@/components/ui/upgrade-modal";

// Dans le composant :
const [showUpgrade, setShowUpgrade] = useState(false);
```

Remplacer le catch dans `handleSubmit` :
```typescript
} catch (err) {
  const message = err instanceof Error ? err.message : "";
  if (message.startsWith("PLAN_LIMIT_BOARDS")) {
    onClose(); // ferme le board modal
    setShowUpgrade(true);
  } else {
    setError(t("createBoardModal.failed"));
  }
}
```

Ajouter juste avant le `return` du composant (après le modal existant) :
```tsx
{showUpgrade && (
  <UpgradeModal
    open={true}
    limitType="boards"
    workspaceSlug={/* passer workspaceSlug en prop ou via useParams */}
    onClose={() => setShowUpgrade(false)}
  />
)}
```

> **Note** : ajouter `workspaceSlug?: string` dans `BoardCreateModalProps` et le passer depuis `workspace-boards-with-modal.tsx`.

---

## 8. Création — `src/components/layout/plan-card.tsx`

**Nouveau composant pour la sidebar (remplace le plan badge existant) :**

```typescript
"use client";

import Link from "next/link";

interface PlanCardProps {
  plan: "FREE" | "PRO" | "TEAM";
  workspaceSlug: string;
  usage: {
    boards: number;
    maxBoards: number;
    members: number;
    maxMembers: number;
    aiToday: number;
    maxAI: number;
  };
}

export function PlanCard({ plan, workspaceSlug, usage }: PlanCardProps) {
  const isFree = plan === "FREE";

  return (
    <div className="mx-3 mb-3 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low space-y-3">
      {/* Plan label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
          Current Plan
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            plan === "FREE"
              ? "bg-outline-variant/20 text-on-surface-variant"
              : plan === "PRO"
              ? "bg-primary/15 text-primary"
              : "bg-tertiary/15 text-tertiary"
          }`}
        >
          {plan}
        </span>
      </div>

      {/* Usage bars — uniquement sur FREE */}
      {isFree && (
        <div className="space-y-2">
          <UsageBar
            label="Boards"
            used={usage.boards}
            max={usage.maxBoards}
          />
          <UsageBar
            label="AI today"
            used={usage.aiToday}
            max={usage.maxAI}
          />
        </div>
      )}

      {/* CTA */}
      {isFree && (
        <Link
          href={`/${workspaceSlug}/settings/billing`}
          className="block w-full text-center py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold hover:brightness-110 transition-all"
        >
          Upgrade to Pro
        </Link>
      )}

      {!isFree && (
        <Link
          href={`/${workspaceSlug}/settings/billing`}
          className="block w-full text-center py-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant text-[11px] font-medium hover:bg-surface-container-high transition-colors"
        >
          Manage billing
        </Link>
      )}
    </div>
  );
}

// ─── Usage bar ──────────────────────────────────────────────────────────────

function UsageBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((used / max) * 100));
  const isWarning = pct >= 80;
  const isDanger = pct >= 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-on-surface-variant/70">{label}</span>
        <span
          className={`text-[10px] font-medium ${
            isDanger
              ? "text-error"
              : isWarning
              ? "text-warning"
              : "text-on-surface-variant/60"
          }`}
        >
          {used}/{max}
        </span>
      </div>
      <div className="h-1 rounded-full bg-outline-variant/20 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger
              ? "bg-error"
              : isWarning
              ? "bg-warning"
              : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

---

## 9. Modification 6 — `src/app/(app)/layout.tsx`

**Passer les données d'usage au `CollapsibleSidebar` / `WorkspaceSidebarNav`.**

Ajouter cette query dans le layout (server component), après la récupération des memberships existants :

```typescript
// Usage data pour le plan card
const currentWorkspace = memberships.find(
  (m) => m.workspace.slug === workspaceSlug
)?.workspace;

const workspaceUsage = currentWorkspace
  ? await prisma.workspace.findUnique({
      where: { id: currentWorkspace.id },
      select: {
        plan: true,
        aiRequestsToday: true,
        _count: {
          select: {
            boards: true,
            members: true,
          },
        },
      },
    })
  : null;
```

Passer ces props au `CollapsibleSidebar` (ou directement à `PlanCard` si le sidebar est refactorisé) :

```tsx
<CollapsibleSidebar
  planCardProps={
    workspaceUsage && currentWorkspace
      ? {
          plan: workspaceUsage.plan,
          workspaceSlug: currentWorkspace.slug,
          usage: {
            boards: workspaceUsage._count.boards,
            maxBoards: getPlanLimits(workspaceUsage.plan).maxBoards,
            members: workspaceUsage._count.members,
            maxMembers: getPlanLimits(workspaceUsage.plan).maxMembers,
            aiToday: workspaceUsage.aiRequestsToday,
            maxAI: getPlanLimits(workspaceUsage.plan).maxAIRequestsPerDay,
          },
        }
      : undefined
  }
>
```

Remplacer le `<PlanCard memberships={memberships} />` existant dans la sidebar par `<PlanCard {...planCardProps} />` (si props disponibles) ou garder le composant existant et le remplacer par le nouveau.

---

## 10. Gate AI — vérifier où appeler l'UpgradeModal

L'erreur AI se lève côté serveur avec `PLAN_LIMIT_AI` (à ajouter dans l'API route qui appelle `checkWorkspaceQuota`).

**Dans l'API route AI** (ex: `src/app/api/ai/suggest/route.ts` ou équivalent), modifier la réponse quand le quota est dépassé :

```typescript
const quota = await checkWorkspaceQuota(workspaceId);
if (!quota.allowed) {
  return NextResponse.json(
    { error: "PLAN_LIMIT_AI", plan: quota.plan, resetAt: quota.resetAt },
    { status: 429 }
  );
}
```

**Dans le composant client qui appelle l'AI** (là où fetch est fait), intercepter le 429 :

```typescript
if (res.status === 429) {
  const data = await res.json();
  if (data.error === "PLAN_LIMIT_AI") {
    setShowUpgradeModal({ open: true, limitType: "ai" });
    return;
  }
}
```

> Trouver le composant client qui trigger l'AI (probablement dans `src/components/ai/` ou `src/app/(app)/[workspaceSlug]/boards/[boardId]/`) et y ajouter le state + `<UpgradeModal limitType="ai" />`.

---

## 11. Checklist de validation

- [ ] `plan-limits.ts` : FREE = `maxWorkspaces:1, maxBoards:2, maxAIRequestsPerDay:10`
- [ ] Créer un 2ème workspace en Free → `UpgradeModal` (limitType="workspaces") s'ouvre
- [ ] Créer un 3ème board en Free → `UpgradeModal` (limitType="boards") s'ouvre
- [ ] 11ème requête AI en Free → `UpgradeModal` (limitType="ai") s'ouvre
- [ ] `PlanCard` dans sidebar affiche : boards X/2, AI X/10 avec barre de progression
- [ ] Barre orange à ≥ 80%, rouge à 100%
- [ ] Clic "Upgrade to Pro" → `/[slug]/settings/billing`
- [ ] Après upgrade Stripe → `workspace.plan = PRO` → PlanCard passe en "PRO", barres disparaissent
- [ ] `pnpm type-check` sans erreur
- [ ] `pnpm build` sans erreur
