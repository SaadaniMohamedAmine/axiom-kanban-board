# Rappels — choses à vérifier / reprendre plus tard

> Fichier de suivi des points laissés en suspens pendant le développement, à re-vérifier ou finaliser ultérieurement.

---

## Vercel Speed Insights — non activé sur axiom-kanban-board

**Statut** : ⏭️ Reporté (pas bloquant)

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
- [ ] Données Speed Insights réelles → **non applicable ici**, remplacé par Lighthouse/PageSpeed en Phase 10

---

## Sentry — Auth Token pour les source maps non configuré

**Statut** : ⏭️ Reporté (pas bloquant)

**Contexte** : Le projet Sentry `axiom-kanban-board` (org `mohamed-devs`) est créé, le DSN est configuré. Les 4 vars (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`) sont déjà ajoutées dans `.env.local` **et** dans Vercel → Environment Variables (Production), via le CLI. La capture d'erreurs fonctionnera donc dès le prochain redéploiement.

**Ce qui manque** : un **`SENTRY_AUTH_TOKEN`** (généré depuis Sentry → Settings → Auth Tokens) n'a pas été créé. Sans lui, `withSentryConfig` (dans `next.config.ts`) ne peut pas uploader automatiquement les source maps pendant le build CI.

**Impact concret** : les erreurs remontent quand même dans Sentry en prod, mais les stack traces pointeront vers du **code JS minifié** (illisible) au lieu du code source TypeScript original — plus difficile à déboguer, mais pas bloquant pour que le monitoring fonctionne.

**Pour finaliser plus tard** :
1. Sentry → Settings → Auth Tokens → générer un token avec les scopes `project:releases` et `org:read` minimum
2. L'ajouter dans Vercel → Environment Variables sous `SENTRY_AUTH_TOKEN`
3. Redéployer — les prochaines erreurs captées auront des stack traces lisibles (code source réel, pas minifié)

---

## Sentry — vérifier la capture d'erreur réelle en production

**Statut** : ⏭️ À faire après le prochain déploiement

**Contexte** : `sentry.client.config.ts` a `enabled: process.env.NODE_ENV === "production"` — donc **aucune erreur déclenchée en local (`pnpm dev`) ne remonte dans le dashboard Sentry**, même avec le DSN configuré. C'est voulu (évite de polluer le compte avec du bruit de dev). Le fallback `ErrorBoundary` a bien été validé visuellement en local (logo Axiom, "Something went wrong.", boutons Try again/Back to home, `Ref:` généré) — seule la transmission réelle vers Sentry reste à vérifier.

**Bouton de test laissé en place volontairement** : `src/components/ui/test-error-button.tsx`, monté dans `src/app/(app)/[workspaceSlug]/page.tsx` (bouton rouge flottant "💥 Trigger error" en bas à droite). **Marqué TEMPORARY dans le code — à retirer après ce test.**

**À faire** :
1. Redéployer `axiom-kanban-board` en production (les 4 vars `SENTRY_*` sont déjà sur Vercel)
2. Aller sur le site déployé, se connecter, cliquer sur "💥 Trigger error"
3. Vérifier que le fallback `ErrorBoundary` s'affiche bien aussi en prod
4. Aller sur `mohamed-devs.sentry.io` → Issues → confirmer qu'une nouvelle erreur "Test error — manual ErrorBoundary trigger" est apparue (généralement en quelques secondes)
5. **Une fois confirmé** : supprimer `src/components/ui/test-error-button.tsx` et son import/usage dans `[workspaceSlug]/page.tsx`, puis redéployer une dernière fois

---

## SEO — pistes d'amélioration au-delà du scope Phase C

**Statut** : ✅ Résolu pour la plupart (branche `fix-rappel-cleanup`, 2026-07-17) — voir détail par point.

**Contexte** : la Feature 019 (SEO & Landing) est complète et validée (US1 — metadata, OG, robots.txt, sitemap.xml tous testés OK). Le reste de cette section listait des marges d'amélioration réelles pour un SEO "parfait".

### ✅ 1. RÉSOLU — `NEXT_PUBLIC_APP_URL` absente de Vercel + mauvais domaine en fallback

Corrigé côté Vercel pendant Phase D (env var ajoutée), et le fallback codé en dur a maintenant aussi été corrigé dans le code (`axiom-kanban.vercel.app` → `axiom-kanban-board.vercel.app`, 8 fichiers) — la var Vercel n'est plus un point de défaillance unique.

### 🟠 2. Favicon / icônes manquants — toujours ouvert sur cette branche

Aucun fichier `favicon.ico`, `icon.tsx`/`icon.png`, `apple-icon.tsx`/`apple-icon.png` dans `src/app/` **sur cette branche** (`fix-rappel-cleanup`, partie de `main`). Hors scope de ce nettoyage — déjà résolu indépendamment sur une autre branche en cours (redesign), à vérifier après fusion.

**Fix** : créer `src/app/icon.tsx` (réutiliser le même logo SVG que la nav/OG image, généré dynamiquement comme `og/route.tsx`), + `apple-icon.tsx` en 180×180.

### ✅ 3. RÉSOLU — Données structurées JSON-LD (schema.org)

`SoftwareApplication` schema sur la landing (`src/app/page.tsx`), `Article` schema par entrée de changelog avec sa vraie date de frontmatter (`src/app/changelog/page.tsx`). Composant partagé : `src/components/seo/json-ld.tsx`.

### ✅ 4. RÉSOLU — `canonical` URL explicite

`alternates: { canonical: "/" }` sur le layout racine, override spécifique sur changelog/docs-api/pricing/privacy/roadmap/terms.

### ✅ 5. RÉSOLU — OG image générique partagée par toutes les pages

`/og/image` accepte maintenant `?title=`, changelog et roadmap l'utilisent chacun avec leur propre titre au lieu d'hériter de l'image générique de la landing.

### ✅ 6. RÉSOLU — `sitemap.xml` — `lastmod` non lié au vrai contenu

`/changelog` utilise maintenant la date réelle de l'entrée la plus récente (`getAllChangelogEntries()[0].date`) au lieu de `new Date()` au build. `/` et `/roadmap` restent sur `new Date()` — ni l'un ni l'autre n'a de date de contenu réelle à exposer, ce n'est pas une régression.

---

## Phase D — Emails transactionnels (Feature 024) pas encore testés en bout-en-bout

**Statut** : ⏭️ À faire avant de merger la PR Phase D

**Contexte** : `RESEND_API_KEY` et `RESEND_FROM` sont configurées sur Vercel (Production) depuis le 2026-07-11, avec l'adresse d'expédition sandbox `onboarding@resend.dev` (pas de domaine personnalisé vérifié — le projet tourne sur `axiom-kanban-board.vercel.app`, qui n'est pas vérifiable comme domaine d'envoi Resend). Le reste de Phase D (Rate Limiting, PWA, Webhooks/API) a été testé/validé en priorité, les emails ont été **volontairement reportés** car le compte Resend gratuit/sandbox limite l'envoi (quota bas, de l'ordre de quelques emails/heure).

**À tester avant merge** :
1. Email d'invitation (`inviteMember` → `sendInvitationEmail`) : inviter un membre depuis Settings → Members, vérifier réception + rendu du template `invitation.tsx`
2. Email de bienvenue (`sendWelcomeEmail`) : créer un nouveau compte via `/sign-up` (email/password), vérifier réception + rendu du template `welcome.tsx` — la route `/api/auth/signup-hook` a été re-câblée pendant la review (elle ne l'était pas dans l'implémentation initiale), donc ce test valide aussi ce fix
3. Vérifier dans le dashboard Resend (resend.com/logs) que les envois apparaissent bien, sans erreur
4. Confirmer que le lien de désinscription et les liens dans les emails pointent vers la bonne URL (`https://axiom-kanban-board.vercel.app`, plus l'ancien domaine cassé)

**Note** : `sendTaskAssignedEmail` (template `task-assigned.tsx`) existe mais n'est câblé nulle part dans le code — hors scope des tâches originales de Phase D. Pas la peine de le tester, il ne se déclenche jamais actuellement.

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

1. **`package.json` — `"build": "prisma generate && next build --webpack"`** : **gardé intentionnellement**, pas une dette à nettoyer. Testé le rebascule vers Turbopack (juste `next build`) : le build réussit, mais `@ducanh2912/next-pwa` **ne génère plus aucun service worker du tout** (aucune erreur, `public/sw.js` n'est simplement jamais écrit — ce plugin ne patche que la config webpack). Tant que PWA est actif, le build doit rester sur `--webpack`. Documenté directement dans `next.config.ts` pour ne pas se refaire avoir.

2. **`next.config.ts` — next-pwa `disable: true` en dur** : ✅ résolu, voir section suivante.

---

## Phase D — PWA (Feature 020) réactivée en prod (branche `fix-rappel-cleanup`, 2026-07-17)

**Statut** : ✅ Code fait et vérifié en local — ⏭️ reste seulement la vérification sur un déploiement preview avant de merger

**C'est quoi cette feature, concrètement** : la PWA (Progressive Web App) permet à Axiom de se comporter comme une vraie app installable :
- **Installation / "Add to Home Screen"** : sur mobile (et desktop Chrome), le navigateur propose d'installer Axiom comme une app avec icône sur l'écran d'accueil, ouverture en plein écran sans barre d'adresse — comme une app native.
- **Mode offline** : un service worker met les pages visitées en cache ; en cas de perte de connexion, au lieu de l'écran d'erreur navigateur générique, l'utilisateur voit la page `/offline` on-brand ("You are offline. Try again") avec bouton de reconnexion.
- **Manifest** : nom de l'app, icônes 192px/512px, couleur de thème (`#0f131d`), raccourci direct "New Board" accessible en long-press sur l'icône de l'app.

**Ce qui a été fait** :
1. `next.config.ts` : `disable: true` → `disable: process.env.NODE_ENV === "development"`.
2. Porté un fix découvert sur une autre branche pendant ce même nettoyage : `outputFileTracingIncludes` (l'ancien contournement pour `@prisma/client-runtime-utils`) traverse un symlink pnpm sans inclure le symlink lui-même, ce qui fait planter le packaging Vercel ("produces files in symlinked directories") — remplacé par `serverExternalPackages: ["@prisma/client-runtime-utils"]`, le mécanisme officiel de Next.js pour ce cas. Sans ce fix, réactiver PWA aurait probablement recassé le déploiement Vercel une deuxième fois.
3. `pnpm build` en local confirmé : `public/sw.js` et `workbox-*.js` générés, `.next/server/.../route.js.nft.json` référence toujours correctement `client-runtime-utils`.

**Ce qui reste** : déployer en **Preview d'abord** (pas `--prod`, pas push direct sur `main`) et suivre le scénario de test :
- Chrome DevTools → **Application** → **Manifest** : `name`, `icons` (192/512), `theme_color` (`#0f131d`) corrects
- Chrome DevTools → **Lighthouse** → "Progressive Web App" → doit être vert
- Mobile (ou device emulation) : doit proposer "Add to Home Screen" / "Install app"
- Réseau coupé (DevTools → Network → Offline) + reload → doit afficher `/offline` avec "Try again"
- Si tout est vert → merger, puis reconfirmer sur `https://axiom-kanban-board.vercel.app`

---

## Phase E — US2/US3/US4 : scénarios de test détaillés (US1 i18n déjà validé)

### US2 — Billing / Stripe

**Statut** : ✅ Stale — le bouton "Upgrade to Pro" décrit ci-dessous comme une ancre morte est déjà branché sur `UpgradeCheckoutButton` → `/api/billing/checkout` dans le code actuel de cette branche. Reste un test manuel de bout en bout (carte test Stripe), pas un bug de code.

1. Connecté, va sur `/{workspace}/settings/billing`. Tu trouveras le plan actuel ("Free"), un bloc d'usage "Boards X / 3" et "Members X / 10", et un lien "Upgrade to Pro" (visible seulement en plan Free).
2. Clique "Upgrade to Pro" → amène sur `/pricing` (3 cartes Free/Pro/Team).
3. Ce qui marche déjà et est testable : plan-limit enforcement. Crée des tableaux jusqu'à 3 sur un workspace Free → le 4ème doit lever `PLAN_LIMIT_BOARDS:FREE` (vérifier si un message on-brand s'affiche ou si c'est une erreur brute non gérée côté UI).
4. Pareil sur `/settings/members` : inviter jusqu'à 10 membres en Free → le 11ème doit lever `PLAN_LIMIT_MEMBERS:FREE`.
5. Webhook Stripe (`/api/billing/webhook`) : déjà créé côté Stripe Dashboard (test mode, endpoint `https://axiom-kanban-board.vercel.app/api/billing/webhook`, events `checkout.session.completed`/`customer.subscription.updated`/`customer.subscription.deleted`) — non testé de bout en bout avec un vrai paiement.

**À faire avant de considérer US2 validée** : tester un paiement réel en carte test Stripe (`4242 4242 4242 4242`) et vérifier que `Workspace.plan` passe à `PRO` après webhook. Test uniquement, pas de code à écrire.

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

1. Va sur `/{workspace}/audit-log` (lien "Journal d'audit" en bas de la sidebar). Si tu n'es pas OWNER/ADMIN, tu trouveras un écran "Access restricted" — pas de 500, comportement correct.
2. En tant qu'OWNER/ADMIN, tu trouveras un tableau avec colonnes Date/Actor/Action/Target, des filtres (email, action, période 7/30/90 jours), et un bouton "Export CSV".
3. Teste l'export CSV : clique le bouton, vérifie que le fichier téléchargé a les colonnes Date/Actor/Action/Target Type/Target/IP Address.
4. Vérifie qu'aucune route ne permet de supprimer une entrée (pas de `DELETE` sur `/api/audit-log/*`) — confirmé déjà par audit de code, pas de UI à tester ici.

### US4 — Recruiter-Ready Packaging

**Statut** : ⚠️ Contenu présent mais avec des placeholders non remplacés + une incohérence de statut.

1. Ouvre `README.md` à la racine du repo. Tu trouveras les badges (CI, demo, Next.js, TypeScript), une table "What it does", une section "Why this stack", l'arborescence technique, les instructions de setup local, la section tests.
2. **Bug connu** : les liens `https://github.com/YOUR_GITHUB/axiom-kanban-board` (badge CI + commande `git clone`) et `https://your-portfolio.com` (lien portfolio) sont des placeholders jamais remplacés par les vraies URLs.
3. Va sur l'onglet Actions du repo GitHub : le badge CI dans le README doit pointer vers un run réellement vert. Avec les fixes CI de cette session, ça devrait être le cas maintenant — à reconfirmer après le merge de cette PR.
4. En local, lance `pnpm db:seed` : doit créer sans erreur le workspace `axiom-demo` + 12 tâches (AX-1 à AX-12) + un sprint actif.
5. Vérifie que la démo publique Vercel (`https://axiom-kanban-board.vercel.app`) a bien ces données de seed peuplées — pas vérifiable depuis le code, à checker manuellement en visitant le site.
6. Ouvre `PROGRESS.md` : la ligne finale a été corrigée cette session pour refléter l'état réel (Phase E code écrit mais pas 100% fonctionnel) plutôt que le claim erroné "24/24 — 100%" d'avant.

**À faire avant de considérer US4 validée** : remplacer les 2 placeholders dans le README avec les vraies URLs (github.com/SaadaniMohamedAmine/axiom-kanban-board et l'URL du portfolio), confirmer le badge CI vert après merge, et peupler/vérifier la démo Vercel.

---
