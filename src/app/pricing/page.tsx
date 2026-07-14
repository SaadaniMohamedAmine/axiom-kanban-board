import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { MotionCta } from "@/components/marketing/motion-cta";
import { UpgradeCheckoutButton } from "@/components/marketing/upgrade-checkout-button";

export const metadata: Metadata = {
  title: "Pricing — Axiom",
  description: "Simple, transparent pricing for elite engineering teams.",
};

const PLAN_META = [
  { price: "$0", period: null, highlighted: false, checkoutPlan: null },
  { price: "$12", period: "/month", highlighted: true, checkoutPlan: "PRO" as const },
  { price: "$29", period: "/month", highlighted: false, checkoutPlan: "TEAM" as const },
];

interface PlanContent {
  name: string;
  description: string;
  cta: string;
  features: string[];
  limits: string[];
}

interface ComparisonRow {
  label: string;
  free: string;
  pro: string;
  team: string;
}

interface FaqItem {
  q: string;
  a: string;
}

export default async function PricingPage() {
  const locale = await getLocale();
  const t = await getTranslations("pricing");
  const plans = t.raw("plans") as PlanContent[];
  const comparisonRows = t.raw("comparisonRows") as ComparisonRow[];
  const faq = t.raw("faq") as FaqItem[];

  const session = await auth.api.getSession({ headers: await headers() });
  let billingWorkspaceId: string | null = null;

  if (session) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } },
      select: { workspaceId: true },
    });
    billingWorkspaceId = membership?.workspaceId ?? null;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <SiteNav currentLocale={locale as "fr" | "en"} />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant/30 bg-surface-container mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
              {t("badge")}
            </span>
          </div>
          <h1 className="text-[40px] md:text-5xl font-semibold text-on-surface tracking-tight mb-4 leading-[1.1]">
            {t("titleLine1")} <span className="text-primary">{t("titleHighlight")}</span>
          </h1>
          <p className="text-[17px] text-on-surface-variant max-w-lg mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {plans.map((plan, i) => {
            const meta = PLAN_META[i];
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col bg-surface-container/80 backdrop-blur-sm transition-all ${
                  meta.highlighted
                    ? "border-primary/40 shadow-[0_0_40px_-10px_rgba(59,130,246,0.35)]"
                    : "border-outline-variant/20 hover:border-outline-variant/40"
                }`}
              >
                {meta.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="px-3 py-1 bg-primary text-white rounded-full text-[11px] font-semibold tracking-wide">
                      {t("mostPopular")}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-[13px] font-semibold text-on-surface-variant/60 mb-1">
                    {plan.name}
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-semibold text-on-surface">{meta.price}</span>
                    <span className="text-[13px] text-on-surface-variant/50 mb-1">
                      {meta.period ?? t("forever")}
                    </span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="flex-1 space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <svg className="text-green-400 mt-0.5 shrink-0" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="13">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-[13px] text-on-surface-variant">{f}</span>
                    </div>
                  ))}
                  {plan.limits.map((l) => (
                    <div key={l} className="flex items-start gap-2.5">
                      <svg className="text-on-surface-variant/30 mt-0.5 shrink-0" fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="13">
                        <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
                      </svg>
                      <span className="text-[13px] text-on-surface-variant/40">{l}</span>
                    </div>
                  ))}
                </div>

                {meta.checkoutPlan && billingWorkspaceId ? (
                  <UpgradeCheckoutButton
                    workspaceId={billingWorkspaceId}
                    plan={meta.checkoutPlan}
                    label={plan.cta}
                    processingLabel={t("processing")}
                    className={`text-center py-3 rounded-xl text-[14px] font-semibold ${
                      meta.highlighted
                        ? "bg-primary text-white hover:brightness-110"
                        : "bg-surface-container-high text-on-surface border border-outline-variant/30 hover:bg-surface-container-highest"
                    }`}
                  />
                ) : (
                  <MotionCta
                    href={meta.checkoutPlan ? (session ? "/" : "/sign-up") : "/sign-up"}
                    className={`block text-center py-3 rounded-xl text-[14px] font-semibold transition-all ${
                      meta.highlighted
                        ? "bg-primary text-white hover:brightness-110"
                        : "bg-surface-container-high text-on-surface border border-outline-variant/30 hover:bg-surface-container-highest"
                    }`}
                  >
                    {plan.cta}
                  </MotionCta>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="max-w-4xl mx-auto mb-24">
          <h2 className="text-2xl font-semibold text-on-surface text-center mb-10">
            {t("comparisonTitle")}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 bg-surface-container/60 backdrop-blur-sm">
            <table className="w-full text-left border-collapse min-w-[480px]">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="p-5 text-[13px] font-semibold text-on-surface">{t("comparisonFeature")}</th>
                  <th className="p-5 text-[13px] font-semibold text-on-surface-variant">{plans[0].name}</th>
                  <th className="p-5 text-[13px] font-semibold text-primary">{plans[1].name}</th>
                  <th className="p-5 text-[13px] font-semibold text-on-surface-variant">{plans[2].name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {comparisonRows.map((row) => (
                  <tr key={row.label}>
                    <td className="p-5 text-[13px] text-on-surface font-medium">{row.label}</td>
                    <td className="p-5 text-[13px] text-on-surface-variant">{row.free}</td>
                    <td className="p-5 text-[13px] text-on-surface">{row.pro}</td>
                    <td className="p-5 text-[13px] text-on-surface">{row.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-on-surface mb-6 text-center">{t("questionsTitle")}</h2>
          {faq.map((item) => (
            <div key={item.q} className="border-b border-outline-variant/20 py-5">
              <div className="text-[14px] font-medium text-on-surface mb-2">{item.q}</div>
              <div className="text-[13px] text-on-surface-variant leading-relaxed">{item.a}</div>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
