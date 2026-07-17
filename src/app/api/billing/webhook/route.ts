import { NextRequest } from "next/server";
import { getStripeClient } from "@/lib/billing/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { WorkspacePlan } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { createNotification } from "@/lib/notifications/create";

// Stripe calls this server-to-server — there's no request-scoped locale to
// read (unlike every other notification trigger, which fires from the
// actor's own request and is naturally in their locale). Look up the
// recipient's stored preference instead.
async function notifyPlanChanged(userId: string, workspaceName: string, plan: string) {
  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
  const t = await getTranslations({ locale: owner?.locale ?? "fr", namespace: "notificationMessages" });
  void createNotification({
    userId,
    type: "plan_changed",
    title: t("plan_changed.title"),
    message: t("plan_changed.message", { workspace: workspaceName, plan }),
  });
}

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing signature", { status: 400 });
  }

  const stripe = getStripeClient();

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
      const item = subscription.items.data[0];
      if (!item) break;

      const plan = await getPlanFromPriceId(item.price.id);
      const expiresAt = new Date(item.current_period_end * 1000);

      const updatedWorkspace = await prisma.workspace.update({
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
      void notifyPlanChanged(updatedWorkspace.ownerId, updatedWorkspace.name, plan);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspaceId;
      if (!workspaceId) break;

      const item = subscription.items.data[0];
      if (!item) break;

      const plan = await getPlanFromPriceId(item.price.id);
      const expiresAt = new Date(item.current_period_end * 1000);

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

      const cancelledWorkspace = await prisma.workspace.update({
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
      void notifyPlanChanged(cancelledWorkspace.ownerId, cancelledWorkspace.name, "FREE");
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
