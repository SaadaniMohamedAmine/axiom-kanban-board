# Axiom — Brand Identity

> Project 03/30 — AI-Powered Kanban Board. Document de référence pour toute décision de marque, copy, design et produit sur ce projet.

## Positionnement

**Nom :** Axiom
**Baseline :** "The intelligence layer for elite teams."
**Catégorie produit :** AI-powered project management platform pour équipes d'ingénierie.
**Promesse :** L'IA n'est pas une fonctionnalité ajoutée, c'est une couche d'intelligence fondamentale du produit — priorisation, estimation, détection de blockers, assignation, raisonnement visible.

**Piliers de marque :**
- **Intelligence** — l'IA raisonne et explique, elle ne se contente pas de produire un résultat.
- **Précision / Luxe** — dark, glow maîtrisé, dense mais jamais générique.
- **Vitesse d'exécution** — pensé pour des équipes tech exigeantes qui n'ont pas de temps à perdre.

## Voix de marque

**Persona : Conseiller premium discret.**

L'IA s'exprime à la première personne, mais avec retenue — jamais familière, jamais enthousiaste, jamais bruyante. Axiom énonce des faits, ne supplie pas, ne s'excuse pas de façon excessive, n'utilise jamais d'emoji ni de point d'exclamation.

Exemples de référence :
- "I noticed this task may be blocked."
- "Nothing here yet — let's start your first sprint."
- "3 tasks may need re-estimating."
- "Axiom flagged a blocker in Sprint 4."

À éviter : "Oops!", "Let's get started! 🚀", tout ton enjoué ou familier.

Sur les écrans d'erreur (403/404) : ton factuel et calme, jamais alarmant — pas de rouge agressif, pas d'illustrations clichées (robots cassés, astronautes perdus).

## Identité visuelle

**Logo :** Wordmark seul, sans icône ni symbole. Police Geist, sentence case, tracking -0.05em, medium-bold.

**Typographie :** Geist pour toute l'UI (display, headings, body, labels) ; JetBrains Mono pour le code/data (hash, terminal, valeurs dans les cartes Kanban).

**Palette (référence complète dans `axiom-design/axiom/DESIGN.md`) :**
- Fond / surfaces : near-black, du `#0B0F19` au `#1A2236` selon le niveau d'élévation
- Primaire (actions) : Electric Blue `#3B82F6` — réservé aux actions principales, usage sparse pour garder sa valeur de signal
- Accent IA (exclusif aux éléments générés par l'IA) : Violet `#8B5CF6` / Cyan `#22D3EE` — jamais utilisé pour des contrôles UI standards
- Contraste : minimum WCAG AA 4.5:1 partout, même dans l'esthétique glow/dark

**Style :** Corporate Modern avec accents glassmorphiques. Grain de film 2-3% sur les fonds. Glow ambiant (20px blur, 15% opacité) sous les CTA primaires. Grille stricte 8px. Rayons : 12-14px sur conteneurs (cards/modals), 8px sur contrôles (boutons/inputs).

**Avatars :** Cercles géométriques avec initiales — jamais de photos stock ni d'illustrations de personnages.

**Iconographie :** Lucide, stroke 1.5px constant.

## Conventions produit

- **Préfixe des tickets :** `AX-` suivi de 4 chiffres (ex. `AX-4012`) — jamais d'autre préfixe.
- **Nom de la feature IA :** "Axiom Intelligence" partout (panel de suggestions, reasoning stream, badges) — jamais "AI Assistant" ou "AI Insights" employés de façon interchangeable.
- **Footer technique IA :** convention du type "Axiom AI Intelligence Engine v0.2" en bas des panels IA — renforce la sensation de produit versionné réel.

## Stack technique

Voir `TECH-STACK.md` (fichier de référence unique — la stack a évolué depuis le draft initial : Fastify+Socket.io+Redis abandonné au profit de Next.js + Pusher ; Auth.js remplacé par Better Auth, Prisma confirmé en v7, suite à la validation de modernité du 2026-06-27).

## Portée produit — Now / Next / Later

**Now (à designer/builder à fond) :** Landing, Sign-up/Login, Onboarding (sans vérif email), Board principal + panel Axiom Intelligence, Task detail modal avec reasoning stream, Analytics dashboard, Command palette.

**Next (documenté, version simple) :** Team management, Settings (account/workspace/notifications), Notification center.

**Later (scope documenté pour montrer la maturité produit, pas nécessairement implémenté) :** Billing/pricing, audit log, emails transactionnels.

## Design — état au {{date}}

21 écrans designés et exportés (code + visuel) dans `axiom-design/`, design system complet documenté dans `axiom-design/axiom/DESIGN.md`. Phase design considérée close — prochaine étape : spécification Speckit.
