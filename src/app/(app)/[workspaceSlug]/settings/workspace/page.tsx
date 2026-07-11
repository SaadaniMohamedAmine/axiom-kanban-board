import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";

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

  if (!workspace) redirect("/");

  const canEdit = workspace.members[0]?.role === "OWNER";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 text-on-surface">Workspace</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Name, slug, preferences
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
