# 024 — Emails Transactionnels

> Doc d'entrée pour `specify.specify`. Scope "Later" — full product lifecycle signal.

## Contexte / Objectif

Implémenter les emails automatiques envoyés suite aux actions utilisateur clés, clôturant le cycle produit complet (activation, engagement, rétention via email) — signal de maturité produit qui démontre la pensée "full funnel" attendue d'un Product Tech Manager.

## User Stories

- En tant qu'utilisateur invité, je reçois un email d'invitation avec un lien pour rejoindre le workspace.
- En tant qu'utilisateur nouvellement inscrit, je reçois un email de bienvenue on-brand.
- En tant qu'utilisateur, je reçois un email quand une tâche m'est assignée (selon mes préférences de notification).
- En tant qu'utilisateur, je reçois un rappel email quand un sprint se termine dans 48h.
- En tant qu'utilisateur, je reçois un email quand Axiom Intelligence détecte un blocker sur une de mes tâches.
- En tant qu'utilisateur, je peux me désabonner de chaque type d'email depuis les Settings ou le lien de désinscription dans l'email.

## Exigences fonctionnelles

- **FR-2401** — Intégrer **Resend** comme provider d'envoi d'emails (API simple, tier gratuit généreux, excellent DX Next.js).
- **FR-2402** — Créer les templates d'emails avec **React Email** (composants React compilés en HTML email compatible multi-clients).
- **FR-2403** — Templates à implémenter :
  - **Invitation workspace** : lien d'invitation, nom du workspace, nom de l'invitant, rôle assigné, CTA "Rejoindre Axiom"
  - **Bienvenue** : après première inscription, présentation des 3 piliers Axiom, CTA "Créer mon premier board"
  - **Assignation de tâche** : titre de la tâche (`AX-XXXX`), board, assigné par, CTA "Voir la tâche"
  - **Rappel fin de sprint** : nom du sprint, date de fin, tâches restantes non complétées, CTA "Voir le sprint"
  - **Blocker détecté** : titre de la tâche, description du blocker détecté par Axiom Intelligence, CTA "Voir la tâche"
- **FR-2404** — Design des emails on-brand Axiom : fond dark `#0B0F19`, typographie Geist (ou fallback système), accent Electric Blue `#3B82F6` pour les CTAs — cohérent avec l'identité visuelle du produit.
- **FR-2405** — Préférences de notification par type d'email, gérables depuis Settings > Notifications (table `NotificationPreference` en DB ou champs JSON sur User).
- **FR-2406** — Lien de désinscription conforme (one-click unsubscribe) dans chaque email — obligatoire légalement (RGPD, CAN-SPAM).
- **FR-2407** — Les emails d'invitation sont envoyés via un job asynchrone (Server Action ou queue simple) — pas bloquant pour l'action UI de l'invitant.
- **FR-2408** — Preview des emails en développement via React Email (`email.react.email` ou serveur de preview local).

## Critères d'acceptation

- Un email d'invitation reçu contient le bon lien d'invitation, le nom du workspace et le rôle assigné.
- L'email de bienvenue est envoyé dans les 60 secondes suivant la première inscription.
- Le lien de désinscription fonctionne en un clic et met à jour immédiatement les préférences en DB.
- Les emails s'affichent correctement dans Gmail, Outlook et Apple Mail (testé via React Email ou Litmus).
- Aucune donnée sensible (token auth, mot de passe) n'apparaît dans le contenu des emails.
- Les emails ne partent pas si l'utilisateur a désactivé ce type de notification dans ses préférences.

## Dépendances techniques

`resend` (SDK officiel), `@react-email/components`, Next.js Server Actions (déclenchement asynchrone), Prisma 7 (préférences de notification), variables d'environnement (`RESEND_API_KEY`). Dépend des Phases 2 (auth/invitations) et 3 (tâches/sprints) pour les événements déclencheurs.

**Contrainte d'implémentation UI des emails :** respecter la voix de marque Axiom (conseiller premium discret — pas d'emojis, pas de "Oops!" ni d'"Hey!", ton factuel et professionnel) dans chaque template. Copy validée contre les exemples de `BRAND-IDENTITY.md`.

## Hors-périmètre

- Emails marketing / newsletter / annonces de nouvelles features — emails transactionnels uniquement (déclenchés par action utilisateur).
- A/B testing de subject lines.
- Tracking d'ouverture et de clics (Resend propose cette feature mais non activée pour respecter la vie privée des utilisateurs de démo).
