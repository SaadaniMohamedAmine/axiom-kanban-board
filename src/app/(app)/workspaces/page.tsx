import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { WorkspaceGrid } from "./workspace-grid";

export default async function WorkspacesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id, workspace: { archivedAt: null, deletedAt: null } },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true, boards: true } },
        },
      },
    },
    orderBy: { workspace: { name: "asc" } },
  });

  const t = await getTranslations("nav");

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    slug: m.workspace.slug,
    name: m.workspace.name,
    plan: m.workspace.plan,
    role: m.role,
    memberCount: m.workspace._count.members,
    boardCount: m.workspace._count.boards,
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1 text-on-surface">{t("workspaces")}</h1>
        <Link
          href="/workspaces/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 transition-all"
        >
          <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          {t("newWorkspace")}
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="border border-dashed border-outline-variant/40 rounded-xl p-12 text-center text-on-surface-variant">
          {t("newWorkspace")}
        </div>
      ) : (
        <WorkspaceGrid workspaces={workspaces} />
      )}
    </div>
  );
}
