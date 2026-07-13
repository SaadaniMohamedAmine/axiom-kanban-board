"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

export async function requestWorkspaceAccess(workspaceId: string, resourceLabel: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const owners = await prisma.workspaceMember.findMany({
    where: { workspaceId, role: "OWNER" },
    select: { userId: true },
  });

  if (owners.length === 0) return;

  const t = await getTranslations("accessRestricted.notification");
  const title = t("title");
  const message = t("message", { name: session.user.name, resource: resourceLabel });

  await prisma.notification.createMany({
    data: owners.map((owner) => ({
      userId: owner.userId,
      type: "access_requested",
      payload: { title, message },
    })),
  });
}
