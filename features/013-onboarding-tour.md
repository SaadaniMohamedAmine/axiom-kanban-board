# 013 — Onboarding Tour interactif

> Doc d'entrée pour `specify.specify`. Feature bonus — activation & product thinking signal.

## Contexte / Objectif

Implémenter un onboarding tour contextuel pour les nouveaux utilisateurs (et la démo publique), guidant vers la première valeur du produit sans friction. Démontre la pensée activation/rétention attendue d'un Product Tech Manager.

## User Stories

- En tant que nouvel utilisateur, je suis guidé pas à pas vers la création de mon premier board et ma première tâche.
- En tant qu'utilisateur de la démo, je comprends immédiatement les fonctionnalités clés sans avoir à explorer seul.
- En tant qu'utilisateur, je peux ignorer ou relancer le tour à tout moment.

## Exigences fonctionnelles

- **FR-1301** — Déclencher le tour automatiquement à la première connexion d'un utilisateur (flag `onboardingCompleted` en DB ou localStorage).
- **FR-1302** — Tour en 4-5 étapes maximum : (1) Bienvenue sur Axiom, (2) Voici votre board, (3) Créez votre première tâche, (4) Découvrez Axiom Intelligence, (5) Invitez votre équipe.
- **FR-1303** — Chaque étape pointe vers l'élément UI concerné (highlight + tooltip positionné) — pas un modal plein écran générique.
- **FR-1304** — Boutons "Suivant", "Ignorer" et "Terminer" sur chaque étape.
- **FR-1305** — Possibilité de relancer le tour depuis les Settings.
- **FR-1306** — Ton et copy conformes à la voix de marque Axiom (conseiller premium discret — pas d'emojis, pas d'"Oops!" ni de ton enjoué).
- **FR-1307** — Compatible mobile (les tooltips se repositionnent correctement sur petit écran).

## Critères d'acceptation

- Le tour se déclenche à la première connexion et ne se redéclenche pas à la reconnexion suivante.
- Chaque étape surligne correctement l'élément UI cible sans débordement hors viewport.
- "Ignorer" ferme le tour immédiatement et marque l'onboarding comme complété.
- Le tour relancé depuis Settings repart bien de l'étape 1.

## Dépendances techniques

Librairie de tour (ex. `driver.js` ou `react-joyride`), Next.js, Prisma (flag onboardingCompleted sur User) ou localStorage pour la démo publique. Dépend de la Phase 3 (Core Kanban) pour avoir un board existant à pointer.

## Hors-périmètre

- Tour personnalisé par rôle (OWNER vs MEMBER) — un seul tour générique pour ce scope.
- Analytique de completion du tour (quel % d'utilisateurs finissent chaque étape).
