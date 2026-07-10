import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/billing/stripe";
import { headers } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { workspaceId } = await req.json() as { workspaceId: string };

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
    select: { stripeCustomerId: true, slug: true },
  });

  if (!workspace?.stripeCustomerId) {
    return new Response(JSON.stringify({ error: "No billing account found" }), { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${APP_URL}/${workspace.slug}/settings/billing`,
  });

  return new Response(JSON.stringify({ url: portalSession.url }), {
    headers: { "Content-Type": "application/json" },
  });
}
