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

**Statut** : ⏭️ À traiter plus tard, par ordre de priorité ci-dessous

**Contexte** : la Feature 019 (SEO & Landing) est complète et validée (US1 — metadata, OG, robots.txt, sitemap.xml tous testés OK). Mais en creusant, il y a des marges d'amélioration réelles pour un SEO "parfait", du plus critique au plus cosmétique.

### ✅ 1. RÉSOLU (Phase D) — `NEXT_PUBLIC_APP_URL` absente de Vercel + mauvais domaine en fallback

**Statut** : ✅ Corrigé pendant Phase D (2026-07-11) — `NEXT_PUBLIC_APP_URL=https://axiom-kanban-board.vercel.app` ajoutée dans Vercel → Environment Variables (Production) via CLI. Le fallback codé en dur dans le code n'a pas été changé (reste `axiom-kanban.vercel.app`), donc si jamais cette var Vercel est supprimée par erreur, le bug reviendrait — envisager de corriger le fallback en dur un jour pour être robuste.

<details>
<summary>Détail original du bug (pour référence)</summary>

**Découvert en vérifiant l'US1** : `NEXT_PUBLIC_APP_URL` n'est **pas définie** dans les Environment Variables Vercel (confirmé via `vercel env ls production`). Le code retombe donc sur le fallback codé en dur dans `src/app/layout.tsx`, `robots.ts` et `sitemap.ts` :
```ts
process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app"
```
Or le vrai domaine stable du projet (confirmé via `vercel inspect`) est **`https://axiom-kanban-board.vercel.app`** — pas `axiom-kanban.vercel.app` (il manque `-board`). Résultat concret **actuellement en production** :
- `og:image`, `og:url`, `twitter:image` pointent vers un domaine qui n'existe pas → **les previews de partage (Slack/Twitter/LinkedIn) sont cassées**
- `robots.txt` référence un `Sitemap:` avec la mauvaise URL
- `sitemap.xml` liste des URLs avec le mauvais domaine (Google Search Console les rejettera)

**Fix rapide (2 options)** :
- Soit ajouter `NEXT_PUBLIC_APP_URL=https://axiom-kanban-board.vercel.app` dans Vercel → Environment Variables (même méthode CLI que pour Sentry : `vercel env add NEXT_PUBLIC_APP_URL production`)
- Soit corriger le fallback codé en dur dans les 3 fichiers pour qu'il soit juste par défaut

**Recommandé** : faire les deux — corriger le fallback ET définir la vraie variable, pour être robuste même si le domaine custom change plus tard.

</details>

### 🟠 2. Favicon / icônes manquants

Aucun fichier `favicon.ico`, `icon.tsx`/`icon.png`, `apple-icon.tsx`/`apple-icon.png` ou `manifest.json` dans `src/app/`. Next.js 16 supporte ces conventions nativement (comme `og/route.tsx` déjà en place). Sans ça :
- Onglet navigateur affiche l'icône générique par défaut
- Pas d'icône lors d'un partage sur mobile / ajout à l'écran d'accueil
- Recommandation Google Search (favicon manquant = léger signal négatif de qualité)

**Fix** : créer `src/app/icon.tsx` (réutiliser le même logo SVG que la nav/OG image, généré dynamiquement comme `og/route.tsx`), + `apple-icon.tsx` en 180×180.

### 🟡 3. Pas de données structurées JSON-LD (schema.org)

Aucun `<script type="application/ld+json">` sur aucune page. Pour un SEO "parfait", Google recommande d'ajouter :
- `Organization` ou `SoftwareApplication` schema sur la landing (`src/app/page.tsx` / `landing-page.tsx`)
- `Article` schema sur chaque entrée de changelog (`src/app/changelog/page.tsx`) — donnerait des rich snippets avec date de publication dans les résultats de recherche

**Fix** : ajouter un composant `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />` avec les objets schema.org appropriés.

### 🟡 4. Pas de `canonical` URL explicite

Aucune page ne définit `alternates: { canonical: ... }` dans son `metadata`. Pas grave tant qu'il n'y a qu'un seul domaine de prod, mais si jamais un domaine preview Vercel (`*-git-main-*.vercel.app`) est indexé par erreur, ça crée du contenu dupliqué aux yeux de Google.

**Fix** : ajouter `alternates: { canonical: "/" }` (ou l'URL complète) dans le `metadata` de chaque page publique (landing, changelog, roadmap).

### 🟢 5. OG image générique partagée par toutes les pages

`/changelog` et `/roadmap` héritent de la même image OG que la landing (le générateur `og/image/route.tsx` ne prend aucun paramètre). Une image contextualisée par page (ex: titre "Changelog" au lieu du titre générique) améliorerait le taux de clic sur les partages sociaux.

**Fix** : passer un paramètre à la route (`/og/image?title=Changelog`) et adapter `ImageResponse` en conséquence.

### 🟢 6. `sitemap.xml` — `lastmod` non lié au vrai contenu

Toutes les entrées utilisent `new Date()` au moment du build plutôt que la vraie date de dernière modification. Pour `/changelog`, la date du fichier `.md` le plus récent (déjà disponible via `data.date` dans `getAllChangelogEntries()`) serait plus juste.

**Priorité globale** : traiter le point 🔴 1 en premier (impact réel en prod dès aujourd'hui), le reste peut attendre la Phase 10 (Recruiter-Ready Packaging).

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

## Phase D — PWA (Feature 020) à re-vérifier sur le déploiement Vercel (HTTPS)

**Statut** : ✅ US PWA considérée validée (implémentation + build + code review OK) — vérification manuelle sur prod HTTPS à faire au prochain déploiement

**Contexte** : Le service worker (`next-pwa`) est désactivé en développement (`disable: process.env.NODE_ENV === "development"` dans `next.config.ts`), donc rien de tout ça n'est testable sur `localhost`. Il faut impérativement tester sur le déploiement Vercel une fois en ligne.

**À tester sur `https://axiom-kanban-board.vercel.app`** :
1. Va sur le déploiement Vercel en HTTPS (pas localhost — le service worker est désactivé en dev)
2. Chrome DevTools → onglet **Application** → **Manifest** : vérifie que `name`, `icons` (192/512), `theme_color` (`#0f131d`) s'affichent correctement
3. Chrome DevTools → **Lighthouse** → coche "Progressive Web App" → Analyze : doit être vert
4. Sur mobile (ou Chrome DevTools device emulation) : menu ⋮ → doit proposer "Add to Home Screen" / "Install app"
5. Coupe le réseau (DevTools → Network → Offline) et recharge → doit afficher la page `/offline` avec le bouton "Try again"

---
