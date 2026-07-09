# 021 — Internationalisation FR/EN (i18n)

> Doc d'entrée pour `specify.specify`. Feature bonus — cross-market product thinking signal.

## Contexte / Objectif

Internationaliser Axiom en français et anglais pour démontrer la capacité à construire un produit multi-marché — cohérent avec le profil bilingue et la cible recruteur internationale. Français par défaut, anglais disponible.

## User Stories

- En tant qu'utilisateur francophone, je navigue dans Axiom entièrement en français.
- En tant qu'utilisateur anglophone, je bascule vers l'interface en anglais depuis les Settings.
- En tant que développeur, j'ajoute une nouvelle chaîne traduite en un seul endroit sans chercher dans les composants.

## Exigences fonctionnelles

- **FR-2101** — Intégrer `next-intl` comme librairie i18n (compatible App Router Next.js).
- **FR-2102** — Deux locales supportées : `fr` (défaut) et `en`.
- **FR-2103** — Fichiers de traduction JSON par locale dans `/messages/fr.json` et `/messages/en.json` couvrant toutes les chaînes UI (labels, messages d'erreur, toasts, copy des features IA, voix de marque Axiom).
- **FR-2104** — Détection automatique de la locale via `Accept-Language` du navigateur au premier chargement.
- **FR-2105** — Persistance du choix de langue dans les Settings utilisateur (DB ou localStorage).
- **FR-2106** — Toggle de langue accessible depuis la navigation principale ou les Settings.
- **FR-2107** — Les messages de la voix de marque Axiom (conseiller premium discret) sont traduits en respectant le ton dans les deux langues — pas de traduction littérale mécanique.
- **FR-2108** — Les dates et formats numériques s'adaptent à la locale (ex. `dd/mm/yyyy` en FR vs `mm/dd/yyyy` en EN) via l'API `Intl`.

## Critères d'acceptation

- Basculer sur `/en` ou changer la langue dans les Settings affiche l'intégralité de l'UI en anglais sans chaîne manquante (pas de fallback visible en français).
- Les dates dans l'activity log et les sprints s'affichent au bon format selon la locale active.
- La voix de marque (ex. "I noticed this task may be blocked.") est cohérente et premium dans les deux langues.
- Aucune chaîne en dur dans les composants React — toutes passent par le hook `useTranslations()` de next-intl.

## Dépendances techniques

`next-intl`, Next.js App Router (middleware de routing i18n), Prisma 7 (champ `locale` sur User), API `Intl` native. Dépend de l'ensemble des composants UI déjà implémentés (Phases 2-9) qui devront être passés à next-intl.

## Hors-périmètre

- Plus de 2 langues (FR/EN uniquement pour ce scope).
- Traduction du contenu généré par l'IA (les suggestions Axiom Intelligence restent en anglais — langue des modèles Groq/Gemini).
- RTL (right-to-left) support.
