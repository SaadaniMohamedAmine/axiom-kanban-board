# 010 — Sentry (Error Monitoring)

> Doc d'entrée pour `specify.specify`. Feature bonus — monitoring production.

## Contexte / Objectif

Intégrer Sentry pour capturer et alerter sur les erreurs JavaScript/Next.js en production, signalant un niveau de discipline production rare dans un portfolio. Permet aussi de monitorer la santé réelle du produit pendant les démos recruteur.

## User Stories

- En tant que développeur, je reçois une alerte quand une erreur non gérée se produit en production.
- En tant que développeur, je vois le stack trace complet, le contexte utilisateur et la fréquence de chaque erreur dans le dashboard Sentry.
- En tant qu'utilisateur, je vois une page d'erreur élégante on-brand plutôt qu'un crash blanc si une erreur critique se produit.

## Exigences fonctionnelles

- **FR-1001** — Installer et configurer `@sentry/nextjs` avec le wizard Sentry (génère `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`).
- **FR-1002** — Configurer le DSN Sentry en variable d'environnement (`SENTRY_DSN`) — jamais en dur dans le code.
- **FR-1003** — Capturer automatiquement les erreurs non gérées côté client et serveur (Next.js App Router).
- **FR-1004** — Associer chaque erreur à l'utilisateur connecté (id, email) via `Sentry.setUser()` — sans données sensibles (pas de mot de passe, pas de token).
- **FR-1005** — Intégrer un `Error Boundary` React global avec fallback UI on-brand (cf. pages d'erreur Phase 8).
- **FR-1006** — Afficher le badge ou la mention "Monitored by Sentry" dans le README comme preuve de discipline production.

## Critères d'acceptation

- Une erreur JavaScript volontaire déclenchée en production apparaît dans le dashboard Sentry en moins de 30 secondes.
- L'utilisateur connecté est correctement identifié dans le rapport d'erreur Sentry.
- Aucune donnée sensible (token, mot de passe) n'apparaît dans les rapports Sentry.
- Le fallback Error Boundary affiche une UI cohérente avec le design system Axiom, pas une page blanche.

## Dépendances techniques

`@sentry/nextjs`, Next.js App Router, variables d'environnement Vercel. Dépend de la Phase 2 (Setup) et du déploiement Vercel actif.

## Hors-périmètre

- Alertes Slack/email sur les erreurs (configuration Sentry optionnelle, pas dans le scope implémentation).
- Performance monitoring Sentry (traces/profiling) — non prioritaire pour un portfolio.
