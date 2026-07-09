# 011 — Vercel Analytics

> Doc d'entrée pour `specify.specify`. Feature bonus — usage analytics production.

## Contexte / Objectif

Intégrer Vercel Analytics pour mesurer le trafic réel et les Core Web Vitals en production, démontrant une approche data-driven sur le produit — signal fort pour un profil Product Tech Manager.

## User Stories

- En tant que owner produit, je consulte les pages vues, visiteurs uniques et sources de trafic depuis le dashboard Vercel.
- En tant que développeur, je monitore les Core Web Vitals (LCP, CLS, FID) en conditions réelles de production.
- En tant que owner produit, je vois quelles features/pages sont les plus utilisées en démo publique.

## Exigences fonctionnelles

- **FR-1101** — Installer `@vercel/analytics` et `@vercel/speed-insights` dans le projet.
- **FR-1102** — Intégrer le composant `<Analytics />` dans le layout racine Next.js.
- **FR-1103** — Intégrer le composant `<SpeedInsights />` pour la collecte des Core Web Vitals en production réelle.
- **FR-1104** — Afficher le score Lighthouse / Core Web Vitals (capture du dashboard Vercel) dans le README comme preuve de performance (cf. Phase 10 — Recruiter Packaging).

## Critères d'acceptation

- Les page views apparaissent dans le dashboard Vercel Analytics après une visite sur la démo publique.
- Les Core Web Vitals sont visibles dans l'onglet Speed Insights du projet Vercel.
- LCP < 2.5s et CLS < 0.1 confirmés en conditions réelles (pas seulement en lab).

## Dépendances techniques

`@vercel/analytics`, `@vercel/speed-insights`, Next.js App Router layout, déploiement Vercel actif (Phase 2).

## Hors-périmètre

- Analytics custom events (tracking de clics spécifiques) — Vercel Analytics de base suffit pour un portfolio.
- A/B testing — hors scope.
