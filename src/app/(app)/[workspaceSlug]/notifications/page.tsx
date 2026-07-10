import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notification.actions";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  task_assigned: "👤",
  comment_added: "💬",
  ai_suggestion: "◈",
  sprint_started: "▶",
  blocker_detected: "⚠",
};

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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-[13px] text-on-surface-variant/60 mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <form
            action={markAllNotificationsRead.bind(null, session.user.id)}
          >
            <button
              type="submit"
              className="text-[13px] text-primary hover:text-primary/80 transition-colors"
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
            <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20" className="text-on-surface-variant/40">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-[14px] text-on-surface-variant">Nothing here yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => {
            const payload = n.payload as { title?: string; message?: string };
            return (
              <form
                key={n.id}
                action={markNotificationRead.bind(null, n.id)}
              >
                <button
                  type="submit"
                  className={`w-full text-left flex items-start gap-3 p-4 rounded-xl transition-colors ${
                    n.readAt
                      ? "opacity-50 hover:opacity-70"
                      : "bg-primary/5 hover:bg-primary/8"
                  }`}
                >
                  <span className="text-[18px] shrink-0 mt-0.5">
                    {NOTIFICATION_ICONS[n.type] ?? "◆"}
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-medium text-on-surface">
                      {payload.title ?? n.type}
                    </p>
                    {payload.message && (
                      <p className="text-[12px] text-on-surface-variant/70 mt-0.5 truncate">
                        {payload.message}
                      </p>
                    )}
                    <p className="text-[11px] text-on-surface-variant/40 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.readAt && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
