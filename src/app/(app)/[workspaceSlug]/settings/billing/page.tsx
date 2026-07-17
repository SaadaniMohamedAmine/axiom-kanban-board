import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getPlanLimits, PLAN_PRICES } from "@/lib/billing/plan-limits";
import { listRecentInvoices } from "@/lib/billing/stripe";
import { UpgradeCheckoutButton } from "@/components/marketing/upgrade-checkout-button";
import { DownloadAllInvoicesButton } from "@/components/billing/download-all-invoices-button";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ success?: string }>;
}

interface PlanContent {
  name: string;
  features: string[];
}

const PLAN_LABEL_KEY = { FREE: "freePlan", PRO: "proPlan", TEAM: "teamPlan" } as const;
const PLAN_INDEX = { FREE: 0, PRO: 1, TEAM: 2 } as const;

const STATUS_LABEL_KEY = {
  paid: "statusPaid",
  open: "statusOpen",
  void: "statusVoid",
  uncollectible: "statusUncollectible",
} as const;

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-primary/10 text-primary",
  open: "bg-amber-500/10 text-amber-400",
  void: "bg-on-surface-variant/10 text-on-surface-variant",
  uncollectible: "bg-error/10 text-error",
};

export default async function BillingPage({ params, searchParams }: Props) {
  const { workspaceSlug } = await params;
  const { success } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    select: {
      id: true,
      name: true,
      plan: true,
      planExpiresAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      _count: { select: { members: true } },
    },
  });

  if (!workspace) redirect("/");

  const locale = await getLocale();
  const t = await getTranslations("billing");
  const tPricing = await getTranslations("pricing");

  const limits = getPlanLimits(workspace.plan);
  const plans = tPricing.raw("plans") as PlanContent[];
  // Every tier above the current one gets its own card — a FREE workspace
  // sees Pro *and* Team side by side instead of having to upgrade in
  // lockstep through Pro first.
  const upgradeTargets = (["PRO", "TEAM"] as const).filter(
    (plan) => PLAN_INDEX[plan] > PLAN_INDEX[workspace.plan]
  );

  const invoices = workspace.stripeCustomerId
    ? await listRecentInvoices(workspace.stripeCustomerId)
    : [];

  const memberPct = Number.isFinite(limits.maxMembers)
    ? Math.min(100, Math.round((workspace._count.members / limits.maxMembers) * 100))
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
        <div>
          <h1 className="text-h1 text-on-surface mb-2">{t("title")}</h1>
          {workspace.planExpiresAt && workspace.plan !== "FREE" && (
            <p className="text-body-md text-on-surface-variant">
              {t("nextInvoiceScheduled", { date: workspace.planExpiresAt.toLocaleDateString(locale) })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {invoices.length > 0 && (
            <DownloadAllInvoicesButton
              pdfUrls={invoices.filter((i) => i.pdfUrl).map((i) => i.pdfUrl!)}
              label={t("downloadAllReceipts")}
            />
          )}
          {workspace.stripeSubscriptionId && (
            <a
              href={`/api/billing/portal-redirect?workspaceId=${workspace.id}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-outline-variant hover:border-primary transition-colors hover:bg-primary/5 text-[13px] text-on-surface shrink-0"
            >
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" />
              </svg>
              {t("manageBilling")}
            </a>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-8 p-4 rounded-xl border border-green-500/30 bg-green-500/5 text-[13px] text-green-400">
          {t("subscriptionActivated", { plan: t(PLAN_LABEL_KEY[workspace.plan]) })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="md:col-span-2 gradient-border rounded-2xl relative overflow-hidden">
          <svg className="absolute top-4 right-4 text-primary/6 pointer-events-none" fill="none" height="120" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" viewBox="0 0 24 24" width="120">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <div className="relative p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[12px] font-medium">
                {t("currentPlan")}
              </span>
              <h2 className="text-h2 text-on-surface">{t(PLAN_LABEL_KEY[workspace.plan])}</h2>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">{t("billingPeriod")}</p>
                <p className="text-body-lg text-on-surface font-medium">
                  {workspace.plan === "FREE" ? "—" : t("monthly")}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mb-1">{t("nextCharge")}</p>
                <p className="text-body-lg text-on-surface font-medium">
                  ${PLAN_PRICES[workspace.plan]}.00 USD
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[12px] text-on-surface-variant">{t("membersUsage")}</p>
                <p className="text-[12px] text-on-surface font-medium">
                  {workspace._count.members}
                  {Number.isFinite(limits.maxMembers) && ` / ${limits.maxMembers}`}
                </p>
              </div>
              {Number.isFinite(limits.maxMembers) && (
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${memberPct}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {upgradeTargets.length > 0 ? (
          <div className="flex flex-col gap-6">
            {upgradeTargets.map((plan) => {
              const content = plans[PLAN_INDEX[plan]];
              return (
                <div key={plan} className="rounded-2xl border border-outline-variant/20 bg-surface-container p-8 flex flex-col justify-between flex-1">
                  <div>
                    <p className="text-h3 text-on-surface mb-3 leading-snug">
                      {t("upgradeTo", { plan: content.name })}
                    </p>
                    <ul className="space-y-1.5 mb-6">
                      {content.features.slice(0, 4).map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-[13px] text-on-surface-variant">
                          <svg className="text-primary mt-0.5 shrink-0" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <UpgradeCheckoutButton
                    workspaceId={workspace.id}
                    plan={plan}
                    label={t("upgradeTo", { plan: content.name })}
                    processingLabel={t("processing")}
                    className="w-full py-3 rounded-xl bg-primary text-on-primary text-[13px] font-semibold hover:brightness-110 transition-all"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="gradient-border rounded-2xl">
            <div className="p-8 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="text-primary" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                  </svg>
                </div>
                <p className="text-h3 text-on-surface mb-3 leading-snug">{t("scaleTitle")}</p>
                <p className="text-[13px] text-on-surface-variant">{t("scaleDesc")}</p>
              </div>
              <a
                href="mailto:sales@axiom.app"
                className="mt-6 w-full py-3 rounded-xl bg-surface-container-high text-on-surface text-[13px] font-semibold hover:bg-primary hover:text-on-primary transition-all text-center"
              >
                {t("contactSales")}
              </a>
            </div>
          </div>
        )}
      </div>

      <section>
        <h3 className="text-h3 text-on-surface mb-6">{t("invoiceHistory")}</h3>

        {!workspace.stripeCustomerId ? (
          <div className="rounded-xl border border-dashed border-outline-variant/40 p-8 text-center text-[13px] text-on-surface-variant">
            {t("noStripeAccount")}
          </div>
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-outline-variant/40 p-8 text-center text-[13px] text-on-surface-variant">
            {t("noInvoicesYet")}
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high/50 border-b border-outline-variant/30">
                  <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("colDate")}</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("colAmount")}</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{t("colStatus")}</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider text-right">{t("colInvoice")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-5 font-mono text-[13px] text-on-surface">
                      {invoice.date.toLocaleDateString(locale)}
                    </td>
                    <td className="px-6 py-5 text-[13px] text-on-surface">
                      ${invoice.amount.toFixed(2)} {invoice.currency}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[invoice.status] ?? STATUS_STYLE.open}`}>
                        {t(STATUS_LABEL_KEY[invoice.status as keyof typeof STATUS_LABEL_KEY] ?? "statusOpen")}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-on-surface-variant/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
