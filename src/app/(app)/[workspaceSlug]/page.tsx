import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { WorkspaceBoardsWithModal } from "./workspace-boards-with-modal";
import { TestErrorButton } from "@/components/ui/test-error-button";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
      boards: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    notFound();
  }

  const canCreateBoard = workspace.members[0].role === "OWNER" || workspace.members[0].role === "ADMIN";

  return (
    <div className="p-8">
      <h1 className="text-h2 text-on-surface mb-6">{workspace.name}</h1>
      <WorkspaceBoardsWithModal
        workspaceId={workspace.id}
        workspaceSlug={workspace.slug}
        boards={workspace.boards}
        canCreateBoard={canCreateBoard}
      />
      <TestErrorButton />
    </div>
  );
}
