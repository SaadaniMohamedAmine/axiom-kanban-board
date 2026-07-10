import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@axiom.dev" },
    update: {},
    create: {
      email: "demo@axiom.dev",
      name: "Demo User",
      emailVerified: true,
    },
  });

  console.log(`Created demo user: ${demoUser.email}`);

  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      ownerId: demoUser.id,
      members: {
        create: {
          userId: demoUser.id,
          role: "OWNER",
          joinedAt: new Date(),
        },
      },
    },
  });

  console.log(`Created workspace: ${workspace.name}`);

  const board = await prisma.board.create({
    data: {
      workspaceId: workspace.id,
      name: "Demo Board",
      template: "KANBAN",
      columns: {
        create: [
          { name: "To Do", order: 1000, color: "#6B7280" },
          { name: "In Progress", order: 2000, color: "#3B82F6" },
          { name: "Done", order: 3000, color: "#10B981" },
        ],
      },
    },
  });

  console.log(`Created board: ${board.name} with 3 columns`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
