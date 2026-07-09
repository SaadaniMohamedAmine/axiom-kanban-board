# 004 — Axiom Intelligence (AI Features)

> Doc d'entrée pour `specify.specify`. Correspond à Phase 5 du PROGRESS.md.

## Contexte / Objectif

Implémenter "Axiom Intelligence" — la couche IA centrale du produit, qui raisonne et explique ses suggestions plutôt que de produire un résultat opaque. C'est le pilier de différenciation du produit (cf. `BRAND-IDENTITY.md`), pas une fonctionnalité accessoire.

## User Stories

- En tant qu'utilisateur, je reçois une suggestion de priorité pour une tâche, avec le raisonnement affiché (pas juste le résultat).
- En tant qu'utilisateur, je reçois une suggestion d'estimation (story points) basée sur des tâches similaires.
- En tant qu'utilisateur, je peux demander une auto-description de tâche à partir d'un titre court.
- En tant qu'utilisateur, je suis alerté si Axiom détecte qu'une tâche est probablement bloquée.
- En tant qu'utilisateur, je reçois une suggestion d'assignation basée sur la charge/l'historique de l'équipe.
- En tant qu'utilisateur, je vois le raisonnement de l'IA s'afficher en streaming (pas d'attente silencieuse).
- En tant qu'utilisateur, je peux donner un feedback 👍/👎 sur une suggestion IA.

## Exigences fonctionnelles

- **FR-301** — Intégrer Groq comme provider IA primaire (SDK officiel, modèle Llama via LPU) pour toutes les requêtes de suggestion.
- **FR-302** — Intégrer Gemini Flash comme fallback automatique si Groq retourne une erreur de quota/rate limit.
- **FR-303** — Endpoint `/api/ai/prioritize` : suggestion de priorité avec raisonnement textuel.
- **FR-304** — Endpoint `/api/ai/estimate` : suggestion d'estimation (story points) avec justification.
- **FR-305** — Endpoint `/api/ai/describe` : génération de description à partir d'un titre de tâche.
- **FR-306** — Endpoint `/api/ai/detect-blocker` : détection de blocage probable (basé sur l'inactivité, les dépendances, les commentaires).
- **FR-307** — Endpoint `/api/ai/assign` : suggestion d'assignation basée sur la charge de travail actuelle des membres du board.
- **FR-308** — Afficher chaque suggestion via un "reasoning stream" — affichage progressif du raisonnement au fur et à mesure de la génération (streaming), premier token visible en moins de 1.5s perçu.
- **FR-309** — Persister chaque suggestion dans `AILog` (type, input, output, confidence, feedback nullable).
- **FR-310** — Permettre un feedback USEFUL/NOT_USEFUL sur chaque AILog depuis l'UI.
- **FR-311** — Valider tous les inputs des endpoints IA avec Zod (contenu utilisateur libre = surface de risque).
- **FR-312** — Appliquer un rate limiting sur tous les endpoints `/api/ai/*` pour contrôler les coûts et l'abus en démo publique.
- **FR-313** — Toute UI liée à l'IA (panel de suggestions, reasoning stream, badges) doit utiliser exclusivement la nomenclature "Axiom Intelligence" — jamais "AI Assistant" ou "AI Insights".

## Critères d'acceptation

- Une suggestion de priorisation affiche un raisonnement textuel cohérent, pas juste un label de priorité brut.
- Si Groq échoue (simulé), la requête bascule sur Gemini Flash sans erreur visible côté utilisateur.
- Le premier élément du reasoning stream apparaît à l'écran en moins de 1.5 seconde perçue.
- Chaque suggestion générée crée une entrée AILog consultable.
- Le rate limiting bloque effectivement une rafale de requêtes dépassant le seuil défini, avec un message clair (pas une erreur 500 brute).
- Aucune occurrence de "AI Assistant" ou "AI Insights" dans le code UI livré — uniquement "Axiom Intelligence".

## Dépendances techniques

Groq SDK, Gemini API (fallback), Next.js Route Handlers avec streaming (Server-Sent Events ou streaming response), Zod, Prisma 7 (AILog). Dépend de la Phase 3 (Core Kanban) pour avoir des tâches sur lesquelles raisonner.

**Contrainte d'implémentation UI :** le panel de suggestions IA et le reasoning stream doivent reprendre fidèlement l'écran "Task Detail Modal" exporté dans `axiom-design/` (accents violet/cyan réservés à l'IA, jamais utilisés pour des contrôles UI standards).

## Hors-périmètre

- Fine-tuning ou modèle IA propriétaire — uniquement des appels API à des modèles existants (Groq/Gemini).
- Apprentissage automatique du feedback 👍/👎 pour améliorer les suggestions (le feedback est stocké, pas exploité activement à ce stade).
