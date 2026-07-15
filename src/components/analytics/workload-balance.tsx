import { getTranslations } from "next-intl/server";

interface WorkloadEntry {
  userId: string;
  name: string;
  points: number;
  tasks: number;
}

interface WorkloadBalanceProps {
  entries: WorkloadEntry[];
}

const BAR_COLORS = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-primary/60", "bg-secondary/60"];

export async function WorkloadBalance({ entries }: WorkloadBalanceProps) {
  const t = await getTranslations("analytics");
  const maxPoints = Math.max(1, ...entries.map((e) => e.points));

  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-6 h-full">
      <h3 className="text-[13px] font-medium text-on-surface-variant mb-5">
        {t("workloadBalance")}
      </h3>

      {entries.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-[13px] text-on-surface-variant/50 text-center">
          {t("noActiveWorkload")}
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div key={entry.userId} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-mono text-[11px] font-bold text-on-surface shrink-0">
                    {entry.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[13px] text-on-surface truncate">{entry.name}</span>
                </div>
                <span className="text-[12px] font-mono text-on-surface-variant shrink-0">
                  {t("points")}: {entry.points}
                </span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${Math.max(4, (entry.points / maxPoints) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
