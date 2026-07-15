"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Plan = "FREE" | "PRO" | "TEAM";

interface Membership {
  workspace: {
    id: string;
    slug: string;
    plan: Plan;
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

  const isTopPlan = current.workspace.plan === "TEAM";

  return (
    <div className="mx-4 mb-3 p-4 rounded-xl border border-outline-variant/20 bg-surface-container-high/60">
      <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
        {t("currentPlan")}
      </div>
      <div className="text-body-md text-on-surface font-semibold mb-3">
        {t(PLAN_KEY[current.workspace.plan])}
      </div>
      <Link
        href={`/${current.workspace.slug}/settings/billing`}
        className="flex items-center justify-center w-full py-2 rounded-lg text-label-md font-semibold transition-all bg-primary/10 hover:bg-primary/20 text-primary"
      >
        {isTopPlan ? t("manage") : t("upgradeCta")}
      </Link>
    </div>
  );
}
