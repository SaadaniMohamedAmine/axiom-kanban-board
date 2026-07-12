import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROADMAP, type RoadmapStatus } from "@/content/roadmap";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Where Axiom is headed. See what's shipped, what's in progress, and what's coming.",
  openGraph: {
    title: "Axiom Roadmap — Where we're headed",
    description: "See what's shipped, what's in progress, and what's coming to Axiom.",
  },
};

export const dynamic = "force-static";

export default async function RoadmapPage() {
  const t = await getTranslations("roadmapPage");

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
      <nav className="border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5">
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Axiom
          </Link>
          <span className="text-on-surface-variant/30">/</span>
          <span className="text-[13px] text-on-surface">{t("breadcrumb")}</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-16 max-w-2xl">
          <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            {t("eyebrow")}
          </div>
          <h1 className="text-4xl font-semibold text-on-surface tracking-tight mb-3">
            {t("title")}
          </h1>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">
            {t("subtitle")}
          </p>
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
                <h2 className="text-[18px] font-semibold text-on-surface mb-1">{col.label}</h2>
                <p className="text-[12px] text-on-surface-variant/60">{col.description}</p>
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
                          {item.title}
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
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-outline-variant/20 mt-16 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[12px] text-on-surface-variant/50">
          <span>{t("lastUpdated")}</span>
          <div className="flex items-center gap-6">
            <Link href="/changelog" className="hover:text-on-surface-variant transition-colors">{t("breadcrumb")}</Link>
            <Link href="/" className="hover:text-on-surface-variant transition-colors">{t("backToAxiom")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
