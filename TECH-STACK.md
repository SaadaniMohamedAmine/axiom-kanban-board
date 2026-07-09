# Axiom — Tech Stack

> Référence technique unique pour Speckit. Remplace les mentions de stack dispersées dans BRAND-IDENTITY.md (Fastify/Socket.io/Redis = obsolète, voir décision ci-dessous).
>
> **Validé via recherche web le 2026-06-27** (cf. note de validation en bas de fichier) : Auth.js v5 remplacé par Better Auth (recommandation actuelle des mainteneurs Auth.js eux-mêmes pour tout nouveau projet) ; Prisma confirmé en version 7 (client 100% TypeScript, plus de moteur Rust).

## Décision d'architecture

Tout-Next.js plutôt qu'un backend séparé Fastify+Socket.io+Redis (draft initial abandonné). Raison : infra minimale à maintenir solo, déploiement Vercel uniquement, temps réel délégué à un service managé plutôt qu'auto-hébergé.

## Stack retenue

**Framework :** Next.js 16 (App Router), TypeScript

**Styling :** Tailwind CSS

**UI/animation :** Framer Motion, @dnd-kit/core (drag & drop)

**Auth :** Better Auth — providers Google/GitHub + credentials, pas de vérification email. Remplace Auth.js v5 (toujours en beta, et ses propres mainteneurs orientent désormais les nouveaux projets vers Better Auth).

**Backend :** Next.js API Routes + Server Actions (pas de service séparé)

**Temps réel :** Pusher Channels (tier gratuit) — remplace Socket.io + Redis pub/sub

**Base de données :** PostgreSQL + Prisma ORM 7 (architecture 100% TypeScript depuis la v7, plus de moteur Rust — gain DX/fiabilité)

**IA :** Groq (primaire) + Gemini Flash (fallback). Groq pour le reasoning stream (LPU ultra-rapide, sert le NFR <1.5s premier token), Gemini Flash en repli si quota Groq dépassé (1500 req/jour vs 1000 req/jour sur Groq free tier) ou besoin multimodal futur. Cohérent avec PulseAI.

**Charts :** Recharts (burndown, vélocité)

**Validation :** Zod (sur tous les inputs API, en particulier les endpoints IA)

**Déploiement :** Vercel (un seul service, plus de Railway nécessaire)

**Tests :** Playwright (e2e)

## Note de cohérence

`BRAND-IDENTITY.md` sera mis à jour pour pointer vers ce fichier plutôt que de dupliquer la liste de stack.

## Note de validation (2026-06-27)

Stack vérifiée via recherche web avant le démarrage de Speckit, à la demande explicite du owner.

- **Next.js 16.2.x LTS** : version stable confirmée, choix toujours pertinent en 2026.
- **Auth.js v5 → Better Auth** : Auth.js v5 reste stable en prod mais toujours étiqueté beta ; ses propres mainteneurs recommandent désormais Better Auth pour tout nouveau projet (pas de migration en jeu ici). Décision : switch.
- **Prisma 7 confirmé** (vs Drizzle) : Prisma reste le plus adopté de l'écosystème TypeScript, et la v7 a supprimé le moteur Rust (client 100% TS) — gain de fiabilité. Drizzle est plus léger/edge-first mais Axiom n'a pas de contrainte edge runtime forte ; Prisma reste le choix le plus sûr et productif.
- **Pusher Channels confirmé** (vs Ably) : pertinent pour un produit à l'échelle prototype/portfolio ; Ably n'apporte de valeur qu'à l'échelle entreprise (delivery garantie, historique de messages) non nécessaire ici.

Sources : [Next.js Blog](https://nextjs.org/blog), [endoflife.date/nextjs](https://endoflife.date/nextjs), [LogRocket — Best auth library for Next.js 2026](https://blog.logrocket.com/best-auth-library-nextjs-2026/), [Auth.js — Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5), [makerkit.dev — Drizzle vs Prisma 2026](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma), [Bytebase — Drizzle vs Prisma 2026](https://www.bytebase.com/blog/drizzle-vs-prisma/), [Ably — Pusher vs Supabase 2026](https://ably.com/compare/pusher-vs-supabase), [buildmvpfast.com — Pusher vs Ably 2026](https://www.buildmvpfast.com/compare/pusher-vs-ably)
