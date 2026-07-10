import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, name: true },
  });

  if (!workspace) redirect("/");

  const sections = [
    {
      label: "Members",
      href: `/${workspaceSlug}/settings/members`,
      description: "Manage workspace members and invitations",
    },
    {
      label: "AI Quota",
      href: `/${workspaceSlug}/settings/ai-quota`,
      description: "Daily Axiom Intelligence usage and limits",
    },
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          Settings
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Workspace Settings</h1>
        <p className="text-[14px] text-on-surface-variant mt-1">
          Manage your workspace <strong className="text-on-surface">{workspace.name}</strong>.
        </p>
      </div>

      <div className="space-y-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center justify-between px-5 py-4 rounded-xl border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <div>
              <div className="text-[14px] font-medium text-on-surface">{section.label}</div>
              <div className="text-[12px] text-on-surface-variant/60 mt-0.5">{section.description}</div>
            </div>
            <svg className="text-on-surface-variant/30 shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
