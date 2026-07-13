import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { NotFoundOrb } from "@/components/marketing/not-found-orb";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations("notFound");

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <SiteNav currentLocale={locale as "fr" | "en"} />

      <main className="flex-1 flex items-center justify-center relative overflow-hidden px-6 pt-32 pb-16">
        <div className="max-w-xl w-full text-center relative z-10">
          <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-widest mb-8">
            {t("eyebrow")}
          </div>

          <div className="mb-10">
            <NotFoundOrb />
          </div>

          <div className="space-y-3 mb-10">
            <h1 className="text-[32px] font-semibold text-on-surface">{t("title")}</h1>
            <p className="text-on-surface-variant text-[16px] max-w-md mx-auto leading-relaxed">
              {t("description")}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-md text-[14px] font-semibold hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]"
          >
            {t("backHome")}
            <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>

          <div className="mt-16 pt-10 border-t border-outline-variant/20 flex flex-col items-center gap-4">
            <p className="text-on-surface-variant/50 text-[11px] uppercase tracking-[0.2em] font-semibold">
              {t("suggestedLabel")}
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="/changelog" className="text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                {t("changelog")}
              </Link>
              <Link href="/roadmap" className="text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                {t("roadmap")}
              </Link>
              <Link href="/docs/api" className="text-[13px] text-on-surface-variant hover:text-primary transition-colors">
                {t("docs")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
