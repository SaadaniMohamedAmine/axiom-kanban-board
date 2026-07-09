# 016 — Dark / Light Mode Toggle

> Doc d'entrée pour `specify.specify`. Feature bonus — design system depth signal.

## Contexte / Objectif

Ajouter un mode clair (Light) en complément du mode sombre (Dark) par défaut d'Axiom, démontrant la profondeur et la robustesse du design system — indicateur de maturité technique pour un Senior Frontend Dev.

## User Stories

- En tant qu'utilisateur, je bascule entre mode sombre et mode clair selon ma préférence.
- En tant qu'utilisateur, ma préférence est mémorisée entre les sessions.
- En tant qu'utilisateur, le mode suit automatiquement la préférence système si je n'ai pas fait de choix explicite.

## Exigences fonctionnelles

- **FR-1601** — Implémenter un toggle Dark/Light dans les Settings et/ou la navigation principale.
- **FR-1602** — Définir les tokens de couleur Light mode dans Tailwind (`tailwind.config.ts`) en miroir des tokens Dark existants — pas de couleurs ad hoc.
- **FR-1603** — Utiliser `next-themes` pour la gestion du thème (évite le flash of unstyled content au chargement).
- **FR-1604** — Détecter la préférence système (`prefers-color-scheme`) comme valeur par défaut si aucun choix explicite.
- **FR-1605** — Persister le choix utilisateur dans `localStorage` (ou préférence en DB si connecté).
- **FR-1606** — Le mode clair doit respecter les contrastes WCAG AA (vérification sur les composants clés).
- **FR-1607** — Tous les composants existants (cards, modals, board, charts) doivent être visuellement corrects dans les deux modes.

## Critères d'acceptation

- Le toggle bascule entre Dark et Light sans flash ni rechargement de page.
- La préférence est conservée après fermeture et réouverture du navigateur.
- Aucun composant n'a de couleur "hardcodée" qui casse en mode clair.
- Le contraste WCAG AA est maintenu en mode clair sur les textes principaux.

## Dépendances techniques

`next-themes`, Tailwind CSS (CSS variables pour les tokens de couleur), design system Axiom. Dépend de l'ensemble des composants UI déjà implémentés (Phases 2-9).

## Hors-périmètre

- Thèmes de couleur personnalisés au-delà de Dark/Light (ex. thème "Midnight", "Warm").
- Thème par Workspace (tous les membres voient le même thème) — préférence individuelle uniquement.
