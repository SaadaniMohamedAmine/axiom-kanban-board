import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { AuditAction } from "@prisma/client";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);
  const actor = url.searchParams.get("actor") ?? undefined;
  const action = url.searchParams.get("action") ?? undefined;

  if (!workspaceId) return new Response("Missing workspaceId", { status: 400 });

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    select: { role: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.auditLog.findMany({
    where: {
      workspaceId,
      createdAt: { gte: sinceDate },
      ...(actor ? { actorEmail: { contains: actor, mode: "insensitive" } } : {}),
      ...(action ? { action: action as AuditAction } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      createdAt: true,
      actorEmail: true,
      action: true,
      targetType: true,
      targetLabel: true,
      ipAddress: true,
    },
  });

  const csv = Papa.unparse(
    logs.map((log) => ({
      Date: log.createdAt.toISOString(),
      Actor: log.actorEmail,
      Action: log.action,
      "Target Type": log.targetType ?? "",
      Target: log.targetLabel ?? "",
      "IP Address": log.ipAddress ?? "",
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="axiom-audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
