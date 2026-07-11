import crypto from "crypto";

export type WebhookEvent =
  | "task.created"
  | "task.updated"
  | "task.deleted"
  | "sprint.completed"
  | "ai.suggestion.applied";

interface WebhookPayload {
  event: WebhookEvent;
  workspaceId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

export async function dispatchWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const { prisma } = await import("@/lib/prisma");

  const webhooks = await prisma.webhookConfig.findMany({
    where: {
      workspaceId,
      active: true,
      events: { has: event },
    },
    select: { url: true, secret: true },
  });

  if (webhooks.length === 0) return;

  const payload: WebhookPayload = {
    event,
    workspaceId,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadStr = JSON.stringify(payload);

  await Promise.allSettled(
    webhooks.map(async (wh) => {
      const signature = signPayload(payloadStr, wh.secret);

      try {
        await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Axiom-Signature": `sha256=${signature}`,
            "X-Axiom-Event": event,
            "User-Agent": "Axiom-Webhook/1.0",
          },
          body: payloadStr,
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // Silently fail — implement retry queue (Upstash QStash) in production
      }
    })
  );
}
