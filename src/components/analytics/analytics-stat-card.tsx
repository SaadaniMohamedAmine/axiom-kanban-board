interface AnalyticsStatCardProps {
  label: string;
  value: string;
  sub?: string;
  subClassName?: string;
  icon: React.ReactNode;
  tone?: "default" | "error";
}

export function AnalyticsStatCard({ label, value, sub, subClassName, icon, tone = "default" }: AnalyticsStatCardProps) {
  return (
    <div className={`rounded-xl border p-6 ${tone === "error" ? "border-error/20 bg-error/5" : "border-outline-variant/20 bg-surface-container"}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">
          {label}
        </span>
        <span className={tone === "error" ? "text-error" : "text-primary"}>{icon}</span>
      </div>
      <div className={`text-3xl font-semibold ${tone === "error" ? "text-error" : "text-on-surface"}`}>
        {value}
      </div>
      {sub && <div className={`text-[12px] mt-1 ${subClassName ?? "text-on-surface-variant/60"}`}>{sub}</div>}
    </div>
  );
}
