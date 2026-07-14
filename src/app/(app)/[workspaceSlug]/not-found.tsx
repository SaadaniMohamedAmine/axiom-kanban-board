import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NotFoundOrb } from "@/components/marketing/not-found-orb";

export default async function WorkspaceNotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full text-center">
        <div className="mb-16">
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
          {t("backToApp")}
          <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
