# 006 — Responsive Mobile Design

> Doc d'entrée pour `specify.specify`. Correspond à Phase 7 du PROGRESS.md.

## Contexte / Objectif

Adapter l'ensemble du produit (déjà construit en Phases 2-6) à mobile/tablette, en traitant le tactile comme un mode d'interaction de première classe, pas un fallback dégradé — cohérent avec l'ambition premium du produit.

## User Stories

- En tant qu'utilisateur mobile, je navigue dans mes workspaces/boards via un menu adapté à petit écran.
- En tant qu'utilisateur mobile, je consulte un board Kanban sans avoir à zoomer ou scroller dans tous les sens de façon inconfortable.
- En tant qu'utilisateur mobile, je déplace une tâche au doigt (touch drag & drop) ou via un menu alternatif "Move to...".
- En tant qu'utilisateur mobile, j'ouvre le détail d'une tâche en plein écran, sans modal écrasée.
- En tant qu'utilisateur mobile, j'utilise la command palette adaptée au tactile.

## Exigences fonctionnelles

- **FR-501** — Définir les breakpoints (mobile <640px, tablette 640-1024px, desktop >1024px) sur l'ensemble des composants du design system.
- **FR-502** — Navigation mobile : menu workspace/board accessible via un composant adapté (drawer ou bottom nav), pas la sidebar desktop compressée.
- **FR-503** — Board Kanban en vue mobile : colonnes en scroll horizontal avec indicateur de position, ou vue liste alternative par colonne.
- **FR-504** — Drag & drop tactile fonctionnel sur mobile (@dnd-kit supporte le touch) + menu contextuel "Move to..." comme alternative accessible.
- **FR-505** — Task detail modal s'affiche en plein écran sur mobile (pas en modal centrée réduite).
- **FR-506** — Command palette (⌘K) adaptée mobile : déclenchement via bouton dédié plutôt que raccourci clavier physique.
- **FR-507** — Auditer les Core Web Vitals (LCP, CLS) en conditions mobile/réseau lent (throttling 3G/4G simulé).

## Critères d'acceptation

- Tous les écrans principaux (board, task detail, dashboard, settings) sont utilisables sans scroll horizontal involontaire ni élément coupé sur un viewport 375px.
- Le drag & drop tactile fonctionne sur un appareil mobile réel ou simulateur, avec un retour visuel clair pendant le geste.
- Le menu "Move to..." permet de déplacer une tâche sans aucun geste de drag, pour l'accessibilité.
- LCP < 2.5s et CLS < 0.1 maintenus sur mobile avec throttling réseau simulé (cf. NFR performance).

## Dépendances techniques

Tailwind CSS (breakpoints), @dnd-kit/core (support touch), design system Axiom. Dépend des Phases 3 à 6 déjà implémentées en desktop-first.

**Contrainte d'implémentation UI :** repartir des exports `axiom-design/` en vérifiant s'il existe des variantes mobile dans les écrans Stitch exportés ; sinon adapter les composants desktop existants aux breakpoints en respectant strictement les tokens de `axiom-design/axiom/DESIGN.md` (pas de réinvention visuelle pour le mobile).

## Hors-périmètre

- Application mobile native (iOS/Android) — web responsive uniquement.
- Mode offline complet (PWA) — non prévu dans le scope Now/Next/Later.
