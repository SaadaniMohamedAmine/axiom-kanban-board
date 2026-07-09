# 015 — Public Roadmap

> Doc d'entrée pour `specify.specify`. Feature bonus — product management thinking signal.

## Contexte / Objectif

Créer une page de roadmap publique (Now/Next/Later) qui démontre la pensée produit long terme et la transparence — pratique standard des SaaS premium, rare dans un portfolio.

## User Stories

- En tant que visiteur/recruteur, je consulte la roadmap publique d'Axiom pour comprendre la vision produit.
- En tant que owner produit, je mets à jour la roadmap en éditant un fichier de configuration simple.

## Exigences fonctionnelles

- **FR-1501** — Page `/roadmap` publique, accessible sans authentification.
- **FR-1502** — Structure Now / Next / Later avec les features organisées par colonne/section.
- **FR-1503** — Chaque item de roadmap contient : titre, description courte, statut (Shipped / In Progress / Planned / Considering).
- **FR-1504** — Contenu géré via un fichier de config statique (`/content/roadmap.ts` ou `roadmap.json`) — pas de DB.
- **FR-1505** — Design on-brand Axiom (dark, glassmorphism, même palette et typographie).
- **FR-1506** — Lien vers la roadmap depuis la landing page (footer ou navigation publique).
- **FR-1507** — Les features déjà livrées (Phases 2-10) apparaissent en statut "Shipped" avec leur date approximative.

## Critères d'acceptation

- La page `/roadmap` se charge sans authentification.
- Les trois colonnes Now/Next/Later sont affichées avec au minimum 3 items chacune.
- Un item en statut "Shipped" est visuellement distinct des items "Planned" ou "In Progress".
- Le design est cohérent avec le reste du produit.

## Dépendances techniques

Next.js (page statique/SSG), design system Axiom. Aucune dépendance DB — contenu 100% statique.

## Hors-périmètre

- Votes utilisateurs sur les items de roadmap.
- Synchronisation avec un outil de gestion de projet externe (Linear, Jira).
