import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TrashWorkspaceList } from "./trash-workspace-list";

export default async function TrashWorkspacesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id, workspace: { deletedAt: { not: null } } },
    include: { workspace: true },
    orderBy: { workspace: { name: "asc" } },
  });

  const t = await getTranslations("nav");
  const tw = await getTranslations("workspacesPage");

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    slug: m.workspace.slug,
    name: m.workspace.name,
    role: m.role,
    deletedAt: m.workspace.deletedAt!.toISOString(),
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-h1 text-on-surface">{t("trash")}</h1>
        <Link href="/workspaces" className="text-[13px] text-primary hover:text-primary/80 transition-colors">
          {tw("backToWorkspaces")}
        </Link>
      </div>
      <p className="text-[13px] text-on-surface-variant mb-8">{tw("trashDesc")}</p>

      {workspaces.length === 0 ? (
        <div className="border border-dashed border-outline-variant/40 rounded-xl p-12 text-center text-on-surface-variant">
          {tw("trashEmpty")}
        </div>
      ) : (
        <TrashWorkspaceList workspaces={workspaces} />
      )}
    </div>
  );
}
