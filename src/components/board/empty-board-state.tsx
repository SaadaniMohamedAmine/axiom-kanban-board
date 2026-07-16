"use client";

import { useTranslations } from "next-intl";

interface EmptyBoardStateProps {
  onCreateTask?: () => void;
}

export function EmptyBoardState({ onCreateTask }: EmptyBoardStateProps) {
  const t = useTranslations("board");

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <div className="relative w-64 h-64 mb-8 flex items-center justify-center pointer-events-auto group">
        <div className="absolute inset-0 glow-violet animate-pulse-slow" />
        <div className="axiom-gradient-border relative z-20 w-48 h-48 rounded-2xl flex items-center justify-center shadow-2xl">
          <div className="grid grid-cols-2 gap-4 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
            <div className="w-12 h-1 bg-primary rounded-full" />
            <div className="w-8 h-1 bg-tertiary rounded-full ml-auto" />
            <div className="w-6 h-1 bg-secondary rounded-full" />
            <div className="w-10 h-1 bg-outline rounded-full ml-auto" />
            <div className="w-14 h-1 bg-primary-container rounded-full" />
            <div className="w-12 h-1 bg-tertiary rounded-full ml-auto" />
          </div>
          <svg className="absolute text-on-surface/10 group-hover:text-primary/20 transition-all duration-700" fill="currentColor" height="64" viewBox="0 0 24 24" width="64">
            <circle cx="6" cy="6" r="1.4" /><circle cx="12" cy="5" r="1" /><circle cx="18" cy="7" r="1.6" />
            <circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="13" r="1" />
            <circle cx="7" cy="18" r="1.6" /><circle cx="13" cy="19" r="1" /><circle cx="18" cy="18" r="1.2" />
          </svg>
        </div>
      </div>
      <div className="text-center space-y-4 pointer-events-auto">
        <h3 className="text-h2 text-on-surface font-semibold tracking-tight">
          {t("emptyBoardTitle")}
        </h3>
        <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
          {t("emptyBoardDesc")}
        </p>
        {onCreateTask && (
          <div className="pt-6">
            <button
              onClick={onCreateTask}
              className="relative bg-surface-bright/20 border border-primary/30 px-8 py-3 rounded-md text-label-md font-bold text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 group overflow-hidden cursor-pointer"
            >
              <span className="relative z-10">{t("createFirstTask")}</span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent transition-transform duration-1000" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
