"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ReasoningStream } from "@/components/ai/reasoning-stream";

interface SprintHealthSummaryProps {
  sprintId: string;
  sprintName: string;
  overdueTasks: number;
  blockedTasks: number;
  totalTasks: number;
  completedTasks: number;
}

export function SprintHealthSummary({
  sprintId,
  sprintName,
  overdueTasks,
  blockedTasks,
  totalTasks,
  completedTasks,
}: SprintHealthSummaryProps) {
  const [started, setStarted] = useState(false);
  const t = useTranslations("analytics");

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-black/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_6px_#22D3EE]" />
        <span className="text-[11px] font-semibold text-[#22D3EE] uppercase tracking-widest">
          {t("sprintHealth")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-semibold text-on-surface">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-[11px] text-on-surface-variant/60">{t("tasksDone")}</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-semibold ${overdueTasks > 0 ? "text-amber-400" : "text-on-surface"}`}>
            {overdueTasks}
          </div>
          <div className="text-[11px] text-on-surface-variant/60">{t("overdue")}</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-semibold ${blockedTasks > 0 ? "text-red-400" : "text-on-surface"}`}>
            {blockedTasks}
          </div>
          <div className="text-[11px] text-on-surface-variant/60">{t("blocked")}</div>
        </div>
      </div>

      <div className="border-t border-outline-variant/10 pt-3">
        <p className="text-[12px] text-on-surface-variant/60 mb-2">
          {t("aiSprintSummary")}
        </p>
        {!started ? (
          <button
            onClick={() => setStarted(true)}
            className="text-[12px] text-[#22D3EE] hover:text-[#22D3EE]/80 transition-colors"
          >
            {t("generateHealthSummary")}
          </button>
        ) : (
          <ReasoningStream
            key={sprintId}
            endpoint="/api/ai/prioritize"
            payload={{
              sprintId,
              title: `Sprint ${sprintName} health check`,
              description: `${completedTasks}/${totalTasks} tasks done, ${overdueTasks} overdue, ${blockedTasks} blocked.`,
              columnName: "Sprint",
            }}
            autoStart
          />
        )}
      </div>
    </div>
  );
}
