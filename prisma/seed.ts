import { MemberRole } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

// Persistent test fixtures reused across every feature's manual QA. Keep this
// list stable so the same accounts/credentials work session after session.
const TEST_USERS: {
  name: string;
  email: string;
  password: string;
  role: MemberRole;
}[] = [
  { name: "Admin", email: "admin@gmail.com", password: "admin123@", role: "OWNER" },
  { name: "Test User 1", email: "test1@gmail.com", password: "Test1@Pass", role: "MEMBER" },
  { name: "Test User 2", email: "test2@gmail.com", password: "Test2@Pass", role: "MEMBER" },
  { name: "Test User 3", email: "test3@gmail.com", password: "Test3@Pass", role: "MEMBER" },
  { name: "Test User 4", email: "test4@gmail.com", password: "Test4@Pass", role: "MEMBER" },
  { name: "Demo Viewer", email: "demo@user.com", password: "Demo1@Pass", role: "VIEWER" },
];

async function ensureUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const { user } = await auth.api.signUpEmail({ body: { name, email, password } });
  return prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });
}

async function main() {
  console.log("Seeding database...");

  const users = new Map<string, Awaited<ReturnType<typeof ensureUser>>>();
  for (const u of TEST_USERS) {
    const user = await ensureUser(u.name, u.email, u.password);
    users.set(u.email, user);
    console.log(`Ensured user: ${user.email}`);
  }

  const admin = users.get("admin@gmail.com")!;

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      ownerId: admin.id,
      members: {
        create: {
          userId: admin.id,
          role: "OWNER",
          joinedAt: new Date(),
        },
      },
    },
  });
  console.log(`Ensured workspace: ${workspace.name}`);

  for (const u of TEST_USERS) {
    const user = users.get(u.email)!;
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      update: { role: u.role },
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        role: u.role,
        joinedAt: new Date(),
      },
    });
  }
  console.log(`Ensured ${TEST_USERS.length} workspace memberships`);

  let board = await prisma.board.findFirst({
    where: { workspaceId: workspace.id, name: "Demo Board" },
  });

  if (!board) {
    board = await prisma.board.create({
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
  } else {
    console.log(`Ensured board: ${board.name}`);
  }

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
