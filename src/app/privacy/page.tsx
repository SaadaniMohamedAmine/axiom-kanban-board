import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information Axiom collects, how it is used, and your choices.",
};

interface Section {
  heading: string;
  body: string;
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = await getTranslations("legal");
  const tPrivacy = await getTranslations("legal.privacy");
  const sections = tPrivacy.raw("sections") as Section[];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <SiteNav currentLocale={locale as "fr" | "en"} />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-16">
        <div className="mb-12">
          <div className="text-[11px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-3">
            {t("eyebrow")}
          </div>
          <h1 className="text-4xl font-semibold text-on-surface tracking-tight mb-3">
            {tPrivacy("title")}
          </h1>
          <p className="text-[13px] text-on-surface-variant/60 mb-4">{t("lastUpdated")}</p>
          <p className="text-[15px] text-on-surface-variant leading-relaxed">{tPrivacy("intro")}</p>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-lg font-semibold text-on-surface mb-2">{section.heading}</h2>
              <p className="text-[14px] text-on-surface-variant leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
