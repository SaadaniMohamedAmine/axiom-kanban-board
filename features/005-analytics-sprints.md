# 005 — Analytics & Sprints

> Doc d'entrée pour `specify.specify`. Correspond à Phase 6 du PROGRESS.md.

## Contexte / Objectif

Donner une vue analytique du Board/Sprint pour démontrer la maturité produit attendue d'un outil de gestion de projet sérieux — burndown, vélocité, et insights IA sur la santé du sprint.

## User Stories

- En tant qu'utilisateur, je consulte un burndown chart du sprint actif.
- En tant qu'utilisateur, je consulte la vélocité de l'équipe sur les derniers sprints.
- En tant qu'utilisateur, je vois un résumé IA de la santé du sprint en cours (risques, tâches en retard, charge déséquilibrée).
- En tant qu'utilisateur, j'accède à un dashboard analytics dédié, séparé du board lui-même.

## Exigences fonctionnelles

- **FR-401** — Calculer et afficher un burndown chart (story points restants vs. temps) pour le sprint ACTIVE du board.
- **FR-402** — Calculer et afficher un graphique de vélocité (story points complétés par sprint, sur les N derniers sprints COMPLETED).
- **FR-403** — Implémenter les graphiques avec Recharts, stylés selon le design system Axiom (palette, dark mode).
- **FR-404** — Générer un résumé "santé du sprint" via Axiom Intelligence (Groq/Gemini) : tâches en retard, charge déséquilibrée entre membres, blockers actifs.
- **FR-405** — Page dashboard analytics accessible depuis la navigation du Workspace/Board.
- **FR-406** — Les données analytics se recalculent à partir des données réelles (Task, Sprint, ActivityEvent) — pas de données mockées en dur.

## Critères d'acceptation

- Le burndown chart reflète fidèlement les story points restants au jour J du sprint actif.
- La vélocité affichée correspond à la somme réelle des estimates des tâches complétées par sprint.
- Le résumé IA mentionne au moins les tâches en retard si applicable, généré en moins de 3 secondes.
- Le dashboard reste lisible et utilisable avec zéro sprint actif (état vide géré proprement, pas de crash ni de graphique cassé).

## Dépendances techniques

Recharts, Prisma 7 (agrégations sur Task/Sprint/ActivityEvent), endpoints Axiom Intelligence (Phase 5) pour le résumé IA. Dépend des Phases 3 (Core Kanban) et 5 (AI).

**Contrainte d'implémentation UI :** le dashboard doit reprendre l'écran "Analytics dashboard" exporté dans `axiom-design/`, avec les couleurs/typographie définies dans `axiom-design/axiom/DESIGN.md`.

## Hors-périmètre

- Export de rapports (PDF/CSV) — pas dans le scope Now/Next/Later du produit.
- Comparaison multi-boards ou multi-workspaces — analytics scopé à un board à la fois.
