# 007 — Polish & Deploy final

> Doc d'entrée pour `specify.specify`. Correspond à Phase 8 du PROGRESS.md.

## Contexte / Objectif

Compléter les fonctionnalités "Next" du scope produit (team management, settings, notifications), ajouter les éléments de finition transverses (command palette, pages d'erreur, mode démo), sécuriser le produit avec des tests, et faire la mise en production finale. Le projet est déjà live sur Vercel depuis la Phase 2 — cette phase est une consolidation, pas un premier déploiement.

## User Stories

- En tant qu'OWNER/ADMIN, je gère les membres de mon Workspace (rôles, retrait, ré-invitation) depuis un écran Team management dédié.
- En tant qu'utilisateur, je configure mes préférences (compte, workspace, notifications) depuis un écran Settings.
- En tant qu'utilisateur, je consulte mes notifications (assignation, mention, suggestion IA) dans un centre de notifications.
- En tant qu'utilisateur, j'ouvre une command palette (⌘K) pour naviguer/agir rapidement sans la souris.
- En tant que visiteur non authentifié, je peux explorer un mode démo sandboxé sans impacter de vraies données.
- En tant qu'utilisateur, je vois une page d'erreur 403/404 cohérente avec la marque plutôt qu'une page générique.

## Exigences fonctionnelles

- **FR-601** — Écran Team management : liste des membres, changement de rôle, retrait, renvoi d'invitation.
- **FR-602** — Écran Settings : sous-sections Account (profil, photo, mot de passe si credentials), Workspace (nom, slug), Notifications (préférences on/off par type).
- **FR-603** — Centre de notifications : liste des Notification (type, payload, readAt), marquage lu/non lu.
- **FR-604** — Command palette globale (⌘K) : recherche de tâches, navigation entre boards, actions rapides (créer tâche, changer de workspace).
- **FR-605** — Mode démo : Workspace sandboxé accessible sans authentification, reset périodique des données, aucun accès aux données utilisateurs réelles.
- **FR-606** — Pages d'erreur 403 et 404 on-brand : ton factuel et calme (cf. voix de marque), pas d'illustration clichée.
- **FR-607** — Suite de tests Playwright e2e couvrant : inscription/connexion, CRUD board/task, drag & drop, flux de suggestion IA de base.
- **FR-608** — Audit accessibilité WCAG AA complet (contraste, navigation clavier, alternative au drag & drop) sur l'ensemble des écrans livrés.
- **FR-609** — Revue de mise en production finale : variables d'environnement de prod vérifiées, clés à scope minimal, quotas IA contrôlés.

## Critères d'acceptation

- Un ADMIN peut changer le rôle d'un membre et voir l'effet appliqué immédiatement (permissions mises à jour).
- Le mode démo reste fonctionnel après plusieurs sessions sans corruption des données de démo partagées.
- La command palette s'ouvre en moins de 200ms et retourne des résultats de recherche pertinents en moins de 500ms.
- La suite Playwright passe à 100% en CI avant tout déploiement de cette phase.
- Aucune violation de contraste WCAG AA détectée sur les écrans audités.

## Dépendances techniques

Next.js, Prisma 7 (Notification, WorkspaceMember), Playwright, design system Axiom. Dépend des Phases 2 à 6 pour avoir un produit fonctionnel à consolider.

**Contrainte d'implémentation UI :** Team management, Settings, centre de notifications et pages d'erreur doivent être implémentés à partir des écrans correspondants exportés dans `axiom-design/` (Lot 2 — Team/Governance, Retention, Edge States).

## Hors-périmètre

- Billing/pricing, audit log complet, emails transactionnels — scope "Later", documenté mais non implémenté à ce stade.
- Notifications push navigateur natives.
