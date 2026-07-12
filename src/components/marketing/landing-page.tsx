import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

interface Props {
  currentLocale: "fr" | "en";
}

export async function LandingPage({ currentLocale }: Props) {
  const t = await getTranslations("landing");
  const tNav = await getTranslations("nav");

  return (
    <div className="min-h-screen bg-background text-on-surface font-geist">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 border-b border-outline-variant/20 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Axiom wordmark */}
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <svg fill="none" height="12" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="12">
                <rect height="18" rx="2" width="18" x="3" y="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-on-surface">Axiom</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/changelog" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors hidden md:block">
              {tNav("changelog")}
            </Link>
            <Link href="/roadmap" className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors hidden md:block">
              {tNav("roadmap")}
            </Link>
            <LocaleSwitcher currentLocale={currentLocale} />
            <Link
              href="/login"
              className="text-[13px] text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/sign-up"
              className="text-[13px] px-4 py-2 bg-primary text-white rounded-xl hover:brightness-110 transition-all font-medium"
            >
              {t("getStarted")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 text-center max-w-4xl mx-auto">
        {/* Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/8 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
          <span className="text-[11px] font-semibold text-[#8B5CF6] uppercase tracking-widest">
            {t("badge")}
          </span>
        </div>

        <h1 className="text-[52px] md:text-[72px] font-semibold text-on-surface leading-[1.05] tracking-tight mb-6">
          {t("heroTitleLine1")}<br />
          <span className="text-primary">{t("heroTitleLine2")}</span>
        </h1>

        <p className="text-[18px] md:text-[20px] text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("heroSubtitle")}
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/sign-up"
            className="px-7 py-3.5 bg-primary text-white rounded-xl text-[15px] font-semibold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            {t("startFree")}
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 border border-outline-variant bg-surface-container text-on-surface rounded-xl text-[15px] font-medium hover:bg-surface-container-high transition-colors"
          >
            {t("viewDemo")}
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ),
              color: "text-[#8B5CF6]",
              bg: "bg-[#8B5CF6]/8 border-[#8B5CF6]/20",
              title: t("features.aiTitle"),
              desc: t("features.aiDesc"),
            },
            {
              icon: (
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
              color: "text-[#22D3EE]",
              bg: "bg-[#22D3EE]/8 border-[#22D3EE]/20",
              title: t("features.analyticsTitle"),
              desc: t("features.analyticsDesc"),
            },
            {
              icon: (
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              color: "text-primary",
              bg: "bg-primary/8 border-primary/20",
              title: t("features.realtimeTitle"),
              desc: t("features.realtimeDesc"),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className={`p-6 rounded-2xl border ${feature.bg} bg-surface-container`}
            >
              <div className={`mb-4 ${feature.color}`}>{feature.icon}</div>
              <h3 className="text-[15px] font-semibold text-on-surface mb-2">{feature.title}</h3>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack section */}
      <section className="border-t border-outline-variant/20 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[12px] font-semibold text-on-surface-variant/40 uppercase tracking-widest mb-8">
            {t("stackLabel")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {["Next.js 16", "TypeScript", "Prisma 7", "Better Auth", "Groq AI", "Pusher", "Tailwind CSS v4"].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-[12px] text-on-surface-variant border border-outline-variant/30 rounded-full bg-surface-container"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[12px] text-on-surface-variant/50">
          <span>{t("footerCopyright")}</span>
          <div className="flex items-center gap-6">
            <Link href="/changelog" className="hover:text-on-surface-variant transition-colors">{tNav("changelog")}</Link>
            <Link href="/roadmap" className="hover:text-on-surface-variant transition-colors">{tNav("roadmap")}</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-on-surface-variant transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
