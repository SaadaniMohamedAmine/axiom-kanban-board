import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { HomeLogo } from "@/components/marketing/home-logo";

interface Props {
  currentLocale: "fr" | "en";
}

export async function SiteNav({ currentLocale }: Props) {
  const t = await getTranslations("landing");
  const tNav = await getTranslations("nav");

  return (
    <nav className="fixed top-0 inset-x-0 z-40 border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Axiom wordmark — text only, no icon (per BRAND-IDENTITY.md) */}
          <HomeLogo />
          <div className="hidden md:flex items-center gap-6">
            <Link href="/#features" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors">
              {tNav("features")}
            </Link>
            <Link href="/changelog" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors">
              {tNav("changelog")}
            </Link>
            <Link href="/roadmap" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors">
              {tNav("roadmap")}
            </Link>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <LocaleSwitcher currentLocale={currentLocale} />
          <Link
            href="/login"
            className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {t("signIn")}
          </Link>
          <Link
            href="/sign-up"
            className="text-[13px] px-4 py-2 bg-primary text-white rounded-md hover:brightness-110 transition-all font-medium"
          >
            {t("getStarted")}
          </Link>
        </div>

        <MobileNav
          currentLocale={currentLocale}
          labels={{
            features: tNav("features"),
            changelog: tNav("changelog"),
            roadmap: tNav("roadmap"),
            signIn: t("signIn"),
            getStarted: t("getStarted"),
          }}
        />
      </div>
    </nav>
  );
}
