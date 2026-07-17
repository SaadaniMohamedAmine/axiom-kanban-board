"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateAPIKey } from "@/lib/api/api-key";
import { createAuditLog } from "@/lib/audit/log";
import { z } from "zod";

async function requireWorkspaceAdmin(workspaceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    select: { role: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Forbidden: Admin role required");
  }

  return session;
}

export interface CreatedAPIKey {
  id: string;
  name: string;
  prefix: string;
  rawKey: string;
  createdAt: Date;
}

export async function createAPIKey(
  workspaceId: string,
  name: string
): Promise<CreatedAPIKey> {
  const session = await requireWorkspaceAdmin(workspaceId);

  const nameResult = z.string().min(1).max(100).safeParse(name);
  if (!nameResult.success) throw new Error("Invalid name");

  const { raw, hash, prefix } = generateAPIKey();

  const apiKey = await prisma.aPIKey.create({
    data: { workspaceId, name, keyHash: hash, prefix },
    select: { id: true, name: true, prefix: true, createdAt: true },
  });

  void createAuditLog({
    workspaceId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "API_KEY_CREATED",
    targetType: "apiKey",
    targetId: apiKey.id,
    targetLabel: apiKey.name,
  });

  revalidatePath(`/[workspaceSlug]/settings`, "page");

  return { ...apiKey, rawKey: raw };
}

export async function revokeAPIKey(workspaceId: string, keyId: string): Promise<void> {
  const session = await requireWorkspaceAdmin(workspaceId);

  const apiKey = await prisma.aPIKey.update({
    where: { id: keyId, workspaceId },
    data: { revokedAt: new Date() },
    select: { name: true },
  });

  void createAuditLog({
    workspaceId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "API_KEY_REVOKED",
    targetType: "apiKey",
    targetId: keyId,
    targetLabel: apiKey.name,
  });

  revalidatePath(`/[workspaceSlug]/settings`, "page");
}
