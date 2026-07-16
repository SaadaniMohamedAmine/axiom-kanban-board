import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pusher } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

const BOARD_CHANNEL_PATTERN = /^presence-board-(.+)$/;
const WORKSPACE_CHANNEL_PATTERN = /^presence-workspace-(.+)$/;

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

  const boardMatch = channelName.match(BOARD_CHANNEL_PATTERN);
  const workspaceMatch = channelName.match(WORKSPACE_CHANNEL_PATTERN);

  if (!boardMatch && !workspaceMatch) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let workspaceId: string;

  if (boardMatch) {
    const board = await prisma.board.findUnique({
      where: { id: boardMatch[1] },
      select: { workspaceId: true },
    });
    if (!board) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    workspaceId = board.workspaceId;
  } else {
    workspaceId = workspaceMatch![1];
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
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
