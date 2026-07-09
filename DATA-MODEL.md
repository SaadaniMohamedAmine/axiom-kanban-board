# Axiom — Data Model (v1, post-architecture decision)

> Mis à jour après le passage à Next.js + Better Auth + Pusher (remplace le draft initial Fastify/Socket.io/Clerk). Référence pour Prisma 7 schema et pour les specs Speckit.

## Entités Better Auth (standard, via Prisma Adapter)
- **User** — id, name, email, image, role par défaut (au niveau plateforme, pas workspace)
- **Account** — lié au provider OAuth (Google/GitHub) ou credentials
- **Session**
- **Verification** (non utilisée activement — pas de vérification email, mais requise par l'adapter Better Auth)

## Entités produit

**Workspace**
- id, name, slug, createdAt
- ownerId → User
- relation: members (WorkspaceMember[]), boards (Board[])

**WorkspaceMember** (table de jointure User ↔ Workspace)
- id, workspaceId, userId, role (`OWNER` | `ADMIN` | `MEMBER` | `VIEWER`), invitedAt, joinedAt

**Invitation**
- id, workspaceId, email, role, token, status (`PENDING` | `ACCEPTED` | `EXPIRED`), createdAt

**Board**
- id, workspaceId, name, template (`SCRUM` | `KANBAN` | `BUG_TRACKING` | `CUSTOM`), createdAt
- relation: columns (Column[]), sprints (Sprint[])

**Column**
- id, boardId, name, order, color

**Task**
- id, boardId, columnId, code (ex. `AX-4012`, auto-incrémenté par board), title, description (rich text), priority (`URGENT`|`HIGH`|`MEDIUM`|`LOW`), estimate (story points, nullable jusqu'à estimation IA/manuelle), dueDate, order (position dans la colonne)
- relations: assignees (TaskAssignee[]), labels (TaskLabel[]), comments (Comment[]), activity (ActivityEvent[]), aiLogs (AILog[])

**TaskAssignee** (jointure Task ↔ User)

**Label**
- id, boardId, name, color

**TaskLabel** (jointure Task ↔ Label)

**Comment**
- id, taskId, authorId, body, createdAt

**ActivityEvent**
- id, taskId, type (`STATUS_CHANGE`|`ASSIGNED`|`COMMENTED`|`AI_SUGGESTION_APPLIED`|...), payload (JSON), createdAt

**Sprint**
- id, boardId, name, startDate, endDate, status (`PLANNED`|`ACTIVE`|`COMPLETED`)

**AILog**
- id, taskId (nullable si suggestion au niveau board), type (`PRIORITIZE`|`ESTIMATE`|`DESCRIBE`|`DETECT_BLOCKER`|`ASSIGN`), input (JSON), output (JSON), confidence (float), feedback (`USEFUL`|`NOT_USEFUL`|null), createdAt

**Notification**
- id, userId, type, payload (JSON), readAt (nullable), createdAt

## Notes de cohérence
- Le `code` de Task (`AX-XXXX`) doit être généré côté serveur, incrémental par board, jamais par l'IA ni le front — évite les collisions vues dans le design (incohérence AX-/AS- corrigée).
- `role` est défini par Workspace (un même User peut être Owner d'un workspace et Viewer d'un autre) — pas un rôle global.
- AILog existe indépendamment de l'application de la suggestion — permet le feedback loop "👍/👎" prévu dans le scope produit.
