# 008 — UX & Motion Design avancé

> Doc d'entrée pour `specify.specify`. Correspond à Phase 9 du PROGRESS.md.

## Contexte / Objectif

Passer le produit déjà fonctionnel (Phases 2-8) au niveau "premium ressenti" : un audit UX expert et une couche de motion design cohérente, pour que l'expérience soit perçue comme aussi soignée que l'apparence visuelle statique. C'est ce qui distingue un produit "complet" d'un produit qui donne une sensation de qualité au toucher.

## User Stories

- En tant qu'utilisateur, je perçois chaque interaction (hover, clic, chargement, sauvegarde) comme intentionnelle et fluide, jamais brute ou instantanée sans transition.
- En tant qu'utilisateur, je navigue entre écrans avec des transitions cohérentes plutôt que des changements de page abrupts.
- En tant qu'utilisateur, je vois des états de chargement soignés (skeletons) plutôt que des spinners génériques.
- En tant qu'utilisateur, je reçois un feedback visuel clair quand une suggestion IA est appliquée ou qu'une action critique réussit/échoue.
- En tant que owner produit, je veux un audit heuristique complet pour détecter les frictions UX avant la mise en avant du projet.

## Exigences fonctionnelles

- **FR-701** — Réaliser un audit heuristique UX (type Nielsen) sur les parcours clés : onboarding, création de tâche, drag & drop, application de suggestion IA, invitation d'un membre.
- **FR-702** — Définir des courbes d'easing et durées de transition standardisées ("motion tokens" de marque), documentées et réutilisées partout (pas de valeurs ad hoc par composant).
- **FR-703** — Implémenter les micro-interactions sur les éléments interactifs clés : boutons, cards, inputs, items de liste (hover, focus, active states) via Framer Motion.
- **FR-704** — Implémenter des transitions de page/écran cohérentes (entrée/sortie de modal, changement de board, ouverture du detail de tâche).
- **FR-705** — Remplacer tout spinner générique par des skeletons premium adaptés à chaque type de contenu (board, liste de tâches, dashboard).
- **FR-706** — Ajouter un feedback visuel distinct pour : sauvegarde réussie, suggestion IA appliquée, erreur d'action, conflit d'édition détecté (cf. Phase 4).
- **FR-707** — Vérifier la cohérence du motion entre desktop et mobile (pas de micro-interaction desktop qui casse ou disparaît sur mobile).
- **FR-708** — Conduire une revue finale "feel" du produit (check-list expert UX ou regard externe) avant validation de clôture de phase.

## Critères d'acceptation

- Chaque parcours audité (FR-701) a au moins une friction documentée et corrigée, ou est explicitement validé sans friction majeure.
- Les motion tokens (durées, easing) sont centralisés dans un seul fichier de config, réutilisés par tous les composants animés.
- Aucun spinner générique ne subsiste sur les écrans avec chargement de données (board, dashboard, liste de tâches).
- Le feedback visuel sur application de suggestion IA est perceptible en moins de 300ms après l'action utilisateur.
- La revue finale "feel" est documentée avec une conclusion explicite (validé / points restants).

## Dépendances techniques

Framer Motion, design system Axiom (tokens existants à étendre avec des motion tokens), composants déjà implémentés en Phases 2-8 (cette phase les enrichit, ne les recrée pas).

**Contrainte d'implémentation UI :** les micro-interactions et transitions doivent rester fidèles à l'esthétique "Conseiller premium discret" de la marque (cf. `BRAND-IDENTITY.md`) — jamais d'animation ludique/enjouée, toujours retenue et précise. S'appuyer sur les exports `axiom-design/` comme référence de style si des indications de motion y sont présentes.

## Hors-périmètre

- Refonte visuelle des composants (couleurs, layout) — cette phase travaille uniquement le mouvement et le ressenti, pas l'apparence statique déjà figée en Phase 0.
- Sound design / feedback audio — non prévu pour ce produit.
