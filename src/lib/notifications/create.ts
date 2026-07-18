import { prisma } from "@/lib/prisma";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        payload: { title: params.title, message: params.message },
      },
    });
  } catch {
    // Never block the user's action on a notification-logging failure.
  }
}
