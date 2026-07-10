import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MemberList } from "@/components/workspace/member-list";

export default async function MembersPage({
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
      members: true,
      invitations: true,
    },
  });

  if (!workspace) {
    redirect("/");
  }

  const currentMember = workspace.members.find((m) => m.userId === session.user.id);
  if (!currentMember) {
    redirect("/");
  }

  return (
    <MemberList
      workspaceId={workspace.id}
      members={workspace.members}
      invitations={workspace.invitations}
      currentUserId={session.user.id}
      currentUserRole={currentMember.role}
    />
  );
}
