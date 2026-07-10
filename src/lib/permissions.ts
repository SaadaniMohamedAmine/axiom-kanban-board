import { auth } from "./auth";
import { prisma } from "./prisma";
import { headers } from "next/headers";

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export class PermissionError extends Error {
  code: string;
  requiredRole: MemberRole;
  actualRole: MemberRole | null;

  constructor(requiredRole: MemberRole, actualRole: MemberRole | null) {
    super("Insufficient permissions");
    this.name = "PermissionError";
    this.code = "INSUFFICIENT_ROLE";
    this.requiredRole = requiredRole;
    this.actualRole = actualRole;
  }
}

export async function requireRole(
  workspaceId: string,
  minRole: MemberRole
): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new PermissionError(minRole, null);
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    throw new PermissionError(minRole, null);
  }

  const userRoleLevel = ROLE_HIERARCHY[membership.role];
  const requiredRoleLevel = ROLE_HIERARCHY[minRole];

  if (userRoleLevel < requiredRoleLevel) {
    throw new PermissionError(minRole, membership.role);
  }
}
