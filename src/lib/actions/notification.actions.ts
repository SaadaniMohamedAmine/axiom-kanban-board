"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createNotification } from "@/lib/notifications/create";

export async function notifyLogin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const t = await getTranslations("notificationMessages");
  void createNotification({
    userId: session.user.id,
    type: "welcome_back",
    title: t("welcome_back.title"),
    message: t("welcome_back.message", { name: session.user.name }),
  });
}

export async function notifyNameChanged(newName: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const t = await getTranslations("notificationMessages");
  void createNotification({
    userId: session.user.id,
    type: "name_changed",
    title: t("name_changed.title"),
    message: t("name_changed.message", { name: newName }),
  });
}

export async function notifyPasswordChanged() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;

  const t = await getTranslations("notificationMessages");
  void createNotification({
    userId: session.user.id,
    type: "password_changed",
    title: t("password_changed.title"),
    message: t("password_changed.message", { email: session.user.email }),
  });
}

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
