import { NextRequest } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { WorkspacePlan } from "@prisma/client";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  async function getPlanFromPriceId(priceId: string): Promise<WorkspacePlan> {
    if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return "TEAM";
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
    return "FREE";
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = await getPlanFromPriceId(priceId);
      const expiresAt = new Date(subscription.current_period_end * 1000);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          plan,
          stripeSubscriptionId: subscription.id,
          planExpiresAt: expiresAt,
        },
      });

      await prisma.auditLog.create({
        data: {
          workspaceId,
          actorEmail: "system",
          action: "BILLING_UPGRADED",
          targetType: "workspace",
          targetId: workspaceId,
          metadata: { plan, subscriptionId: subscription.id },
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspaceId;
      if (!workspaceId) break;

      const priceId = subscription.items.data[0]?.price.id;
      const plan = await getPlanFromPriceId(priceId);
      const expiresAt = new Date(subscription.current_period_end * 1000);

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { plan, planExpiresAt: expiresAt },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspaceId;
      if (!workspaceId) break;

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { plan: "FREE", stripeSubscriptionId: null, planExpiresAt: null },
      });

      await prisma.auditLog.create({
        data: {
          workspaceId,
          actorEmail: "system",
          action: "BILLING_CANCELLED",
          targetType: "workspace",
          targetId: workspaceId,
          metadata: { subscriptionId: subscription.id },
        },
      });
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
