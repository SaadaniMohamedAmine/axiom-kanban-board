import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { invitedAt: "asc" },
    include: { workspace: { select: { slug: true } } },
  });

  if (!membership) {
    redirect("/workspaces/new");
  }

  redirect(`/${membership.workspace.slug}`);
}
