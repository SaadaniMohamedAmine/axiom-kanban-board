import { prisma } from "./prisma";

export async function generateTaskCode(boardId: string): Promise<string> {
  const board = await prisma.board.update({
    where: { id: boardId },
    data: { taskCounter: { increment: 1 } },
    select: { taskCounter: true },
  });

  const counter = board.taskCounter;
  const paddedCounter = counter.toString().padStart(4, "0");
  return `AX-${paddedCounter}`;
}
