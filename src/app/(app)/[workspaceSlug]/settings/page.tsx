import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsSectionNav } from "@/components/settings/settings-section-nav";
import { AccountSettingsForm } from "@/components/workspace/account-settings-form";
import { MemberList } from "@/components/workspace/member-list";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { AccessRestricted } from "@/components/layout/access-restricted";
import { APIKeyManager } from "@/components/settings/api-key-manager";
import { WebhookManager } from "@/components/settings/webhook-manager";
import { NotificationIcon, notificationBadgeClass } from "@/components/layout/notification-icon";
import { timeAgo } from "@/lib/time-ago";
import { markAllNotificationsRead } from "@/lib/actions/notification.actions";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "50", 10);

const ICONS = {
  account: (
    <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  members: (
    <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  workspace: (
    <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
      <rect height="7" width="7" x="3" y="3" />
      <rect height="7" width="7" x="14" y="3" />
      <rect height="7" width="7" x="14" y="14" />
      <rect height="7" width="7" x="3" y="14" />
    </svg>
  ),
  notifications: (
    <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  aiQuota: (
    <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  ),
  developers: (
    <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

export default async function SettingsPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: { include: { user: { select: { name: true, email: true } } } },
      invitations: true,
      apiKeys: {
        where: { revokedAt: null },
        select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
        orderBy: { createdAt: "desc" },
      },
      webhookConfigs: {
        where: { active: true },
        select: { id: true, url: true, events: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) notFound();

  const currentMember = workspace.members.find((m) => m.userId === session.user.id);
  const currentRole = currentMember?.role ?? "VIEWER";
  const canEditWorkspace = currentRole === "OWNER";
  const canManageDevelopers = currentRole === "OWNER" || currentRole === "ADMIN";

  const credentialAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "credential" },
    select: { updatedAt: true },
  });
  const now = new Date();
  const passwordAgeDays = credentialAccount
    ? Math.floor((now.getTime() - credentialAccount.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  const used = workspace.aiRequestsToday;
  const pct = Math.min(100, Math.round((used / AI_DAILY_LIMIT) * 100));
  const resetAt = workspace.aiRequestsResetAt ?? new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const hoursUntilReset = Math.max(0, Math.floor((resetAt.getTime() - now.getTime()) / 1000 / 60 / 60));
  const statusColor = pct >= 90 ? "text-red-400" : pct >= 70 ? "text-yellow-400" : "text-green-400";
  const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-primary";

  const t = await getTranslations("settings");
  const tNav = await getTranslations("nav");
  const tAi = await getTranslations("ai");
  const tAccess = await getTranslations("accessRestricted");

  const NAV_ITEMS = [
    { id: "account", label: t("account") },
    { id: "members", label: t("members") },
    { id: "workspace", label: t("workspace") },
    { id: "notifications", label: t("notifications") },
    { id: "ai-quota", label: tNav("aiQuota") },
    { id: "developers", label: t("developers") },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <SettingsPageHeader eyebrow={workspace.name} title={t("title")} />

      <SettingsSectionNav items={NAV_ITEMS} />

      <div className="space-y-16">
        <SettingsSection id="account" icon={ICONS.account} title={t("account")} description={t("accountDesc")}>
          <AccountSettingsForm
            name={session.user.name}
            email={session.user.email}
            hasPassword={!!credentialAccount}
            passwordAgeDays={passwordAgeDays}
          />
        </SettingsSection>

        <SettingsSection id="members" icon={ICONS.members} title={t("members")} description={t("membersDesc")}>
          <MemberList
            workspaceId={workspace.id}
            members={workspace.members}
            invitations={workspace.invitations}
            currentUserId={session.user.id}
            currentUserRole={currentRole}
          />
        </SettingsSection>

        <SettingsSection id="workspace" icon={ICONS.workspace} title={t("workspace")} description={t("workspaceDesc")}>
          {canEditWorkspace ? (
            <WorkspaceSettingsForm
              workspaceId={workspace.id}
              name={workspace.name}
              slug={workspace.slug}
              canEdit={canEditWorkspace}
            />
          ) : (
            <AccessRestricted
              workspaceId={workspace.id}
              resourceLabel={`${t("workspace")} — ${workspace.name}`}
              backHref={`/${workspace.slug}`}
              labels={{
                title: tAccess("title"),
                description: tAccess("description"),
                roleBadge: tAccess("roleBadge", { role: currentRole }),
                requestAccess: tAccess("requestAccess"),
                requesting: tAccess("requesting"),
                requestSent: tAccess("requestSent"),
                backToDashboard: tAccess("backToDashboard"),
                statusCode: tAccess("statusCode"),
              }}
            />
          )}
        </SettingsSection>

        <SettingsSection id="notifications" icon={ICONS.notifications} title={t("notifications")} description={t("notificationsDesc")}>
          <div className="gradient-border">
            <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
              <span className="text-[13px] text-on-surface-variant">
                {unreadCount > 0 ? `${unreadCount} ${t("unread")}` : t("nothingHereYet")}
              </span>
              {unreadCount > 0 && (
                <form action={markAllNotificationsRead.bind(null, session.user.id)}>
                  <button type="submit" className="text-[12px] text-primary hover:underline cursor-pointer">
                    {t("markAllRead")}
                  </button>
                </form>
              )}
            </div>
            {notifications.length > 0 && (
              <div>
                {notifications.map((n) => {
                  const payload = n.payload as { title?: string; message?: string };
                  return (
                    <div key={n.id} className={`flex gap-3 p-4 border-b border-outline-variant/10 last:border-b-0 ${n.readAt ? "opacity-60" : ""}`}>
                      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${notificationBadgeClass(n.type)}`}>
                        <NotificationIcon type={n.type} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium text-on-surface leading-snug">{payload.title ?? n.type}</p>
                          <span className="text-[10px] text-on-surface-variant/50 whitespace-nowrap shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        {payload.message && <p className="text-[12px] text-on-surface-variant/70 line-clamp-2">{payload.message}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="p-3 bg-surface-container-lowest/50 text-center rounded-b-xl">
              <Link href={`/${workspace.slug}/notifications`} className="text-[12px] text-on-surface-variant hover:text-on-surface transition-colors">
                {t("seeAllActivity")}
              </Link>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          id="ai-quota"
          icon={ICONS.aiQuota}
          tone="ai"
          title={tNav("aiQuota")}
          description={<>{tAi("quotaPageDesc")} <strong className="text-on-surface">{workspace.name}</strong>.</>}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="gradient-border">
              <div className="p-6">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
                      {tAi("todaysUsage")}
                    </div>
                    <div className={`text-4xl font-semibold ${statusColor}`}>
                      {used}
                      <span className="text-xl text-on-surface-variant font-normal"> / {AI_DAILY_LIMIT}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] text-on-surface-variant/60">{tAi("resetsIn")}</div>
                    <div className="text-[14px] font-medium text-on-surface">{hoursUntilReset}h</div>
                  </div>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-on-surface-variant/50">
                  <span>{pct}{tAi("pctUsed")}</span>
                  <span>{AI_DAILY_LIMIT - used} {tAi("remainingLabel")}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-5 h-full">
              <div className="flex items-start gap-3">
                <svg className="text-on-surface-variant/40 mt-0.5 shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
                <div className="space-y-2 text-[13px] text-on-surface-variant">
                  <p>{tAi("infoLine1")}</p>
                  <p>{tAi("infoLine2")}</p>
                  <p>{tAi("infoLine3")}</p>
                </div>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          id="developers"
          icon={ICONS.developers}
          title={t("developers")}
          description={<>{t("developersPageDesc")} <strong className="text-on-surface">{workspace.name}</strong>.</>}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-[13px]">
              <svg className="text-primary shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-on-surface-variant">
                <a href="/docs/api" target="_blank" className="text-primary hover:underline font-medium">
                  {t("viewApiReference")}
                </a>
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="p-5 rounded-xl border border-outline-variant/20 bg-surface-container/40">
                <APIKeyManager workspaceId={workspace.id} workspaceSlug={workspaceSlug} apiKeys={workspace.apiKeys} canManage={canManageDevelopers} />
              </div>
              <div className="p-5 rounded-xl border border-outline-variant/20 bg-surface-container/40">
                <WebhookManager workspaceId={workspace.id} workspaceSlug={workspaceSlug} webhooks={workspace.webhookConfigs} canManage={canManageDevelopers} />
              </div>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
