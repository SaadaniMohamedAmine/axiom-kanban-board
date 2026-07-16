"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
    data: { readAt: new Date() },
  });

  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.id !== userId) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/", "layout");
}

export interface NotificationPreferences {
  notify: Record<string, boolean>;
  quietHours: { enabled: boolean; start: string; end: string };
}

export async function updateNotificationPreferences(preferences: NotificationPreferences) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailPreferences: preferences as unknown as object },
  });

  revalidatePath("/", "layout");
}
