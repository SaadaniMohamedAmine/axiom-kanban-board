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
        <div className="absolute inset-0 bg-radial-gradient from-tertiary/15 to-secondary-container/10 blur-[40px] animate-pulse-slow" />
        <div className="relative z-20 w-48 h-48 bg-surface-container-high border border-outline-variant/30 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-2 gap-4 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
            <div className="w-12 h-1 bg-primary rounded-full" />
            <div className="w-8 h-1 bg-tertiary rounded-full ml-auto" />
            <div className="w-6 h-1 bg-secondary rounded-full" />
            <div className="w-10 h-1 bg-outline rounded-full ml-auto" />
            <div className="w-14 h-1 bg-primary-container rounded-full" />
            <div className="w-12 h-1 bg-tertiary rounded-full ml-auto" />
          </div>
          <svg className="absolute text-on-surface/10 group-hover:text-primary/20 transition-all duration-700" fill="none" height="64" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" viewBox="0 0 24 24" width="64">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
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
              className="relative bg-surface-bright/20 border border-primary/30 px-8 py-3 rounded-xl text-label-md font-bold text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 group overflow-hidden cursor-pointer"
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
