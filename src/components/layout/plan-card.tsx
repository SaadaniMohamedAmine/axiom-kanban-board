"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getPlanLimits } from "@/lib/billing/plan-limits";

type Plan = "FREE" | "PRO" | "TEAM";

interface Membership {
  workspace: {
    id: string;
    slug: string;
    plan: Plan;
    aiRequestsToday: number;
    boards: { id: string }[];
    _count: { members: number };
  };
}

interface PlanCardProps {
  memberships: Membership[];
}

const PLAN_KEY: Record<Plan, "freePlan" | "proPlan" | "teamPlan"> = {
  FREE: "freePlan",
  PRO: "proPlan",
  TEAM: "teamPlan",
};

export function PlanCard({ memberships }: PlanCardProps) {
  const t = useTranslations("billing");
  const pathname = usePathname();

  const currentSlug = pathname.split("/")[1];
  const current = memberships.find((m) => m.workspace.slug === currentSlug) ?? memberships[0];

  if (!current) return null;

  const { workspace } = current;
  const isTopPlan = workspace.plan === "TEAM";
  const isFree = workspace.plan === "FREE";
  const limits = getPlanLimits(workspace.plan);

  return (
    <div className="mx-4 mb-3 p-4 rounded-xl border border-outline-variant/20 bg-surface-container-high/60 space-y-3">
      <div>
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          {t("currentPlan")}
        </div>
        <div className="text-body-md text-on-surface font-semibold">
          {t(PLAN_KEY[workspace.plan])}
        </div>
      </div>

      {isFree && (
        <div className="space-y-2">
          <UsageBar label={t("boardsUsage")} used={workspace.boards.length} max={limits.maxBoards} />
          <UsageBar label={t("aiUsage")} used={workspace.aiRequestsToday} max={limits.maxAIRequestsPerDay} />
        </div>
      )}

      <Link
        href={`/${workspace.slug}/settings/billing`}
        className="flex items-center justify-center w-full py-2 rounded-lg text-label-md font-semibold transition-all bg-primary/10 hover:bg-primary/20 text-primary"
      >
        {isTopPlan ? t("manage") : t("upgradeCta")}
      </Link>
    </div>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = max <= 0 ? 100 : Math.min(100, Math.round((used / max) * 100));
  const isDanger = used >= max;
  const isWarning = !isDanger && pct >= 80;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-on-surface-variant/70">{label}</span>
        <span
          className={`text-[10px] font-medium ${
            isDanger ? "text-error" : isWarning ? "text-amber-400" : "text-on-surface-variant/60"
          }`}
        >
          {used}/{max}
        </span>
      </div>
      <div className="h-1 rounded-full bg-outline-variant/20 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDanger ? "bg-error" : isWarning ? "bg-amber-400" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
