import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT ?? "50", 10);

export default async function AIQuotaPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    select: { id: true, name: true, aiRequestsToday: true, aiRequestsResetAt: true },
  });

  if (!workspace) redirect("/");

  const used = workspace.aiRequestsToday;
  const pct = Math.min(100, Math.round((used / AI_DAILY_LIMIT) * 100));

  const now = new Date();
  const resetAt = workspace.aiRequestsResetAt ?? new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const hoursUntilReset = Math.max(
    0,
    Math.floor((resetAt.getTime() - now.getTime()) / 1000 / 60 / 60)
  );

  const statusColor =
    pct >= 90
      ? "text-red-400"
      : pct >= 70
      ? "text-yellow-400"
      : "text-green-400";

  const barColor =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
      ? "bg-yellow-500"
      : "bg-primary";

  const t = await getTranslations("ai");
  const tSettings = await getTranslations("settings");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          {tSettings("title")}
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">{t("quotaPageTitle")}</h1>
        <p className="text-[14px] text-on-surface-variant mt-1">
          {t("quotaPageDesc")} <strong className="text-on-surface">{workspace.name}</strong>.
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container p-6 mb-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
              {t("todaysUsage")}
            </div>
            <div className={`text-4xl font-semibold ${statusColor}`}>
              {used}
              <span className="text-xl text-on-surface-variant font-normal">
                {" "}/ {AI_DAILY_LIMIT}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-on-surface-variant/60">{t("resetsIn")}</div>
            <div className="text-[14px] font-medium text-on-surface">
              {hoursUntilReset}h
            </div>
          </div>
        </div>

        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-on-surface-variant/50">
          <span>{pct}{t("pctUsed")}</span>
          <span>{AI_DAILY_LIMIT - used} {t("remainingLabel")}</span>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <svg className="text-on-surface-variant/40 mt-0.5 shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <div className="space-y-2 text-[13px] text-on-surface-variant">
            <p>{t("infoLine1")}</p>
            <p>{t("infoLine2")}</p>
            <p>
              {t("infoLine3")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
