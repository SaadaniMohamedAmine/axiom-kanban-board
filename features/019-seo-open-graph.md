# 019 — SEO + Open Graph

> Doc d'entrée pour `specify.specify`. Feature bonus — shareability & discoverability signal.

## Contexte / Objectif

Optimiser la landing page et les pages publiques d'Axiom pour le SEO et les réseaux sociaux (Open Graph / Twitter Card), pour que le projet soit impeccable quand un recruteur partage le lien ou le cherche en ligne.

## User Stories

- En tant que recruteur, je partage le lien d'Axiom sur LinkedIn et vois une preview riche (image, titre, description) plutôt qu'un lien brut.
- En tant que visiteur, la landing page est correctement indexable par les moteurs de recherche.

## Exigences fonctionnelles

- **FR-1901** — Configurer les métadonnées SEO globales via Next.js Metadata API (`layout.tsx`) : title, description, canonical URL.
- **FR-1902** — Générer des balises Open Graph sur la landing page : `og:title`, `og:description`, `og:image`, `og:url`, `og:type`.
- **FR-1903** — Générer des balises Twitter Card : `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- **FR-1904** — Créer une image Open Graph statique premium (`/og-image.png`, 1200x630px) aux couleurs et typographie Axiom — avec le wordmark et la baseline "The intelligence layer for elite teams."
- **FR-1905** — Métadonnées spécifiques pour la page `/changelog` et `/roadmap` (titre et description distinctifs).
- **FR-1906** — `robots.txt` et `sitemap.xml` générés automatiquement via Next.js (`app/robots.ts`, `app/sitemap.ts`).
- **FR-1907** — Vérifier la preview OG via un outil (ex. opengraph.xyz) avant validation.

## Critères d'acceptation

- Le lien Axiom partagé sur LinkedIn/Twitter affiche la preview OG avec image, titre et description corrects.
- La balise `<title>` de la landing page est différente de celle des pages internes de l'app (pas de titre générique "Axiom" partout).
- `sitemap.xml` liste les pages publiques (landing, changelog, roadmap, pricing si applicable).
- `robots.txt` interdit l'indexation des pages authentifiées (`/app/*`, `/api/*`).

## Dépendances techniques

Next.js Metadata API (`generateMetadata`), image OG statique ou générée via `@vercel/og`. Dépend de la landing page existante (Phase 4 / Onboarding).

## Hors-périmètre

- SEO sur les pages internes de l'app (board, tâches) — les pages authentifiées ne doivent pas être indexées.
- Schema.org / rich snippets avancés.
