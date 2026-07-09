# 017 — Webhooks / Public API

> Doc d'entrée pour `specify.specify`. Feature bonus — platform thinking signal.

## Contexte / Objectif

Exposer une API publique et un système de webhooks pour permettre à des outils tiers de s'intégrer à Axiom — signal fort de pensée "plateforme" plutôt que "application fermée", rare dans un portfolio.

## User Stories

- En tant que développeur intégrateur, je consomme l'API REST d'Axiom pour lire et créer des tâches depuis un outil externe.
- En tant qu'administrateur Workspace, je configure un webhook pour recevoir des notifications lors d'événements produit (tâche créée, sprint terminé, suggestion IA appliquée).
- En tant que développeur, je consulte la documentation de l'API publique.

## Exigences fonctionnelles

- **FR-1701** — Exposer une API REST publique sur `/api/v1/` avec authentification par API Key (générée dans les Settings).
- **FR-1702** — Endpoints API minimaux : `GET /api/v1/boards`, `GET /api/v1/boards/:id/tasks`, `POST /api/v1/tasks`, `PATCH /api/v1/tasks/:id`.
- **FR-1703** — Génération et révocation d'API Keys depuis les Settings Workspace (scoped au workspace, pas global).
- **FR-1704** — Webhooks configurables par Workspace : URL cible + liste d'événements souscrits (`task.created`, `task.updated`, `sprint.completed`, `ai.suggestion.applied`).
- **FR-1705** — Signature des payloads webhook via HMAC-SHA256 (secret partagé) pour la vérification côté receveur.
- **FR-1706** — Page de documentation API publique (`/docs/api`) avec exemples de requêtes — générée statiquement ou via un fichier OpenAPI.
- **FR-1707** — Validation Zod sur tous les inputs des endpoints API publics.

## Critères d'acceptation

- Un appel `GET /api/v1/boards` avec une API Key valide retourne la liste des boards du workspace en JSON.
- Un webhook configuré reçoit le payload signé dans les 5 secondes suivant l'événement déclencheur.
- La signature HMAC peut être vérifiée avec le secret partagé (testé avec un script de vérification).
- Une API Key révoquée n'est plus acceptée immédiatement après sa révocation.

## Dépendances techniques

Next.js Route Handlers (API routes), Prisma 7 (APIKey, WebhookConfig entités à ajouter au DATA-MODEL), Zod, crypto (HMAC-SHA256 natif Node.js). Dépend des Phases 2-3 pour les données à exposer.

## Hors-périmètre

- GraphQL ou tRPC — REST uniquement pour ce scope.
- SDK client (npm package) pour l'API Axiom.
- Rate limiting avancé par API Key (le rate limiting global de Phase 5 suffit pour ce scope portfolio).
