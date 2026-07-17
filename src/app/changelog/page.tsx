import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getAllChangelogEntries } from "@/lib/changelog";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { JsonLd } from "@/components/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban-board.vercel.app";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Latest updates and improvements to Axiom.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "Axiom Changelog",
    description: "Latest updates and improvements to Axiom.",
  },
};

export default async function ChangelogPage() {
  const entries = await getAllChangelogEntries();
  const t = await getTranslations("changelog");
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {entries.map((entry) => (
        <JsonLd
          key={entry.slug}
          data={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: entry.title,
            datePublished: entry.date,
            url: `${APP_URL}/changelog#v${entry.version}`,
            author: { "@type": "Organization", name: "Axiom" },
          }}
        />
      ))}
      <SiteNav currentLocale={locale as "fr" | "en"} />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-16">
        <div className="mb-16">
          <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            {t("eyebrow")}
          </div>
          <h1 className="text-4xl font-semibold text-on-surface tracking-tight mb-3">
            {t("title")}
          </h1>
          <p className="text-[15px] text-on-surface-variant">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-[7px] top-0 bottom-0 w-px bg-outline-variant/30 hidden md:block" />

          <div className="space-y-16">
            {entries.map((entry, index) => (
              <div key={entry.slug} id={`v${entry.version}`} className="md:pl-8 relative scroll-mt-24">
                <div className="absolute left-0 top-2 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background hidden md:block" />

                <div className="flex items-center gap-3 flex-wrap mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-semibold border border-primary/20">
                    v{entry.version}
                  </span>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-[11px] font-semibold border border-green-500/20">
                      {t("latest")}
                    </span>
                  )}
                  <span className="text-[13px] text-on-surface-variant">
                    {new Date(entry.date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold text-on-surface mb-6">
                  {entry.title}
                </h2>

                <div
                  className="prose-axiom"
                  dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
