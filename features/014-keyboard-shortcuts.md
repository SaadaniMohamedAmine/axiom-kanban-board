# 014 — Keyboard Shortcuts Reference Card

> Doc d'entrée pour `specify.specify`. Feature bonus — power user & premium UX signal.

## Contexte / Objectif

Documenter et exposer les raccourcis clavier du produit via une référence in-app accessible (⌘/), signal de maturité UX rare dans un portfolio — les outils premium (Linear, Notion, Figma) ont tous une reference card.

## User Stories

- En tant qu'utilisateur power user, j'utilise des raccourcis clavier pour naviguer et agir sans la souris.
- En tant que nouvel utilisateur, j'ouvre la reference card pour découvrir les raccourcis disponibles.

## Exigences fonctionnelles

- **FR-1401** — Raccourcis globaux implémentés et fonctionnels : `⌘K` (command palette), `N` (nouvelle tâche), `E` (éditer tâche focalisée), `D` (supprimer tâche), `Esc` (fermer modal/panel), `?` ou `⌘/` (ouvrir reference card).
- **FR-1402** — Raccourcis de navigation : `G B` (go to board), `G S` (go to settings), `G A` (go to analytics).
- **FR-1403** — Panel "Keyboard Shortcuts" ouvert via `⌘/` ou `?` : liste organisée par catégorie (Navigation, Tâches, IA, Général).
- **FR-1404** — Le panel shortcuts est stylé on-brand (dark, Geist, JetBrains Mono pour les touches).
- **FR-1405** — Les raccourcis sont désactivés quand le focus est dans un champ de saisie (input, textarea) pour éviter les conflits.
- **FR-1406** — Mention des raccourcis principaux dans le README et la démo.

## Critères d'acceptation

- `⌘K` ouvre la command palette depuis n'importe quel écran authentifié.
- `⌘/` ou `?` ouvre le panel de référence depuis n'importe quel écran authentifié.
- Les raccourcis ne se déclenchent pas quand l'utilisateur tape dans un champ texte.
- Le panel shortcuts liste au minimum 10 raccourcis organisés par catégorie.

## Dépendances techniques

`useHotkeys` (librairie react-hotkeys-hook ou équivalent), Next.js, design system Axiom (JetBrains Mono pour les touches). Dépend de la Phase 3 (Core Kanban) et Phase 8 (command palette).

## Hors-périmètre

- Raccourcis personnalisables par l'utilisateur.
- Support des raccourcis Windows (Ctrl) adapté automatiquement — Mac (⌘) en priorité pour le portfolio.
