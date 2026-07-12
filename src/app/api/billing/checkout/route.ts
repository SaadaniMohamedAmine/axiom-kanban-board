import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripeClient, STRIPE_PRICE_IDS } from "@/lib/billing/stripe";
import { headers } from "next/headers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { workspaceId, plan } = await req.json() as { workspaceId: string; plan: "PRO" | "TEAM" };

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400 });
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } },
    },
    select: { id: true, name: true, stripeCustomerId: true, slug: true },
  });

  if (!workspace) {
    return new Response(JSON.stringify({ error: "Workspace not found" }), { status: 404 });
  }

  const stripe = getStripeClient();

  let customerId = workspace.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: workspace.name,
      metadata: { workspaceId: workspace.id },
    });
    customerId = customer.id;

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/${workspace.slug}/settings/billing?success=1`,
    cancel_url: `${APP_URL}/pricing`,
    metadata: { workspaceId: workspace.id, plan },
    subscription_data: {
      metadata: { workspaceId: workspace.id, plan },
    },
  });

  return new Response(JSON.stringify({ url: checkoutSession.url }), {
    headers: { "Content-Type": "application/json" },
  });
}
