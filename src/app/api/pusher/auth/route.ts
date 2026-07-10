import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusher } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

const CHANNEL_NAME_PATTERN = /^presence-board-(.+)$/;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.formData();
  const socketId = body.get("socket_id") as string | null;
  const channelName = body.get("channel_name") as string | null;

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 });
  }

  const match = channelName.match(CHANNEL_NAME_PATTERN);
  if (!match) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const boardId = match[1];

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });

  if (!board) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: board.workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const authResponse = pusher.authorizeChannel(socketId, channelName, {
    user_id: session.user.id,
    user_info: {
      id: session.user.id,
      name: session.user.name,
      image: session.user.image ?? null,
    },
  });

  return NextResponse.json(authResponse);
}
