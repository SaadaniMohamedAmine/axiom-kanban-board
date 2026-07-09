# 002 — Core Kanban

> Doc d'entrée pour `specify.specify`. Correspond à Phase 3 du PROGRESS.md.

## Contexte / Objectif

Construire le cœur fonctionnel du produit : la gestion de Workspace/Board/Task avec une expérience drag & drop fluide et un détail de tâche riche, conforme au design system Axiom (`axiom-design/axiom/DESIGN.md`) et à `DATA-MODEL.md`.

## User Stories

- En tant qu'utilisateur, je crée un Workspace et invite des membres avec un rôle (OWNER/ADMIN/MEMBER/VIEWER).
- En tant qu'utilisateur, je crée un Board (template SCRUM/KANBAN/BUG_TRACKING/CUSTOM) avec des colonnes personnalisables.
- En tant qu'utilisateur, je crée, déplace, édite et supprime des tâches par drag & drop entre colonnes, avec un retour visuel immédiat (optimistic UI).
- En tant qu'utilisateur, j'ouvre le détail d'une tâche pour voir/éditer description, assignés, labels, commentaires, priorité, estimation, échéance.
- En tant qu'utilisateur, je consulte l'historique d'activité d'une tâche (qui a fait quoi, quand).
- En tant qu'utilisateur, je planifie des Sprints et y rattache des tâches.
- En tant que Viewer, je ne peux pas modifier ou supprimer de tâche, même en forçant une action côté UI.

## Exigences fonctionnelles

- **FR-101** — CRUD Workspace (création, renommage, slug, suppression réservée à OWNER).
- **FR-102** — Gestion des membres (WorkspaceMember) avec rôles et invitations par email (Invitation, statut PENDING/ACCEPTED/EXPIRED).
- **FR-103** — CRUD Board (templates SCRUM/KANBAN/BUG_TRACKING/CUSTOM) et CRUD Column (nom, ordre, couleur).
- **FR-104** — CRUD Task complet : titre, description riche, priorité (URGENT/HIGH/MEDIUM/LOW), estimate (story points), dueDate, ordre dans la colonne.
- **FR-105** — Génération du code de tâche (`AX-XXXX`) côté serveur uniquement, incrémental par board — jamais par le client ni par l'IA.
- **FR-106** — Drag & drop des tâches entre colonnes et réordonnancement intra-colonne via `@dnd-kit/core`, avec mise à jour optimiste de l'UI avant confirmation serveur.
- **FR-107** — Task detail modal : assignees (TaskAssignee), labels (Label/TaskLabel), commentaires (Comment), historique (ActivityEvent).
- **FR-108** — CRUD Sprint (nom, startDate, endDate, statut PLANNED/ACTIVE/COMPLETED) et rattachement de tâches à un sprint via le Board.
- **FR-109** — Vérification des permissions par rôle côté serveur sur toute action de mutation (création/édition/suppression) — jamais uniquement côté client.
- **FR-110** — Journalisation de chaque changement d'état significatif dans ActivityEvent (STATUS_CHANGE, ASSIGNED, COMMENTED, etc.).

## Critères d'acceptation

- Un utilisateur Viewer ne peut exécuter aucune action de mutation, même via un appel API direct (testé hors UI).
- Le déplacement d'une tâche entre colonnes est visible instantanément côté UI, avant confirmation serveur, sans glitch visuel en cas d'échec (rollback propre).
- Deux tâches créées simultanément sur le même board n'ont jamais le même code `AX-XXXX`.
- Le détail de tâche affiche et permet d'éditer tous les champs du modèle sans rechargement de page.
- L'historique d'activité d'une tâche reflète fidèlement chaque changement effectué pendant les tests manuels.

## Dépendances techniques

Next.js Server Actions/API Routes, Prisma 7, @dnd-kit/core, Framer Motion (transitions), Zod (validation des inputs), design system Axiom (composants UI Phase 0). Dépend de la Phase 2 (Setup) complétée.

**Contrainte d'implémentation UI :** toute l'interface (board, colonnes, task cards, task detail modal) doit être implémentée à partir du code exporté dans `axiom-design/` (exports Stitch — `code.html` par écran), pas recréée from scratch. Le code exporté est la source de vérité visuelle ; il sert de base à convertir en composants Next.js/Tailwind/React, en respectant exactement les tokens de `axiom-design/axiom/DESIGN.md`.

## Hors-périmètre

- Synchronisation temps réel entre utilisateurs (couverte en Phase 4).
- Suggestions ou automatisations IA sur les tâches (couvertes en Phase 5).
- Vue mobile optimisée (couverte en Phase 7) — le responsive de base suffit, pas l'optimisation tactile avancée.
