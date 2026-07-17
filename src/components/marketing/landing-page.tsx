import { getTranslations } from "next-intl/server";
import { ScrollToTop } from "@/components/marketing/scroll-to-top";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { HeroContent } from "@/components/marketing/hero-content";
import { MouseGlow } from "@/components/marketing/mouse-glow";
import { FeatureTile } from "@/components/marketing/feature-tile";
import { PriorityScoreBars } from "@/components/marketing/priority-score-bars";
import { MotionCta } from "@/components/marketing/motion-cta";

interface Props {
  currentLocale: "fr" | "en";
  isAuthenticated?: boolean;
}

export async function LandingPage({ currentLocale, isAuthenticated = false }: Props) {
  const t = await getTranslations("landing");
  const tAi = await getTranslations("ai");

  return (
    <div className="min-h-screen bg-background text-on-surface font-geist">
      <SiteNav currentLocale={currentLocale} />

      {/* Hero */}
      <section id="hero" className="relative pt-40 pb-16 px-6 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <HeroContent
            badge={t("badge")}
            titleLine1={t("heroTitleLine1")}
            titleLine2={t("heroTitleLine2")}
            subtitle={t("heroSubtitle")}
            startFree={t("startFree")}
            viewDemo={t("viewDemo")}
            isAuthenticated={isAuthenticated}
            goToDashboard={t("goToDashboard")}
          />
        </div>

        {/* Product mockup */}
        <div className="relative max-w-5xl mx-auto z-10">
          <div className="absolute -inset-10 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <MouseGlow>
          <div className="relative rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            {/* Browser chrome */}
            <div className="h-10 border-b border-outline-variant/20 flex items-center px-4 gap-2 bg-surface-container-highest/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-error/40" />
                <div className="w-3 h-3 rounded-full bg-secondary/40" />
                <div className="w-3 h-3 rounded-full bg-primary/40" />
              </div>
              <div className="mx-auto px-3 h-6 rounded border border-outline-variant/10 bg-surface-container-lowest flex items-center justify-center text-[10px] text-on-surface-variant font-mono">
                {t("mockup.url")}
              </div>
            </div>

            {/* Board preview */}
            <div className="p-6 md:p-8 bg-surface-container-lowest text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Backlog */}
                <div className="space-y-3">
                  <h4 className="text-[13px] font-medium text-on-surface flex items-center gap-2">
                    {t("mockup.backlog")}
                    <span className="text-on-surface-variant/50 text-[11px]">3</span>
                  </h4>
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/10">
                    <div className="h-2 w-12 bg-primary/20 rounded mb-3" />
                    <div className="h-3 w-full bg-on-surface-variant/10 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-on-surface-variant/10 rounded" />
                  </div>
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/10">
                    <div className="h-2 w-16 bg-secondary/20 rounded mb-3" />
                    <div className="h-3 w-full bg-on-surface-variant/10 rounded" />
                  </div>
                </div>

                {/* In Progress — Axiom Intelligence highlight */}
                <div className="space-y-3">
                  <h4 className="text-[13px] font-medium text-on-surface flex items-center gap-2">
                    {t("mockup.inProgress")}
                    <span className="text-on-surface-variant/50 text-[11px]">1</span>
                  </h4>
                  <div className="p-4 rounded-xl relative border border-transparent [background:linear-gradient(var(--surface-container),var(--surface-container))_padding-box,linear-gradient(to_right,#8B5CF6,#22D3EE)_border-box]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#22D3EE]">
                        {tAi("name")}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium text-on-surface mb-1">{t("mockup.taskTitle")}</p>
                    <p className="text-on-surface-variant text-[12px] mb-4 leading-relaxed">{t("mockup.taskBlocker")}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full border border-surface-container bg-surface-container-high" />
                        <div className="w-6 h-6 rounded-full border border-surface-container bg-primary/40" />
                      </div>
                      <button className="bg-[#22D3EE]/15 text-[#22D3EE] px-3 py-1 rounded text-[10px] font-semibold uppercase tracking-wide">
                        {t("mockup.resolve")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Done */}
                <div className="space-y-3">
                  <h4 className="text-[13px] font-medium text-on-surface flex items-center gap-2">
                    {t("mockup.done")}
                    <span className="text-on-surface-variant/50 text-[11px]">8</span>
                  </h4>
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/10">
                    <div className="h-2 w-20 bg-secondary/20 rounded mb-3" />
                    <div className="h-3 w-full bg-on-surface-variant/10 rounded" />
                  </div>
                  <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/10">
                    <div className="h-2 w-14 bg-primary/20 rounded mb-3" />
                    <div className="h-3 w-full bg-on-surface-variant/10 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          </MouseGlow>
        </div>
      </section>

      {/* Features bento grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[220px]">
          {/* AI Priority Engine — the only tile carrying the AI accent (violet/cyan), per brand rules */}
          <FeatureTile
            index={0}
            className="relative md:col-span-2 md:row-span-2 rounded-3xl p-8 md:p-10 flex flex-col justify-end overflow-hidden border border-outline-variant/20 bg-surface-container"
          >
            <div className="absolute top-6 right-6 md:top-8 md:right-8 w-44">
              <div className="absolute -inset-6 bg-[#8B5CF6]/20 blur-3xl rounded-full pointer-events-none" />
              <div className="relative rounded-2xl border border-[#8B5CF6]/20 bg-surface-container-lowest/90 backdrop-blur-sm p-4 shadow-lg">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8B5CF6]">Priority score</span>
                <PriorityScoreBars />
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6]">
              <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="22">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                <path d="M20 3v4" />
                <path d="M22 5h-4" />
                <path d="M4 17v2" />
                <path d="M5 18H3" />
              </svg>
            </div>
            <h3 className="text-[22px] md:text-h1 font-semibold text-on-surface mb-3">{t("features.aiTitle")}</h3>
            <p className="text-on-surface-variant max-w-md leading-relaxed">{t("features.aiDesc")}</p>
          </FeatureTile>

          <FeatureTile index={1} className="rounded-3xl p-8 flex flex-col justify-center border border-outline-variant/20 bg-surface-container">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-surface-container-high border border-outline-variant/20 text-on-surface-variant">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="text-h3 font-semibold text-on-surface mb-2">{t("features.analyticsTitle")}</h3>
            <p className="text-on-surface-variant text-[13px] leading-relaxed">{t("features.analyticsDesc")}</p>
          </FeatureTile>

          <FeatureTile index={2} className="rounded-3xl p-8 flex flex-col justify-center border border-outline-variant/20 bg-surface-container">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-surface-container-high border border-outline-variant/20 text-on-surface-variant">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-h3 font-semibold text-on-surface mb-2">{t("features.realtimeTitle")}</h3>
            <p className="text-on-surface-variant text-[13px] leading-relaxed">{t("features.realtimeDesc")}</p>
          </FeatureTile>

          <FeatureTile
            index={3}
            className="md:col-span-2 rounded-3xl p-8 md:p-10 flex items-center justify-between border border-outline-variant/20 bg-surface-container"
          >
            <div className="max-w-md">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-surface-container-high border border-outline-variant/20 text-on-surface-variant">
                <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                </svg>
              </div>
              <h3 className="text-h2 font-semibold text-on-surface mb-3">{t("features.designTitle")}</h3>
              <p className="text-on-surface-variant leading-relaxed">{t("features.designDesc")}</p>
            </div>
            <div className="hidden sm:flex relative w-24 h-24 rounded-full border border-outline-variant/30 bg-surface-container-lowest items-center justify-center shrink-0">
              <div className="absolute inset-3 rounded-full border border-outline-variant/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/60" />
            </div>
          </FeatureTile>

          <FeatureTile index={4} className="relative rounded-3xl p-8 flex flex-col justify-center border border-outline-variant/20 bg-surface-container">
            <span className="absolute top-6 right-6 font-mono text-[10px] px-1.5 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant">
              ⌘K
            </span>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 bg-surface-container-high border border-outline-variant/20 text-on-surface-variant">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
            </div>
            <h3 className="text-h3 font-semibold text-on-surface mb-2">{t("features.paletteTitle")}</h3>
            <p className="text-on-surface-variant text-[13px] leading-relaxed">{t("features.paletteDesc")}</p>
          </FeatureTile>
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

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="relative rounded-[40px] py-20 px-8 text-center overflow-hidden border border-outline-variant/20 bg-surface-container">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-[36px] md:text-display font-semibold text-on-surface mb-6">{t("cta.title")}</h2>
            <p className="text-on-surface-variant text-[18px] max-w-xl mx-auto mb-10 leading-relaxed">{t("cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <MotionCta
                href="/sign-up"
                className="px-8 py-4 bg-primary text-white rounded-md text-[15px] font-semibold hover:brightness-110 transition-[background]"
              >
                {t("startFree")}
              </MotionCta>
              <MotionCta
                href="/login"
                className="px-8 py-4 border border-outline-variant text-on-surface rounded-md text-[15px] font-medium hover:bg-surface-container-high transition-colors"
              >
                {t("viewDemo")}
              </MotionCta>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <ScrollToTop />
    </div>
  );
}
