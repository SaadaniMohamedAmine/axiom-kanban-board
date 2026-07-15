import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { markAllNotificationsRead } from "@/lib/actions/notification.actions";
import { NotificationList } from "@/components/layout/notification-list";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function NotificationsPage({ params }: Props) {
  await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const t = await getTranslations("settings");
  const tNav = await getTranslations("nav");
  const locale = (await getLocale()) as "fr" | "en";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">{tNav("notifications")}</h1>
          {unreadCount > 0 && (
            <p className="text-[13px] text-on-surface-variant/60 mt-1">
              {unreadCount} {t("unread")}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead.bind(null, session.user.id)}>
            <button type="submit" className="text-[13px] text-primary hover:text-primary/80 transition-colors">
              {t("markAllRead")}
            </button>
          </form>
        )}
      </div>

      <NotificationList notifications={notifications} locale={locale} nothingHereYet={t("nothingHereYet")} />
    </div>
  );
}
