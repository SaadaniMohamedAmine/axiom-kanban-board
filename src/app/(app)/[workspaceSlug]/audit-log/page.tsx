import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { AuditAction } from "@prisma/client";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{
    page?: string;
    actor?: string;
    action?: string;
    days?: string;
  }>;
}

const PER_PAGE = 50;

function sinceDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const ACTION_KEYS: AuditAction[] = [
  "WORKSPACE_CREATED", "WORKSPACE_RENAMED", "WORKSPACE_DELETED",
  "MEMBER_INVITED", "MEMBER_JOINED", "MEMBER_ROLE_CHANGED", "MEMBER_REMOVED",
  "BOARD_CREATED", "BOARD_DELETED", "TASK_DELETED",
  "AUTH_LOGIN", "AUTH_LOGIN_FAILED", "AUTH_LOGOUT",
  "API_KEY_CREATED", "API_KEY_REVOKED", "API_KEY_USED",
  "AI_SUGGESTION_APPLIED", "BILLING_UPGRADED", "BILLING_DOWNGRADED", "BILLING_CANCELLED",
];

export default async function AuditLogPage({ params, searchParams }: Props) {
  const { workspaceSlug } = await params;
  const { page: pageStr, actor, action, days: daysStr } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const t = await getTranslations("auditLogPage");
  const tActions = await getTranslations("auditActions");
  const locale = await getLocale();

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
    select: { id: true, name: true, plan: true },
  });

  if (!workspace) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <h1 className="text-xl font-semibold text-on-surface mb-2">{t("accessRestricted")}</h1>
        <p className="text-[14px] text-on-surface-variant">
          {t("ownersOnly")}
        </p>
      </div>
    );
  }

  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const days = parseInt(daysStr ?? "30", 10);
  const where = {
    workspaceId: workspace.id,
    createdAt: { gte: sinceDate(days) },
    ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" as const } } : {}),
    ...(action ? { action: action as AuditAction } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        actorEmail: true,
        action: true,
        targetType: true,
        targetLabel: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const exportParams = new URLSearchParams({ days: days.toString(), ...(actor ? { actor } : {}), ...(action ? { action } : {}) });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
            {workspace.name}
          </div>
          <h1 className="text-2xl font-semibold text-on-surface">{t("title")}</h1>
          <p className="text-[13px] text-on-surface-variant mt-1">
            {total} {t("eventsInLast")} {days} {t("days")}
          </p>
        </div>
        <a
          href={`/api/audit-log/export?workspaceId=${workspace.id}&${exportParams.toString()}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/20 bg-surface-container text-[13px] text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="13">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          {t("exportCsv")}
        </a>
      </div>

      <form className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          name="days"
          defaultValue={days}
          className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-surface-container text-[13px] text-on-surface outline-none"
        >
          <option value="7">{t("last7Days")}</option>
          <option value="30">{t("last30Days")}</option>
          <option value="90">{t("last90Days")}</option>
        </select>
        <input
          type="text"
          name="actor"
          defaultValue={actor}
          placeholder={t("filterByEmail")}
          className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-surface-container text-[13px] text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/50 w-52"
        />
        <select
          name="action"
          defaultValue={action}
          className="px-3 py-2 rounded-lg border border-outline-variant/20 bg-surface-container text-[13px] text-on-surface outline-none"
        >
          <option value="">{t("allActions")}</option>
          {ACTION_KEYS.map((value) => (
            <option key={value} value={value}>{tActions(value)}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:brightness-110 transition-all"
        >
          {t("filter")}
        </button>
        {(actor || action) && (
          <a href="?" className="text-[13px] text-on-surface-variant/60 hover:text-on-surface transition-colors">
            {t("clear")}
          </a>
        )}
      </form>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-[14px] text-on-surface-variant/50">
          {t("noEvents")}
        </div>
      ) : (
        <div className="rounded-xl border border-outline-variant/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-high">
              <tr>
                {[t("colDate"), t("colActor"), t("colAction"), t("colTarget")].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-high/30 transition-colors">
                  <td className="px-4 py-3 text-[12px] font-mono text-on-surface-variant whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-on-surface max-w-[180px] truncate">
                    {log.actorEmail}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded bg-surface-container-highest text-[11px] font-mono text-on-surface-variant">
                      {tActions(log.action) ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-on-surface-variant max-w-[200px] truncate">
                    {log.targetLabel ?? log.targetType ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-[12px] text-on-surface-variant/50">
            {t("page")} {page} {t("of")} {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a href={`?page=${page - 1}&days=${days}${actor ? `&actor=${actor}` : ""}${action ? `&action=${action}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/20 text-[12px] text-on-surface hover:bg-surface-container transition-colors">
                {t("previous")}
              </a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}&days=${days}${actor ? `&actor=${actor}` : ""}${action ? `&action=${action}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/20 text-[12px] text-on-surface hover:bg-surface-container transition-colors">
                {t("next")}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
