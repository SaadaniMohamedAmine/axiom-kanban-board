import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIKeyManager } from "@/components/settings/api-key-manager";
import { WebhookManager } from "@/components/settings/webhook-manager";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default async function DevelopersPage({ params }: Props) {
  const { workspaceSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      members: { some: { userId: session.user.id } },
    },
    include: {
      apiKeys: {
        where: { revokedAt: null },
        select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
        orderBy: { createdAt: "desc" },
      },
      webhookConfigs: {
        where: { active: true },
        select: { id: true, url: true, events: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!workspace) redirect("/");

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-10">
      <div className="mb-8">
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-1">
          Settings
        </div>
        <h1 className="text-2xl font-semibold text-on-surface">Developers</h1>
        <p className="text-[14px] text-on-surface-variant mt-1">
          Manage API keys and webhook integrations for{" "}
          <strong className="text-on-surface">{workspace.name}</strong>.
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-[13px]">
        <svg className="text-primary shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-on-surface-variant">
          View the{" "}
          <a href="/docs/api" target="_blank" className="text-primary hover:underline font-medium">
            API Reference →
          </a>
        </span>
      </div>

      <APIKeyManager workspaceId={workspace.id} workspaceSlug={workspaceSlug} apiKeys={workspace.apiKeys} />
      <WebhookManager workspaceId={workspace.id} workspaceSlug={workspaceSlug} webhooks={workspace.webhookConfigs} />
    </div>
  );
}
