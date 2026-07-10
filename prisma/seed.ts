import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  const user = await prisma.user.upsert({
    where: { email: "demo@axiom.dev" },
    update: {},
    create: {
      name: "Alex Chen",
      email: "demo@axiom.dev",
      emailVerified: true,
      image: null,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "axiom-demo" },
    update: {},
    create: {
      name: "Axiom Demo",
      slug: "axiom-demo",
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  const board = await prisma.board.upsert({
    where: { id: "demo-board-1" },
    update: {},
    create: {
      id: "demo-board-1",
      workspaceId: workspace.id,
      name: "Product Board",
      template: "KANBAN",
      taskCounter: 12,
    },
  });

  const COLUMNS = [
    { id: "col-backlog", name: "Backlog", order: 0 },
    { id: "col-todo", name: "To Do", order: 1 },
    { id: "col-progress", name: "In Progress", order: 2 },
    { id: "col-review", name: "In Review", order: 3 },
    { id: "col-done", name: "Done", order: 4 },
  ];

  for (const col of COLUMNS) {
    await prisma.column.upsert({
      where: { id: col.id },
      update: {},
      create: { id: col.id, boardId: board.id, name: col.name, order: col.order },
    });
  }

  const TASKS = [
    { id: "task-1", code: "AX-1", title: "Design token system for dark mode", columnId: "col-done", priority: "HIGH" as const, estimate: 3 },
    { id: "task-2", code: "AX-2", title: "Implement Pusher realtime sync", columnId: "col-done", priority: "HIGH" as const, estimate: 5 },
    { id: "task-3", code: "AX-3", title: "AI priority inference — Groq integration", columnId: "col-done", priority: "URGENT" as const, estimate: 8 },
    { id: "task-4", code: "AX-4", title: "Sprint burndown chart", columnId: "col-review", priority: "MEDIUM" as const, estimate: 5 },
    { id: "task-5", code: "AX-5", title: "Stripe billing integration", columnId: "col-progress", priority: "HIGH" as const, estimate: 8 },
    { id: "task-6", code: "AX-6", title: "Audit log CSV export", columnId: "col-progress", priority: "MEDIUM" as const, estimate: 3 },
    { id: "task-7", code: "AX-7", title: "i18n FR/EN with next-intl", columnId: "col-todo", priority: "MEDIUM" as const, estimate: 5 },
    { id: "task-8", code: "AX-8", title: "Onboarding tour with driver.js", columnId: "col-todo", priority: "LOW" as const, estimate: 3 },
    { id: "task-9", code: "AX-9", title: "Playwright e2e — board CRUD", columnId: "col-backlog", priority: "HIGH" as const, estimate: 5 },
    { id: "task-10", code: "AX-10", title: "GitHub Actions CI pipeline", columnId: "col-backlog", priority: "MEDIUM" as const, estimate: 2 },
    { id: "task-11", code: "AX-11", title: "OG image via Edge runtime", columnId: "col-backlog", priority: "LOW" as const, estimate: 2 },
    { id: "task-12", code: "AX-12", title: "PWA manifest and service worker", columnId: "col-backlog", priority: "MEDIUM" as const, estimate: 3 },
  ];

  for (const task of TASKS) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        boardId: board.id,
        columnId: task.columnId,
        code: task.code,
        title: task.title,
        priority: task.priority,
        estimate: task.estimate,
        order: parseInt(task.id.replace("task-", ""), 10),
      },
    });
  }

  await prisma.sprint.upsert({
    where: { id: "demo-sprint-1" },
    update: {},
    create: {
      id: "demo-sprint-1",
      boardId: board.id,
      name: "Sprint 1 — Core",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-14"),
      status: "ACTIVE",
    },
  });

  console.log("✓ Demo data seeded");
  console.log(`  User: demo@axiom.dev`);
  console.log(`  Workspace: axiom-demo`);
  console.log(`  Board: Product Board (${TASKS.length} tasks)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
