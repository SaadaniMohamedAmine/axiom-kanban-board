import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { AccessRestricted } from "@/components/layout/access-restricted";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function WorkspaceSettingsPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: { where: { userId: session.user.id } },
    },
  });

  if (!workspace) notFound();

  const currentRole = workspace.members[0]?.role ?? "VIEWER";
  const canEdit = currentRole === "OWNER";
  const t = await getTranslations("settings");

  if (!canEdit) {
    const tAccess = await getTranslations("accessRestricted");
    return (
      <AccessRestricted
        workspaceId={workspace.id}
        resourceLabel={`${t("workspace")} — ${workspace.name}`}
        backHref={`/${workspace.slug}`}
        labels={{
          title: tAccess("title"),
          description: tAccess("description"),
          roleBadge: tAccess("roleBadge", { role: currentRole }),
          requestAccess: tAccess("requestAccess"),
          requesting: tAccess("requesting"),
          requestSent: tAccess("requestSent"),
          backToDashboard: tAccess("backToDashboard"),
          statusCode: tAccess("statusCode"),
        }}
      />
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 text-on-surface">{t("workspace")}</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          {t("workspaceDesc")}
        </p>
      </div>
      <WorkspaceSettingsForm
        workspaceId={workspace.id}
        name={workspace.name}
        slug={workspace.slug}
        canEdit={canEdit}
      />
    </div>
  );
}
