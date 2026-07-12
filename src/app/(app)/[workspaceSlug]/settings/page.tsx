import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    select: { id: true, name: true },
  });

  if (!workspace) redirect("/");

  const t = await getTranslations("settings");
  const tNav = await getTranslations("nav");

  const SETTINGS_SECTIONS = [
    { label: t("account"), href: `/${workspaceSlug}/settings/account`, description: t("accountDesc") },
    { label: t("members"), href: `/${workspaceSlug}/settings/members`, description: t("membersDesc") },
    { label: t("workspace"), href: `/${workspaceSlug}/settings/workspace`, description: t("workspaceDesc") },
    { label: t("notifications"), href: `/${workspaceSlug}/notifications`, description: t("notificationsDesc") },
    { label: tNav("aiQuota"), href: `/${workspaceSlug}/settings/ai-quota`, description: t("aiQuotaDesc") },
    { label: t("developers"), href: `/${workspaceSlug}/settings/developers`, description: t("developersDesc") },
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          {workspace.name}
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">{t("title")}</h1>
      </div>

      <div className="space-y-2">
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center justify-between p-5 rounded-xl border border-outline-variant/30 bg-surface-container hover:bg-surface-container-high transition-colors group"
          >
            <div>
              <div className="text-[14px] font-medium text-on-surface group-hover:text-primary transition-colors">
                {section.label}
              </div>
              <div className="text-[12px] text-on-surface-variant/60 mt-0.5">
                {section.description}
              </div>
            </div>
            <svg className="text-on-surface-variant/40 group-hover:text-primary transition-colors" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
