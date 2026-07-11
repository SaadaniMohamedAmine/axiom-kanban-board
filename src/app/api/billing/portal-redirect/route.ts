import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/billing/stripe";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.redirect("/login");

  const workspaceId = req.nextUrl.searchParams.get("workspaceId")!;
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, members: { some: { userId: session.user.id } } },
    select: { stripeCustomerId: true, slug: true },
  });

  if (!workspace?.stripeCustomerId) return NextResponse.redirect("/");

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
  const portalSession = await getStripeClient().billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${APP_URL}/${workspace.slug}/settings/billing`,
  });

  return NextResponse.redirect(portalSession.url);
}
