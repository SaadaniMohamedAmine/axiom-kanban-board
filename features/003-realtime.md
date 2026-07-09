# 003 — Realtime

> Doc d'entrée pour `specify.specify`. Correspond à Phase 4 du PROGRESS.md.

## Contexte / Objectif

Rendre le board collaboratif en temps réel via Pusher Channels, pour que plusieurs membres d'un Workspace voient les changements des autres sans rafraîchir la page, avec une dégradation propre si le service realtime est indisponible.

## User Stories

- En tant qu'utilisateur, je vois apparaître/se déplacer/disparaître une tâche en temps réel quand un autre membre agit sur le même board.
- En tant qu'utilisateur, je vois qui est actuellement en train de regarder le board (presence).
- En tant qu'utilisateur, si la connexion temps réel tombe, je peux continuer à utiliser l'app normalement (rafraîchissement manuel) sans blocage de l'interface.

## Exigences fonctionnelles

- **FR-201** — Créer un canal Pusher par Board (scoping des événements au board concerné, pas de fuite cross-board).
- **FR-202** — Broadcaster les événements `task.created`, `task.updated`, `task.moved`, `task.deleted`, `column.updated` vers tous les clients abonnés au board.
- **FR-203** — Implémenter la presence Pusher (liste des utilisateurs connectés à un board, avec avatar/initiales).
- **FR-204** — Réconcilier l'état optimiste local avec l'événement broadcast reçu (éviter le double-rendu ou le flicker quand l'auteur de l'action reçoit son propre événement).
- **FR-205** — Détecter la perte de connexion Pusher côté client et afficher un indicateur discret ("mode hors-ligne temporaire") plutôt qu'un blocage.
- **FR-206** — Fallback en mode polling/refresh manuel si Pusher est indisponible plus de N secondes (seuil à définir en implémentation), conformément au NFR fiabilité.
- **FR-207** — Gérer le conflit d'édition concurrente sur une même tâche par "dernière écriture gagnante avec horodatage" + indicateur visuel de conflit si deux utilisateurs modifient quasi simultanément.

## Critères d'acceptation

- Deux navigateurs ouverts sur le même board voient un déplacement de tâche se synchroniser en moins d'1 seconde.
- La présence affiche correctement l'ajout/retrait d'un utilisateur sur le board en moins de 2 secondes.
- Couper artificiellement la connexion Pusher en local ne bloque pas le drag & drop ni la navigation de l'app.
- Un conflit d'édition simultanée sur la même tâche est visuellement signalé, sans perte silencieuse de données.

## Dépendances techniques

Pusher Channels (client + serveur), Next.js Server Actions (déclenchement des broadcasts après mutation DB), Prisma 7. Dépend de la Phase 3 (Core Kanban) pour avoir des mutations à broadcaster.

**Contrainte d'implémentation UI :** les indicateurs de presence/connexion doivent respecter le design system Axiom (couleurs, avatars géométriques) tel qu'exporté dans `axiom-design/` — pas de composant générique non stylé.

## Hors-périmètre

- Historique de messages / replay d'événements manqués (pas de besoin de message history façon Ably à ce stade — Pusher suffit pour le scope portfolio).
- Notifications push navigateur (couvert potentiellement en Phase 8 via le centre de notifications, pas en push natif).
