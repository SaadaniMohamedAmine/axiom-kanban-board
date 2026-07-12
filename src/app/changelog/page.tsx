import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getAllChangelogEntries } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Latest updates and improvements to Axiom.",
  openGraph: {
    title: "Axiom Changelog",
    description: "Latest updates and improvements to Axiom.",
  },
};

export const dynamic = "force-static";

export default async function ChangelogPage() {
  const entries = await getAllChangelogEntries();
  const t = await getTranslations("changelog");
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
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

      <main className="max-w-4xl mx-auto px-6 py-16">
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
              <div key={entry.slug} className="md:pl-8 relative">
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
    </div>
  );
}
