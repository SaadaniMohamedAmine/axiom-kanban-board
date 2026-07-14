import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function WorkspacesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
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

      {memberships.length === 0 ? (
        <div className="border border-dashed border-outline-variant/40 rounded-xl p-12 text-center text-on-surface-variant">
          {t("newWorkspace")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map((m) => (
            <Link
              key={m.workspace.id}
              href={`/${m.workspace.slug}`}
              className="p-5 bg-surface-container border border-outline-variant/50 rounded-xl hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-[14px] mb-4">
                {m.workspace.name.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-h3 text-on-surface font-semibold truncate">{m.workspace.name}</h2>
              <p className="text-label-md text-on-surface-variant mt-1">
                {t("membersCount", { count: m.workspace._count.members })} · {m.workspace._count.boards} {t("boards").toLowerCase()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
