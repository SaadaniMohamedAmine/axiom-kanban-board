# Rappels — choses à vérifier / reprendre plus tard

> Fichier de suivi des points laissés en suspens pendant le développement, à re-vérifier ou finaliser ultérieurement.

---

## Vercel Speed Insights — non activé sur axiom-kanban-board

**Statut** : ✅ Résolu — décision actée, rien de plus à faire ici

**Contexte** : Le composant `<SpeedInsights />` est bien intégré dans le code (`src/app/layout.tsx`), mais **la collecte de données n'est pas active** sur le projet `axiom-kanban-board` côté dashboard Vercel.

**Pourquoi** : Le plan **Hobby** (gratuit) de Vercel limite Speed Insights à **un seul projet actif à la fois** sur le compte. Speed Insights est déjà activé sur un autre projet du compte (`saadanimohamedamines-projects`), donc l'activer ici demanderait :
- soit de **désactiver** Speed Insights sur l'autre projet (swap gratuit, mais perte de données sur l'autre projet),
- soit d'**upgrader vers le plan Pro** (payant).

**Décision prise** : on laisse tel quel — aucun changement côté Vercel, aucun upgrade.

**Alternative retenue pour obtenir les mêmes métriques** : utiliser **Google PageSpeed Insights** (https://pagespeed.web.dev/) ou l'onglet **Lighthouse** de Chrome DevTools, pointés directement sur l'URL de prod (`axiom-kanban-board.vercel.app`). Ça donne les mêmes Core Web Vitals (LCP, CLS, INP, TTFB, FCP) sans dépendre du produit Speed Insights ni de son quota de plan.

**Où ça doit ressortir plus tard** : cette alternative correspond déjà à ce qui est prévu dans `PROGRESS.md` — **Phase 10 (Recruiter-Ready Packaging)**, item *"Score Lighthouse/Core Web Vitals affiché (README ou landing)"*. Rien à changer au plan existant, juste à exécuter Lighthouse/PageSpeed manuellement quand on arrivera à cette phase.

**Vérifications correspondantes toujours valables (dans `src/app/layout.tsx`)** :
- [x] `<Analytics />` correctement monté et actif (Web Analytics activé, confirmé fonctionnel)
- [x] `<SpeedInsights />` correctement monté dans le code (aucune erreur console, aucun impact DX en dev)
- [x] Données Speed Insights réelles → non applicable par décision ; remplacées par Lighthouse/PageSpeed manuel en Phase 10

---

## Sentry — Auth Token pour les source maps

**Statut** : ✅ Résolu (2026-07-18) — token généré (scopes Project: Read & Write, Release: Admin, Organization: Read) et ajouté sur Vercel → `SENTRY_AUTH_TOKEN` (Production) via le CLI.

**Contexte** : Le projet Sentry `axiom-kanban-board` (org `mohamed-devs`) est créé, le DSN est configuré. Les 4 vars (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`) + maintenant `SENTRY_AUTH_TOKEN` sont toutes sur Vercel → Environment Variables (Production).

**Reste à faire** : redéployer — seulement à ce moment-là `withSentryConfig` (dans `next.config.ts`) uploadera les source maps pendant le build, et les prochaines erreurs captées auront des stack traces lisibles (code source réel, pas minifié) au lieu du JS minifié actuel.

---

## Sentry — vérifier la capture d'erreur réelle en production

**Statut** : ✅ Résolu (2026-07-18) — et un vrai bug critique trouvé et corrigé au passage, pas juste "vérifié".

**Ce qui s'est réellement passé** : le premier test (déclencher une erreur en prod via la console navigateur) n'est **jamais apparu** dans Sentry (dashboard bloqué sur l'écran d'onboarding "Waiting for this project's first error"), même en navigation privée sans extensions. Investigation a révélé que `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` sont la convention **pré-v8** de `@sentry/nextjs` — la version installée (10.65.0) ne les reconnaît plus du tout. Le SDK lui-même documente : *"When using Turbopack, `sentry.client.config.ts` will no longer work"* (ce projet build avec Turbopack). Autrement dit : **Sentry n'avait jamais capturé la moindre erreur, sur aucun environnement**, depuis la montée de version du SDK.

**Fix appliqué** : remplacé les 3 fichiers obsolètes par `instrumentation-client.ts` (client) et `instrumentation.ts` avec `register()` (serveur/edge) + les hooks `onRouterTransitionStart`/`onRequestError` requis par le SDK. `global-error.tsx` appelait déjà correctement `Sentry.captureException` — il n'avait juste rien d'initialisé à qui rapporter.

**Vérifié en prod après déploiement** : erreur de test déclenchée via la console → apparue dans `mohamed-devs.sentry.io` → Issues (`AXIOM-KANBAN-BOARD-1`, "Unhandled", `/dashboard`) en ~16 secondes. Capture confirmée fonctionnelle.

---

## SEO — pistes d'amélioration au-delà du scope Phase C

**Statut** : ✅ Résolu pour la plupart (branche `fix-rappel-cleanup`, 2026-07-17) — voir détail par point.

**Contexte** : la Feature 019 (SEO & Landing) est complète et validée (US1 — metadata, OG, robots.txt, sitemap.xml tous testés OK). Le reste de cette section listait des marges d'amélioration réelles pour un SEO "parfait".

### ✅ 1. RÉSOLU — `NEXT_PUBLIC_APP_URL` absente de Vercel + mauvais domaine en fallback

Corrigé côté Vercel pendant Phase D (env var ajoutée), et le fallback codé en dur a maintenant aussi été corrigé dans le code (`axiom-kanban.vercel.app` → `axiom-kanban-board.vercel.app`, 8 fichiers) — la var Vercel n'est plus un point de défaillance unique.

### ✅ 2. RÉSOLU — Favicon / icônes

`src/app/icon.tsx` et `src/app/apple-icon.tsx` existent maintenant — arrivés via le merge de `main` dans `fix-rappel-cleanup` (2026-07-18).

### ✅ 3. RÉSOLU — Données structurées JSON-LD (schema.org)

`SoftwareApplication` schema sur la landing (`src/app/page.tsx`), `Article` schema par entrée de changelog avec sa vraie date de frontmatter (`src/app/changelog/page.tsx`). Composant partagé : `src/components/seo/json-ld.tsx`.

### ✅ 4. RÉSOLU — `canonical` URL explicite

`alternates: { canonical: "/" }` sur le layout racine, override spécifique sur changelog/docs-api/pricing/privacy/roadmap/terms.

### ✅ 5. RÉSOLU — OG image générique partagée par toutes les pages

`/og/image` accepte maintenant `?title=`, changelog et roadmap l'utilisent chacun avec leur propre titre au lieu d'hériter de l'image générique de la landing.

### ✅ 6. RÉSOLU — `sitemap.xml` — `lastmod` non lié au vrai contenu

`/changelog` utilise maintenant la date réelle de l'entrée la plus récente (`getAllChangelogEntries()[0].date`) au lieu de `new Date()` au build. `/` et `/roadmap` restent sur `new Date()` — ni l'un ni l'autre n'a de date de contenu réelle à exposer, ce n'est pas une régression.

---

## Phase D — Emails transactionnels (Feature 024) — test bout-en-bout écarté par décision (2026-07-18)

**Statut** : ✅ Clôturé par décision — **non testé**, choix assumé de ne pas le faire

**Contexte** : `RESEND_API_KEY` et `RESEND_FROM` sont configurées sur Vercel (Production) depuis le 2026-07-11, avec l'adresse d'expédition sandbox `onboarding@resend.dev` (pas de domaine personnalisé vérifié — le projet tourne sur `axiom-kanban-board.vercel.app`, qui n'est pas vérifiable comme domaine d'envoi Resend). Le reste de Phase D (Rate Limiting, PWA, Webhooks/API) a été testé/validé en priorité ; les emails avaient d'abord été reportés à cause du quota bas du compte Resend gratuit/sandbox, puis la décision a été prise de ne pas exécuter ce test du tout avant la livraison.

**Ce qui reste non vérifié en conséquence** (à garder en tête si un souci de délivrabilité remonte plus tard) :
1. Email d'invitation (`inviteMember` → `sendInvitationEmail`) : rendu réel du template `invitation.tsx`, réception effective
2. Email de bienvenue (`sendWelcomeEmail`) : rendu réel du template `welcome.tsx` — la route `/api/auth/signup-hook` avait été re-câblée pendant une review antérieure, ce test aurait aussi validé ce câblage
3. Dashboard Resend (resend.com/logs) : pas vérifié que les envois arrivent sans erreur
4. Liens dans les emails (désinscription, URL de base) : pas reconfirmés en conditions réelles

**Note** : `sendTaskAssignedEmail` (template `task-assigned.tsx`) existe mais n'est câblé nulle part dans le code — hors scope, ne se déclenche jamais actuellement.

---

## Phase D — Incident production post-merge (2026-07-11) : 500 sur tout le site, root cause + fix

**Statut** : ✅ Résolu et en prod — mais 2 changements faits pendant l'incident restent en place et méritent un nettoyage propre (voir tâches ci-dessous)

**Ce qui s'est passé** : juste après le merge de la PR #10 (Phase D) vers `main`, **le site entier est tombé en panne** (`GET /` et toute route touchant la DB → `500 Internal Server Error`, y compris `/api/v1/boards`). Le build Vercel réussissait ("● Ready"), donc rien ne le laissait voir avant de tester en vrai sur `axiom-kanban-board.vercel.app`.

**Cause racine réelle** (confirmée) : dans `prisma/schema.prisma`, le bloc generator avait :
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"   // ← la ligne fautive
}
```
Ce `output` custom existait depuis la Phase 2 (commit `8c83039`, tout début du projet) et n'avait jamais posé problème — parce qu'aucune route touchant vraiment Prisma en prod n'avait été exercée par un vrai utilisateur/test depuis. Il force Prisma à générer les fichiers du client **en dehors** de la structure gérée par pnpm (le "virtual store" `.pnpm/`). Résultat : le fichier généré `node_modules/.prisma/client/runtime/client.js` fait `require("@prisma/client-runtime-utils")` (une sous-dépendance interne de Prisma 7), mais Node ne peut plus la résoudre car elle n'est symlinkée QUE dans l'emplacement pnpm géré normalement (`node_modules/.pnpm/@prisma+client@.../node_modules/@prisma/client-runtime-utils`), pas dans l'emplacement custom. **Reproduit même en local** (`node -e "require('@prisma/client')"` plantait aussi sur la machine de dev, pas juste sur Vercel).

**Le vrai fix** : supprimer la ligne `output` du generator, pour laisser Prisma générer au bon endroit (géré par pnpm, avec tous les sibling-packages correctement résolus). Un seul commit, une seule ligne supprimée (`b047fd5`).

**3 fausses pistes explorées avant de trouver la vraie cause** (dans l'ordre, chacune testée et écartée) :
1. `outputFileTracingIncludes` dans `next.config.ts` pour forcer Vercel à inclure les fichiers manquants — n'a rien changé (Turbopack ignore cette option, elle est faite pour Webpack)
2. Désactiver `next-pwa` (soupçon que son patch webpack cassait le tracing Vercel) — testé, l'erreur persistait à l'identique
3. Forcer `next build --webpack` au lieu de Turbopack (Next 16 utilise Turbopack par défaut pour `next build`, qui **saute complètement** l'étape "Collecting build traces") — a bien changé la signature de l'erreur (confirmé que Webpack tournait) mais **n'a pas résolu le vrai problème** (bug de résolution pnpm, indépendant du bundler). A aussi révélé un problème annexe : la route `/og/image` (edge runtime) dépassait la limite de 1MB des Edge Functions Vercel une fois buildée en Webpack → basculée en `runtime = "nodejs"` (fix légitime, à garder).

**Deux changements "de guerre" — résolu différemment que prévu (branche `fix-rappel-cleanup`, 2026-07-17)** :

1. **`package.json` — `"build"`** : redevenu `"prisma generate && next build"` (Turbopack, sans `--webpack`) maintenant que la PWA est désactivée en permanence (voir section suivante) — plus besoin de forcer Webpack juste pour que `next-pwa` génère un service worker. Si la PWA est un jour réactivée, il faudra remettre `--webpack`, sinon `@ducanh2912/next-pwa` ne génère plus aucun service worker (aucune erreur, `public/sw.js` n'est simplement jamais écrit — ce plugin ne patche que la config webpack).

2. **`next.config.ts` — next-pwa `disable: true` en dur** : ✅ résolu, voir section suivante.

---

## Phase D — PWA (Feature 020) — désactivée, ne pas retenter avant livraison (mis à jour 2026-07-18)

**Statut** : ⛔ Décision — reste désactivée (`disable: true`), ne pas réactiver avant un chantier dédié post-livraison

**C'est quoi cette feature, concrètement** : la PWA (Progressive Web App) permet à Axiom de se comporter comme une vraie app installable :
- **Installation / "Add to Home Screen"** : sur mobile (et desktop Chrome), le navigateur propose d'installer Axiom comme une app avec icône sur l'écran d'accueil, ouverture en plein écran sans barre d'adresse — comme une app native.
- **Mode offline** : un service worker met les pages visitées en cache ; en cas de perte de connexion, au lieu de l'écran d'erreur navigateur générique, l'utilisateur voit la page `/offline` on-brand ("You are offline. Try again") avec bouton de reconnexion.
- **Manifest** : nom de l'app, icônes 192px/512px, couleur de thème (`#0f131d`), raccourci direct "New Board" accessible en long-press sur l'icône de l'app.

**Historique complet des tentatives (3 essais, 3 échecs identiques)** :
1. `7ec82a9` — PWA activée dès le départ → 1er incident : casse le tracing serverless Vercel → désactivée.
2. `0f30c8e` → tentative de fix via `outputFileTracingIncludes` → PWA réactivée → `a4461b1` **2ème incident**, même erreur ("produces files in symlinked directories") → désactivée à nouveau.
3. `cbb4aa4` — vrai fix trouvé pour le symlink Prisma : `outputFileTracingIncludes` remplacé par `serverExternalPackages: ["@prisma/client-runtime-utils"]` (mécanisme officiel Next.js).
4. `28e5883` (cette branche, `fix-rappel-cleanup`) — PWA réactivée **par-dessus ce fix**, en pensant le problème du symlink réglé. `pnpm build` en local confirmait bien `public/sw.js`/`workbox-*.js` générés.
5. `3f3f31d` (`main`, 2026-07-17) — **3ème incident** : réactivée en prod, a de nouveau cassé le déploiement Vercel avec exactement la même erreur, malgré le fix `serverExternalPackages` déjà en place → redésactivée (`disable: true`), état actuel.

**Conclusion** : `serverExternalPackages` résout bien le problème de symlink Prisma isolément, mais ne suffit pas à rendre next-pwa compatible avec ce pipeline de déploiement (Vercel + pnpm + Prisma) — il y a un conflit de packaging plus profond, non identifié. Deux tentatives de réactivation avec des fixes différents ont chacune recassé la prod. Vu la proximité de la livraison, on ne retente pas une 4ème fois sans certitude.

**Pour un futur chantier PWA (post-livraison)** :
- Ne jamais pousser directement en prod — toujours valider sur un déploiement **Preview** d'abord.
- Creuser la cause réelle du conflit de packaging (probablement une interaction entre le patch webpack de `next-pwa` et le output file tracing de Next/Vercel, indépendante du symlink Prisma déjà réglé).
- Scénario de test une fois un fix candidat trouvé : Chrome DevTools → Manifest (name/icons/theme_color), Lighthouse PWA (vert), "Add to Home Screen" sur mobile, mode offline (Network → Offline → reload → `/offline`).

---

## Phase E — US2/US3/US4 : scénarios de test détaillés (US1 i18n déjà validé)

### US2 — Billing / Stripe

**Statut** : ✅ RÉSOLU (branche `feat-updaet-paiment-system-and-credentials`, 2026-07-18) — plan-limit enforcement réel implémenté (1 workspace / 2 boards / 10 requêtes IA par jour en FREE, `<UpgradeModal>` branché sur les 4 gates : workspace, board, membres, IA) et paiement réel testé de bout en bout plusieurs fois : checkout Stripe test mode (carte `4242 4242 4242 4242`) → webhook `checkout.session.completed` forwardé via `stripe listen` → `Workspace.plan` confirmé passé à `PRO` en base ; puis annulation → webhook `customer.subscription.deleted` → confirmé revenu à `FREE`. Cartes "Upgrade to Pro" et "Upgrade to Team" toutes les deux fonctionnelles sur `/settings/billing`.

### US3 — Audit Log

**Statut** : ✅ Étendu (branche `fix-rappel-cleanup`, 2026-07-17) — `WORKSPACE_CREATED`, `MEMBER_JOINED`, `API_KEY_CREATED`, `API_KEY_REVOKED` sont maintenant câblés en plus des 10 déjà en place (`WORKSPACE_RENAMED`/`TRASHED`/`ARCHIVED`/`UNARCHIVED`/`RESTORED`, `MEMBER_INVITED`, `BOARD_CREATED`, `TASK_DELETED`, `BILLING_UPGRADED`/`CANCELLED`). Reste 6 types non câblés, pour deux raisons différentes :

**Bloqués par le schéma actuel (pas juste un appel manquant)** :
- `WORKSPACE_DELETED` (`permanentlyDeleteWorkspace`) : `AuditLog.workspace` a `onDelete: Cascade` — toute entrée liée à ce workspace serait supprimée dans la même transaction que le workspace qu'elle est censée documenter. Nécessite une migration (FK nullable + `SetNull`) pour être fait correctement.
- `API_KEY_USED` : `actorEmail` est requis (non-null) en DB et dans `createAuditLog()`, mais une requête authentifiée par clé API n'a pas d'utilisateur humain à qui l'attribuer.
- `AUTH_LOGIN` / `AUTH_LOGIN_FAILED` / `AUTH_LOGOUT` : `AuditLog` est scopé par workspace (`workspaceId` requis), mais un événement d'auth n'est pas naturellement lié à un seul workspace (un utilisateur peut appartenir à plusieurs).

**Bloqués par une feature manquante (pas de l'instrumentation, du nouveau code)** :
- `MEMBER_REMOVED` : pas de fonction `removeMember` dans le code, ni d'UI pour retirer un membre.
- `BOARD_DELETED` : pas de fonction `deleteBoard` dans le code.
- `MEMBER_ROLE_CHANGED` : pas de fonction de changement de rôle.
- `AI_SUGGESTION_APPLIED` : les suggestions IA s'appliquent via les actions génériques de mise à jour de tâche (`task.actions.ts`), pas un point d'entrée dédié — instrumenter proprement demanderait de faire passer un flag "vient d'une suggestion IA" à travers plusieurs call sites.

**Test manuel** : ✅ Fait (2026-07-18) — page, filtres (email/action/période) et Export CSV tous vérifiés fonctionnels. A fait remonter un vrai bug au passage : 11 types d'action ajoutés cette session (`WORKSPACE_ARCHIVED`/`UNARCHIVED`/`TRASHED`/`RESTORED`, `BOARD_ARCHIVED`/`UNARCHIVED`/`TRASHED`/`RESTORED`, `TASK_CREATED`/`ARCHIVED`/`UNARCHIVED`) n'avaient pas de label de traduction — la colonne Action affichait la clé brute (`auditActions.TASK_CREATED`) au lieu du libellé. Corrigé, plus le lien "Audit Log" ajouté dans la sidebar (n'existait qu'via Settings avant).

4. Vérifie qu'aucune route ne permet de supprimer une entrée (pas de `DELETE` sur `/api/audit-log/*`) — confirmé déjà par audit de code, pas de UI à tester ici.

### US4 — Recruiter-Ready Packaging

**Statut** : ✅ Résolu (2026-07-18) — README entièrement réécrit (premium, showcase complet de toutes les features livrées cette session), les 2 placeholders remplacés par les vraies URLs (portfolio : `https://portfolio-mas-eight.vercel.app/` ; le lien GitHub était en fait déjà correct).

1. Ouvre `README.md` à la racine du repo. Tu trouveras les badges (CI, demo, Next.js, TypeScript, Prisma), une présentation par catégorie (Axiom Intelligence, gestion de projet, collaboration temps réel, billing, sécurité/audit, i18n/polish), la section "Why this stack", l'arborescence technique, les instructions de setup local, la section tests.
2. ✅ Placeholders corrigés — plus aucun lien factice dans le README.
3. ✅ Clôturé par décision (2026-07-18) — vérifié via `gh run list` : `Lint & Type Check` passe (vert), le job `Playwright E2E` échoue sur le run le plus récent (PR #18) et les précédents. Décision explicite : ne pas creuser davantage, considérer ce point validé tel quel.
4. En local, lance `pnpm db:seed` : doit créer sans erreur le workspace `axiom-demo` + 12 tâches (AX-1 à AX-12) + un sprint actif. — pas re-testé cette session.
5. Vérifie que la démo publique Vercel (`https://axiom-kanban-board.vercel.app`) a bien ces données de seed peuplées — pas vérifié cette session.
6. Ouvre `PROGRESS.md` : la ligne finale a été corrigée cette session pour refléter l'état réel (Phase E code écrit mais pas 100% fonctionnel) plutôt que le claim erroné "24/24 — 100%" d'avant.

**Reste optionnel** : re-tester `pnpm db:seed` et vérifier la démo Vercel peuplée (points 4-5) si on veut une validation à 100 % avant présentation à un recruteur — non bloquant pour la livraison.

---
