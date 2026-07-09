# 022 — Billing / Pricing

> Doc d'entrée pour `specify.specify`. Scope "Later" — business model & monetization signal.

## Contexte / Objectif

Implémenter une page de pricing publique et un système de plans d'abonnement (Free / Pro / Team) avec gestion des limites par plan, démontrant la pensée monétisation et business model — signal fort pour un profil Product Tech Manager face à un recruteur ou CTO.

## User Stories

- En tant que visiteur, je consulte la page de pricing et compare les plans disponibles avant de m'inscrire.
- En tant qu'utilisateur Free, je vois clairement les limites de mon plan et ce que le passage au plan Pro débloque.
- En tant qu'utilisateur, je souscris au plan Pro via un paiement sécurisé et mon workspace est mis à niveau immédiatement.
- En tant qu'utilisateur Pro, je gère mon abonnement (annulation, changement de plan) depuis les Settings.
- En tant que owner produit, je vois les revenus et abonnements actifs dans un dashboard admin minimal.

## Exigences fonctionnelles

- **FR-2201** — Page `/pricing` publique, accessible sans authentification, présentant 3 plans : Free, Pro, Team.
- **FR-2202** — Définir les limites par plan :
  - **Free** : 1 workspace, 3 boards, 10 membres, 20 requêtes IA/jour
  - **Pro** : workspaces illimités, boards illimités, 50 membres, 200 requêtes IA/jour
  - **Team** : tout Pro + audit log, webhooks avancés, support prioritaire
- **FR-2203** — Intégrer **Stripe** comme provider de paiement (Checkout Sessions + Customer Portal).
- **FR-2204** — Webhook Stripe pour synchroniser les événements d'abonnement (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) avec la DB.
- **FR-2205** — Champ `plan` (`FREE` | `PRO` | `TEAM`) et `stripeCustomerId` sur le modèle Workspace dans Prisma.
- **FR-2206** — Enforcement des limites par plan côté serveur sur chaque action de mutation (création de board, invitation de membre, requête IA) — jamais uniquement côté UI.
- **FR-2207** — Message on-brand quand une limite est atteinte : "You've reached the Free plan limit. Upgrade to Pro to continue." avec CTA vers `/pricing`.
- **FR-2208** — Page Settings > Billing : plan actuel, date de renouvellement, lien vers le Customer Portal Stripe pour gérer/annuler.
- **FR-2209** — Design de la page pricing on-brand Axiom : dark, glassmorphism, cards de plans avec highlighting du plan recommandé (Pro).

## Critères d'acceptation

- Un utilisateur Free qui tente de créer un 4ème board voit le message de limite avec CTA upgrade — sans erreur 500.
- Le flux Stripe Checkout se complète et le plan Workspace est mis à jour en DB en moins de 10 secondes via webhook.
- L'annulation via le Customer Portal Stripe dégrade le plan à Free à la fin de la période en cours.
- Les limites sont enforced côté serveur — un appel API direct d'un Free user pour créer un 4ème board retourne 403.
- La page `/pricing` est visuellement cohérente avec le design system Axiom.

## Dépendances techniques

Stripe SDK (`stripe`, `@stripe/stripe-js`), Prisma 7 (champs `plan`, `stripeCustomerId`, `stripeSubscriptionId` sur Workspace), Next.js Route Handlers (webhook Stripe), variables d'environnement (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). Dépend des Phases 2-3 pour les entités Workspace existantes.

**Contrainte d'implémentation UI :** la page `/pricing` et la section Settings > Billing doivent être designées on-brand depuis zéro (pas d'écran Stitch existant pour cette section) en respectant strictement les tokens de `axiom-design/axiom/DESIGN.md`.

## Hors-périmètre

- Facturation à l'usage (pay-per-AI-request) — plans fixes uniquement.
- Gestion multi-devises — USD uniquement pour ce scope portfolio.
- Dashboard admin de revenus avancé (MRR, churn, LTV) — non implémenté à ce stade.
