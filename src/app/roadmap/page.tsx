import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { ROADMAP, type RoadmapStatus } from "@/content/roadmap";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Where Axiom is headed. See what's shipped, what's in progress, and what's coming.",
  openGraph: {
    title: "Axiom Roadmap — Where we're headed",
    description: "See what's shipped, what's in progress, and what's coming to Axiom.",
  },
};

export default async function RoadmapPage() {
  const t = await getTranslations("roadmapPage");
  const tItems = await getTranslations("roadmapItems");
  const tColumns = await getTranslations("roadmapColumns");
  const locale = await getLocale();

  const STATUS_CONFIG: Record<
    RoadmapStatus,
    { label: string; dotClass: string; badgeClass: string }
  > = {
    shipped: {
      label: t("shipped"),
      dotClass: "bg-green-400",
      badgeClass: "bg-green-500/10 text-green-400 border-green-500/20",
    },
    "in-progress": {
      label: t("inProgress"),
      dotClass: "bg-[#22D3EE] animate-pulse",
      badgeClass: "bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/20",
    },
    planned: {
      label: t("planned"),
      dotClass: "bg-primary",
      badgeClass: "bg-primary/10 text-primary border-primary/20",
    },
    considering: {
      label: t("considering"),
      dotClass: "bg-on-surface-variant/40",
      badgeClass: "bg-surface-container-high text-on-surface-variant border-outline-variant/30",
    },
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <SiteNav currentLocale={locale as "fr" | "en"} />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-16">
        <div className="mb-16 max-w-2xl">
          <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            {t("eyebrow")}
          </div>
          <h1 className="text-4xl font-semibold text-on-surface tracking-tight mb-3">
            {t("title")}
          </h1>
          <p className="text-[15px] text-on-surface-variant leading-relaxed mb-3">
            {t("subtitle")}
          </p>
          <p className="text-[12px] text-on-surface-variant/50">{t("lastUpdated")}</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap mb-12">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
              <span className="text-[12px] text-on-surface-variant">{cfg.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROADMAP.map((col) => (
            <div key={col.id}>
              <div className="mb-5">
                <h2 className="text-[18px] font-semibold text-on-surface mb-1">
                  {tColumns(`${col.id}.label`)}
                </h2>
                <p className="text-[12px] text-on-surface-variant/60">
                  {tColumns(`${col.id}.description`)}
                </p>
              </div>

              <div className="space-y-3">
                {col.items.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border border-outline-variant/20 bg-surface-container transition-colors ${
                        item.status === "shipped" ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[14px] font-medium text-on-surface leading-snug">
                          {tItems(`${item.id}.title`)}
                        </h3>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badgeClass}`}
                        >
                          {item.status === "shipped" && item.date
                            ? item.date
                            : cfg.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant/70 leading-relaxed">
                        {tItems(`${item.id}.description`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
