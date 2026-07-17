import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TrashBoardList } from "./trash-board-list";

export default async function TrashBoardsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: {
      members: { where: { userId: session.user.id } },
      boards: {
        where: { deletedAt: { not: null } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) notFound();

  const canManage = workspace.members[0].role === "OWNER" || workspace.members[0].role === "ADMIN";

  const t = await getTranslations("nav");
  const tb = await getTranslations("board");

  const boards = workspace.boards.map((b) => ({
    id: b.id,
    name: b.name,
    deletedAt: b.deletedAt!.toISOString(),
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-h1 text-on-surface">{t("trash")}</h1>
        <Link href={`/${workspaceSlug}`} className="text-[13px] text-primary hover:text-primary/80 transition-colors">
          {tb("trashPage.backToBoards")}
        </Link>
      </div>
      <p className="text-[13px] text-on-surface-variant mb-8">{tb("trashPage.desc")}</p>

      {boards.length === 0 ? (
        <div className="border border-dashed border-outline-variant/40 rounded-xl p-12 text-center text-on-surface-variant">
          {tb("trashPage.empty")}
        </div>
      ) : (
        <TrashBoardList boards={boards} canManage={canManage} />
      )}
    </div>
  );
}
