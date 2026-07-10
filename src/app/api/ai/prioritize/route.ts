import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { streamCompletion } from "@/lib/ai/client";
import { PROMPTS } from "@/lib/ai/prompts";
import { prioritizeInputSchema } from "@/lib/validations/ai.schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const rateLimit = checkRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "Axiom Intelligence daily limit reached. Resets at midnight UTC.",
        resetAt: rateLimit.resetAt,
      }),
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = prioritizeInputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    });
  }

  const { taskId, title, description, columnName, dueDate } = parsed.data;

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      board: {
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
    },
  });
  if (!task) {
    return new Response(JSON.stringify({ error: "Task not found" }), {
      status: 404,
    });
  }

  let fullOutput = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const prompt = PROMPTS.prioritize(title, description, columnName, dueDate);

        fullOutput = await streamCompletion(prompt, (chunk) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
        });

        const priorityMatch = fullOutput.match(/\b(URGENT|HIGH|MEDIUM|LOW)\b/);
        const priority = priorityMatch?.[1] ?? "MEDIUM";

        const log = await prisma.aILog.create({
          data: {
            taskId,
            type: "PRIORITIZE",
            input: { title, description, columnName, dueDate },
            output: { reasoning: fullOutput, result: priority },
            confidence: 0.8,
          },
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, logId: log.id })}\n\n`
          )
        );
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Axiom Intelligence encountered an error." })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
