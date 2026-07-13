import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("landing");
  const tNav = await getTranslations("nav");

  return (
    <footer className="border-t border-outline-variant/20 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-on-surface-variant/50">
        <span>{t("footerCopyright")}</span>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link href="/changelog" className="hover:text-on-surface-variant transition-colors">{tNav("changelog")}</Link>
          <Link href="/roadmap" className="hover:text-on-surface-variant transition-colors">{tNav("roadmap")}</Link>
          <Link href="/privacy" className="hover:text-on-surface-variant transition-colors">{t("footerPrivacy")}</Link>
          <Link href="/terms" className="hover:text-on-surface-variant transition-colors">{t("footerTerms")}</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-on-surface-variant transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
