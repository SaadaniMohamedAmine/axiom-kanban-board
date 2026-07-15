"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface VelocityPoint {
  sprint: string;
  points: number;
}

interface VelocityChartProps {
  data: VelocityPoint[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0F1626",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#A8B3CF",
};

export function VelocityChart({ data }: VelocityChartProps) {
  const t = useTranslations("analytics");

  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-[13px] text-on-surface-variant/50">
        {t("noCompletedSprints")}
      </div>
    );
  }

  const avg = data.reduce((s, d) => s + d.points, 0) / data.length;

  function handleExport() {
    const rows = [["Sprint", "Points"], ...data.map((d) => [d.sprint, String(d.points)])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "velocity.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-medium text-on-surface-variant">
            {t("velocityLastSprints", { count: data.length })}
          </h3>
          <span className="text-[12px] text-on-surface-variant/60">
            {t("avgPtsSprint", { avg: Math.round(avg) })}
          </span>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-[12px] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        >
          <svg fill="none" height="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="13">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          {t("exportCsv")}
        </button>
      </div>
      <ResponsiveContainer height={220} width="100%">
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis
            dataKey="sprint"
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 11, fill: "#6B7A99" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 11, fill: "#6B7A99" }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="points" name={t("storyPoints")} fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
