import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlanLimits, formatLimit } from "@/lib/billing/plan-limits";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function BillingPage({ params, searchParams }: Props) {
  const { workspaceSlug } = await params;
  const { success } = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    select: {
      id: true,
      name: true,
      plan: true,
      planExpiresAt: true,
      stripeSubscriptionId: true,
      _count: { select: { boards: true, members: true } },
    },
  });

  if (!workspace) redirect("/");

  const limits = getPlanLimits(workspace.plan);

  const PLAN_LABELS: Record<string, string> = {
    FREE: "Free",
    PRO: "Pro",
    TEAM: "Team",
  };

  const PLAN_COLORS: Record<string, string> = {
    FREE: "text-on-surface-variant",
    PRO: "text-primary",
    TEAM: "text-cyan-400",
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          Settings
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Billing</h1>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/5 text-[13px] text-green-400">
          Subscription activated. Welcome to {PLAN_LABELS[workspace.plan]}.
        </div>
      )}

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
              Current plan
            </div>
            <div className={`text-2xl font-semibold ${PLAN_COLORS[workspace.plan]}`}>
              {PLAN_LABELS[workspace.plan]}
            </div>
          </div>
          {workspace.planExpiresAt && (
            <div className="text-right">
              <div className="text-[11px] text-on-surface-variant/50">Renews on</div>
              <div className="text-[14px] text-on-surface">
                {new Date(workspace.planExpiresAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-outline-variant/20">
          <div>
            <div className="text-[11px] text-on-surface-variant/50 mb-1">Boards</div>
            <div className="text-[15px] font-medium text-on-surface">
              {workspace._count.boards}
              <span className="text-on-surface-variant/50 font-normal text-[13px]">
                {" "}/ {formatLimit(limits.maxBoards)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-on-surface-variant/50 mb-1">Members</div>
            <div className="text-[15px] font-medium text-on-surface">
              {workspace._count.members}
              <span className="text-on-surface-variant/50 font-normal text-[13px]">
                {" "}/ {formatLimit(limits.maxMembers)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {workspace.plan === "FREE" && (
          <Link
            href="/pricing"
            className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div>
              <div className="text-[14px] font-medium text-on-surface">Upgrade to Pro</div>
              <div className="text-[12px] text-on-surface-variant/60 mt-0.5">
                Unlimited boards, webhooks, audit log.
              </div>
            </div>
            <svg className="text-primary" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        )}

        {workspace.stripeSubscriptionId && (
          <ManageSubscriptionButton workspaceId={workspace.id} />
        )}
      </div>
    </div>
  );
}

function ManageSubscriptionButton({ workspaceId }: { workspaceId: string }) {
  return (
    <form action={async () => {
      "use server";
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/billing/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const { url } = await res.json() as { url: string };
    }}>
      <a
        href={`/api/billing/portal-redirect?workspaceId=${workspaceId}`}
        className="flex items-center justify-between w-full px-5 py-4 rounded-xl border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high transition-colors"
      >
        <div className="text-[14px] font-medium text-on-surface">Manage subscription</div>
        <svg className="text-on-surface-variant" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" />
        </svg>
      </a>
    </form>
  );
}
