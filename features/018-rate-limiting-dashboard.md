# 018 — Rate Limiting Dashboard

> Doc d'entrée pour `specify.specify`. Feature bonus — production discipline & AI cost control signal.

## Contexte / Objectif

Rendre visible le quota IA consommé via un dashboard in-app, démontrant la conscience des coûts et la discipline production — particulièrement pertinent en démo publique où le free tier Groq/Gemini est partagé entre tous les visiteurs.

## User Stories

- En tant qu'administrateur Workspace, je consulte le quota IA consommé (requêtes aujourd'hui / limite journalière).
- En tant qu'utilisateur, je reçois un message clair et on-brand si le quota IA est temporairement atteint — pas une erreur 500 brute.
- En tant que owner produit, je vois en un coup d'œil l'utilisation IA de mon workspace.

## Exigences fonctionnelles

- **FR-1801** — Tracker le nombre de requêtes IA par workspace par jour dans un compteur (Redis ou simple champ DB sur Workspace).
- **FR-1802** — Afficher le quota IA dans les Settings Workspace : "X / Y requêtes IA utilisées aujourd'hui".
- **FR-1803** — Barre de progression visuelle du quota (0% → 100%) stylée on-brand.
- **FR-1804** — Quand le quota est atteint, retourner un message clair et on-brand côté UI (pas une erreur générique) : "Axiom Intelligence quota reached for today. Resets at midnight UTC."
- **FR-1805** — Reset automatique du compteur à minuit UTC.
- **FR-1806** — Le seuil de quota est configurable via variable d'environnement (`AI_DAILY_LIMIT`, défaut : 50 requêtes/jour/workspace en mode démo).

## Critères d'acceptation

- Le compteur s'incrémente correctement après chaque requête IA réussie.
- Atteindre le quota affiche le message on-brand sans exposer de stack trace ni d'erreur technique.
- Le quota se remet à zéro à minuit UTC (testé via simulation ou changement de date).
- Le dashboard Settings affiche le quota en temps réel (au rechargement de page, pas forcément en temps réel websocket).

## Dépendances techniques

Prisma 7 (champ `aiRequestsToday` + `aiRequestsResetAt` sur Workspace), Next.js Server Actions, design system Axiom. Dépend de la Phase 5 (Axiom Intelligence) pour les endpoints IA existants.

## Hors-périmètre

- Dashboard analytics IA avancé (coût en dollars, breakdown par type de suggestion) — le compteur simple suffit.
- Quota configurable par utilisateur individuel — par workspace uniquement.
