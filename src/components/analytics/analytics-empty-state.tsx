import { getTranslations } from "next-intl/server";

export async function AnalyticsEmptyState() {
  const t = await getTranslations("analytics");

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-4">
        <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24" className="text-on-surface-variant/40">
          <line x1="18" x2="18" y1="20" y2="10" />
          <line x1="12" x2="12" y1="20" y2="4" />
          <line x1="6" x2="6" y1="20" y2="14" />
        </svg>
      </div>
      <p className="text-[14px] text-on-surface-variant">{t("noActiveSprintFound")}</p>
      <p className="text-[12px] text-on-surface-variant/50 mt-1">
        {t("startSprintHint")}
      </p>
    </div>
  );
}
