# 023 — Audit Log

> Doc d'entrée pour `specify.specify`. Scope "Later" — enterprise governance & security signal.

## Contexte / Objectif

Implémenter un journal d'audit complet des actions sensibles au niveau Workspace, permettant aux OWNER/ADMIN de tracer qui a fait quoi et quand — feature standard des outils SaaS enterprise (Linear, Notion, Jira) qui démontre la maturité sécurité et gouvernance du produit.

## User Stories

- En tant qu'OWNER/ADMIN, je consulte l'historique complet des actions sensibles de mon Workspace (suppression, changement de rôle, accès API, modifications critiques).
- En tant qu'OWNER, je filtre le journal par utilisateur, type d'action ou période.
- En tant qu'OWNER, j'exporte le journal d'audit en CSV pour une analyse externe ou un audit de sécurité.
- En tant qu'utilisateur, toutes mes actions sensibles sont tracées automatiquement sans action supplémentaire de ma part.

## Exigences fonctionnelles

- **FR-2301** — Créer une entité `AuditLog` en DB : `id`, `workspaceId`, `actorId` (User), `actorEmail`, `action` (enum), `targetType`, `targetId`, `targetLabel`, `metadata` (JSON), `ipAddress`, `userAgent`, `createdAt`.
- **FR-2302** — Actions auditées obligatoires :
  - Workspace : création, suppression, renommage
  - Membres : invitation envoyée, membre rejoint, rôle modifié, membre retiré
  - Boards : création, suppression
  - Tâches : suppression définitive
  - Auth : connexion réussie, connexion échouée, déconnexion
  - API Keys : création, révocation, utilisation via API publique
  - IA : suggestions appliquées (type + confidence)
  - Billing : upgrade, downgrade, annulation
- **FR-2303** — Page dédiée `/workspace/audit-log` accessible aux OWNER et ADMIN uniquement.
- **FR-2304** — Filtres sur la page : par utilisateur, par type d'action, par période (7j/30j/90j/custom).
- **FR-2305** — Pagination du journal (50 entrées par page).
- **FR-2306** — Export CSV du journal filtré.
- **FR-2307** — Rétention des logs : 90 jours sur le plan Pro, 365 jours sur le plan Team (cf. Feature 022 — Billing).
- **FR-2308** — Les entrées d'audit sont immuables — aucune API ni action UI ne permet de les modifier ou supprimer.

## Critères d'acceptation

- Chaque action listée en FR-2302 génère une entrée AuditLog vérifiable en DB immédiatement après l'action.
- Un MEMBER ne peut pas accéder à la page `/workspace/audit-log` (redirection 403 on-brand).
- Le filtre par utilisateur réduit correctement les entrées affichées.
- L'export CSV contient toutes les colonnes (date, acteur, action, cible, IP) et est correctement encodé (UTF-8).
- Aucune entrée d'audit ne peut être supprimée via un appel API direct.

## Dépendances techniques

Prisma 7 (entité `AuditLog` à ajouter au DATA-MODEL), Next.js Server Actions (middleware d'audit à appeler après chaque action sensible), librairie CSV export (`papaparse` ou équivalent). Dépend des Phases 2-8 pour les actions existantes à instrumenter, et de la Phase 022 (Billing) pour les limites de rétention par plan.

**Contrainte d'implémentation UI :** la page audit log doit être designée on-brand depuis zéro (pas d'écran Stitch existant) en respectant les tokens de `axiom-design/axiom/DESIGN.md` — tableau dense, filtre clair, ton factuel.

## Hors-périmètre

- Alertes en temps réel sur des patterns d'actions suspects (ex. détection d'anomalie) — logging passif uniquement.
- Audit log cross-workspace pour un super-admin (scope par workspace uniquement).
- Intégration SIEM externe (Splunk, Datadog) — export CSV suffit pour ce scope.
