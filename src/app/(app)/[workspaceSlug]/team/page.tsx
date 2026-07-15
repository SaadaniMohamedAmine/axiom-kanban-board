import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TeamMemberTable } from "@/components/workspace/team-member-table";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function TeamPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: { include: { user: { select: { name: true, email: true } } }, orderBy: { joinedAt: "asc" } },
      invitations: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!workspace) notFound();

  const currentMember = workspace.members.find((m) => m.userId === session.user.id);
  const canInvite = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";

  const t = await getTranslations("teamPage");
  const tMembers = await getTranslations("membersPage");

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant mb-2 text-[13px]">
            <span>{t("breadcrumbWorkspace")}</span>
            <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="12"><path d="m9 18 6-6-6-6" /></svg>
            <span className="text-primary">{t("breadcrumbTeam")}</span>
          </nav>
          <h1 className="text-h1 text-on-surface">{t("title")}</h1>
          <p className="text-on-surface-variant mt-1 text-[14px]">
            {t("membersActive", { count: workspace.members.length, name: workspace.name })}
          </p>
        </div>
        {canInvite && (
          <Link
            href={`/${workspace.slug}/settings#members`}
            className="bg-primary hover:brightness-110 text-on-primary px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-all active:scale-95"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="16" x2="22" y1="11" y2="11" />
            </svg>
            {t("inviteTeammate")}
          </Link>
        )}
      </div>

      <TeamMemberTable workspaceId={workspace.id} members={workspace.members} currentUserId={session.user.id} />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-h3 text-on-surface">{t("pendingInvitations")}</h3>
          {workspace.invitations.length > 0 && (
            <span className="bg-surface-container-highest text-on-surface-variant text-[11px] font-bold px-2 py-0.5 rounded-full">
              {workspace.invitations.length}
            </span>
          )}
        </div>
        {workspace.invitations.length === 0 ? (
          <p className="text-[13px] text-on-surface-variant">{t("noPendingInvitations")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspace.invitations.map((invitation) => (
              <div key={invitation.id} className="p-5 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container/60">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center mb-4 text-outline">
                  <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
                    <rect height="16" rx="2" width="20" x="2" y="4" /><path d="m22 7-10 5L2 7" />
                  </svg>
                </div>
                <p className="text-on-surface font-semibold truncate">{invitation.email}</p>
                <p className="text-[12px] text-on-surface-variant mt-1">
                  {tMembers("expires")} {new Date(invitation.expiresAt).toLocaleDateString()} · {invitation.role}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
