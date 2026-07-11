"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "crypto";

const WEBHOOK_EVENTS = [
  "task.created",
  "task.updated",
  "task.deleted",
  "sprint.completed",
  "ai.suggestion.applied",
] as const;

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

async function requireWorkspaceAdmin(workspaceId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    select: { role: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new Error("Forbidden");
  }
}

export async function createWebhook(
  workspaceId: string,
  input: { url: string; events: string[] }
): Promise<{ secret: string }> {
  await requireWorkspaceAdmin(workspaceId);

  const parsed = createWebhookSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const secret = crypto.randomBytes(32).toString("hex");

  await prisma.webhookConfig.create({
    data: {
      workspaceId,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
    },
  });

  revalidatePath(`/[workspaceSlug]/settings/developers`, "page");

  return { secret };
}

export async function deleteWebhook(workspaceId: string, webhookId: string): Promise<void> {
  await requireWorkspaceAdmin(workspaceId);

  await prisma.webhookConfig.delete({
    where: { id: webhookId, workspaceId },
  });

  revalidatePath(`/[workspaceSlug]/settings/developers`, "page");
}
