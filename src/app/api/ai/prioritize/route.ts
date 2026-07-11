import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkWorkspaceQuota, incrementWorkspaceQuota } from "@/lib/ai/workspace-rate-limit";
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

  const body = await req.json().catch(() => null);
  const parsed = prioritizeInputSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    });
  }

  const { taskId, sprintId, title, description, columnName, dueDate } = parsed.data;

  if (taskId) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        board: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
      include: { board: { select: { workspaceId: true } } },
    });
    if (!task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
      });
    }

    const quota = await checkWorkspaceQuota(task.board.workspaceId);
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          error: "quota_exceeded",
          message: "Axiom Intelligence quota reached for today. Resets at midnight UTC.",
          resetAt: quota.resetAt.toISOString(),
          used: quota.used,
          limit: quota.limit,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const prompt = PROMPTS.prioritize(title, description, columnName, dueDate);

          await streamCompletion(prompt, (chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            );
          });

          const log = await prisma.aILog.create({
            data: {
              taskId: taskId ?? null,
              type: "PRIORITIZE",
              input: { taskId, sprintId, title, description, columnName, dueDate },
              output: { reasoning: "", result: "" },
              confidence: 0.8,
            },
          });

          await incrementWorkspaceQuota(task.board.workspaceId);

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
  } else {
    const sprint = await prisma.sprint.findFirst({
      where: {
        id: sprintId,
        board: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
      include: { board: { select: { workspaceId: true } } },
    });
    if (!sprint) {
      return new Response(JSON.stringify({ error: "Sprint not found" }), {
        status: 404,
      });
    }

    const quota = await checkWorkspaceQuota(sprint.board.workspaceId);
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          error: "quota_exceeded",
          message: "Axiom Intelligence quota reached for today. Resets at midnight UTC.",
          resetAt: quota.resetAt.toISOString(),
          used: quota.used,
          limit: quota.limit,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          const prompt = PROMPTS.prioritize(title, description, columnName, dueDate);

          await streamCompletion(prompt, (chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            );
          });

          const log = await prisma.aILog.create({
            data: {
              taskId: taskId ?? null,
              type: "PRIORITIZE",
              input: { taskId, sprintId, title, description, columnName, dueDate },
              output: { reasoning: "", result: "" },
              confidence: 0.8,
            },
          });

          await incrementWorkspaceQuota(sprint.board.workspaceId);

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
}
