# 001 — Setup

> Doc d'entrée pour `specify.specify`. Correspond à Phase 2 du PROGRESS.md.

## Contexte / Objectif

Initialiser le projet Axiom sur une base Next.js 16 tout-intégré (frontend + backend + DB + auth + realtime), sans service séparé, déployée dès le premier jour sur Vercel pour avoir un environnement live continu plutôt qu'un "big bang" en fin de projet.

## User Stories

- En tant que développeur solo, je veux un projet Next.js scaffoldé avec TypeScript et Tailwind pour commencer à construire les écrans immédiatement.
- En tant que développeur, je veux une base de données provisionnée et un schema Prisma correspondant au modèle de données produit, pour pouvoir persister les données dès la Phase 3.
- En tant qu'utilisateur futur, je veux pouvoir me connecter via Google, GitHub ou email/mot de passe sans étape de vérification email.
- En tant que développeur, je veux une connexion temps réel fonctionnelle (canal de test) pour valider l'intégration avant de l'utiliser en Phase 4.
- En tant que owner du projet, je veux voir une URL Vercel live dès la fin du setup, pour suivre l'avancement réel en continu.

## Exigences fonctionnelles

- **FR-001** — Initialiser un projet Next.js 16 (App Router) en TypeScript avec Tailwind CSS configuré.
- **FR-002** — Configurer Prisma 7 avec PostgreSQL ; créer le schema initial à partir de `DATA-MODEL.md` (User, Account, Session, Verification, Workspace, WorkspaceMember, Invitation, Board, Column, Task, TaskAssignee, Label, TaskLabel, Comment, ActivityEvent, Sprint, AILog, Notification).
- **FR-003** — Exécuter la première migration Prisma et valider la connexion DB en local et en production (variable `DATABASE_URL`).
- **FR-004** — Intégrer Better Auth avec providers Google, GitHub, et credentials (email/mot de passe) ; désactiver explicitement le flux de vérification email.
- **FR-005** — Connecter Prisma Adapter à Better Auth pour persister User/Account/Session.
- **FR-006** — Configurer Pusher Channels (clé app, cluster) et valider un canal de test (publish/subscribe basique) avant la Phase 4.
- **FR-007** — Mettre en place les variables d'environnement (`.env.local`) pour DB, Better Auth, Pusher, IA (Groq/Gemini) — jamais committées (cf. NFR sécurité).
- **FR-008** — Déployer le projet sur Vercel (lien repo Git, variables d'env synchronisées) ; obtenir une URL de production fonctionnelle.
- **FR-009** — Mettre en place Zod comme librairie de validation par défaut sur toute future route API/Server Action.

## Critères d'acceptation

- Le projet build sans erreur (`next build`) en local et sur Vercel.
- Un utilisateur peut se créer un compte via Google OU GitHub OU credentials, sans recevoir/devoir cliquer un email de vérification.
- Le schema Prisma correspond exactement aux entités de `DATA-MODEL.md` (aucune entité manquante).
- Un message test publié sur un canal Pusher est reçu côté client en moins d'1 seconde.
- L'URL Vercel de production est accessible publiquement et affiche au minimum une page de login fonctionnelle.
- Aucune clé secrète n'apparaît dans le repo Git (vérification via recherche de patterns de clés avant le premier commit public).

## Dépendances techniques

Next.js 16, TypeScript, Tailwind CSS, Prisma 7, PostgreSQL (Vercel Postgres ou Neon/Supabase DB), Better Auth, Pusher Channels (tier gratuit), Zod, Vercel. Voir `TECH-STACK.md` pour le détail et la justification de chaque choix.

**Contrainte d'implémentation UI :** l'écran de login/signup minimal de cette phase doit déjà reprendre le code exporté correspondant dans `axiom-design/` (export Stitch), pas un design ad hoc — cette règle s'applique à toutes les phases suivantes impliquant de l'UI.

## Hors-périmètre

- Aucun écran fonctionnel autre que login/signup minimal (le design complet arrive en Phase 3+).
- Pas de CI/CD avancée (juste le déploiement Vercel automatique sur push) — la mise en place de tests/CI badge est traitée en Phase 10.
- Pas de configuration multi-environnement (staging) — un seul environnement de production pour ce projet portfolio.
