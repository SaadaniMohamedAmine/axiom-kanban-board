"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { feedbackInputSchema } from "@/lib/validations/ai.schema";

export async function submitAIFeedback(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const { logId, feedback } = parsed.data;

  const log = await prisma.aILog.findFirst({
    where: {
      id: logId,
      task: {
        board: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
    },
  });

  if (!log) throw new Error("Log not found");

  await prisma.aILog.update({
    where: { id: logId },
    data: { feedback },
  });
}
