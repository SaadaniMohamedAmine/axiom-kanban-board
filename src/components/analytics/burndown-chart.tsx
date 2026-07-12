"use client";

import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
}

interface BurndownChartProps {
  data: BurndownPoint[];
  sprintName: string;
}

const TOOLTIP_STYLE = {
  backgroundColor: "#0F1626",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#A8B3CF",
};

export function BurndownChart({ data, sprintName }: BurndownChartProps) {
  const t = useTranslations("analytics");

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-[13px] text-on-surface-variant/50">
        {t("noDataForSprint")}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[13px] font-medium text-on-surface-variant mb-4">
        {t("burndownFor", { sprintName })}
      </h3>
      <ResponsiveContainer height={280} width="100%">
        <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 11, fill: "#6B7A99" }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            tick={{ fontSize: 11, fill: "#6B7A99" }}
            label={{ value: t("points"), angle: -90, position: "insideLeft", fill: "#6B7A99", fontSize: 11 }}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#6B7A99", paddingTop: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="remaining"
            name={t("remaining")}
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6" }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            name={t("ideal")}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
