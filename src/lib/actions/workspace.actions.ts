"use server";

import { randomBytes } from "crypto";
import { prisma } from "../prisma";
import { requireRole } from "../permissions";
import { getPlanLimits } from "../billing/plan-limits";
import { createAuditLog } from "../audit/log";
import { createNotification } from "../notifications/create";
import { getTranslations } from "next-intl/server";
import {
  createWorkspaceSchema,
  renameWorkspaceSchema,
  inviteMemberSchema,
  acceptInvitationSchema,
  type CreateWorkspaceInput,
  type RenameWorkspaceInput,
  type InviteMemberInput,
  type AcceptInvitationInput,
} from "../validations/workspace.schema";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendInvitationEmail } from "../email/send";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createWorkspace(input: CreateWorkspaceInput) {
  const validated = createWorkspaceSchema.parse(input);
  const { name } = validated;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const slug = generateSlug(name);

  const existingWorkspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (existingWorkspace) {
    throw new Error("Workspace with this name already exists");
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          joinedAt: new Date(),
        },
      },
    },
  });

  void createAuditLog({
    workspaceId: workspace.id,
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "WORKSPACE_CREATED",
    targetType: "workspace",
    targetId: workspace.id,
    targetLabel: workspace.name,
  });
  const tWsCreated = await getTranslations("notificationMessages");
  void createNotification({
    userId: session.user.id,
    type: "workspace_created",
    title: tWsCreated("workspace_created.title"),
    message: tWsCreated("workspace_created.message", { name: workspace.name }),
  });

  revalidatePath("/", "layout");
  redirect(`/${workspace.slug}`);
}

export async function renameWorkspace(input: RenameWorkspaceInput) {
  const validated = renameWorkspaceSchema.parse(input);
  const { workspaceId, name } = validated;

  await requireRole(workspaceId, "OWNER");

  const slug = generateSlug(name);

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { name, slug },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "WORKSPACE_RENAMED",
      targetType: "workspace",
      targetId: workspaceId,
      targetLabel: name,
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteWorkspace(workspaceId: string) {
  await requireRole(workspaceId, "OWNER");

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletedAt: new Date() },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "WORKSPACE_TRASHED",
      targetType: "workspace",
      targetId: workspaceId,
      targetLabel: workspace.name,
    });
    const tWsDeleted = await getTranslations("notificationMessages");
    void createNotification({
      userId: session.user.id,
      type: "workspace_deleted",
      title: tWsDeleted("workspace_deleted.title"),
      message: tWsDeleted("workspace_deleted.message", { name: workspace.name }),
    });
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function archiveWorkspace(workspaceId: string) {
  await requireRole(workspaceId, "OWNER");

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { archivedAt: new Date() },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    const tWsArchived = await getTranslations("notificationMessages");
    void createNotification({
      userId: session.user.id,
      type: "workspace_archived",
      title: tWsArchived("workspace_archived.title"),
      message: tWsArchived("workspace_archived.message", { name: workspace.name }),
    });
    void createAuditLog({
      workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "WORKSPACE_ARCHIVED",
      targetType: "workspace",
      targetId: workspaceId,
      targetLabel: workspace.name,
    });
  }

  revalidatePath("/workspaces", "page");
  return { success: true };
}

export async function unarchiveWorkspace(workspaceId: string) {
  await requireRole(workspaceId, "OWNER");

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { archivedAt: null },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "WORKSPACE_UNARCHIVED",
      targetType: "workspace",
      targetId: workspaceId,
      targetLabel: workspace.name,
    });
  }

  revalidatePath("/workspaces", "page");
  revalidatePath("/workspaces/archived", "page");
  return { success: true };
}

export async function restoreWorkspace(workspaceId: string) {
  await requireRole(workspaceId, "OWNER");

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletedAt: null },
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    void createAuditLog({
      workspaceId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "WORKSPACE_RESTORED",
      targetType: "workspace",
      targetId: workspaceId,
      targetLabel: workspace.name,
    });
  }

  revalidatePath("/workspaces", "page");
  revalidatePath("/workspaces/trash", "page");
  return { success: true };
}

export async function permanentlyDeleteWorkspace(workspaceId: string) {
  await requireRole(workspaceId, "OWNER");

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  revalidatePath("/workspaces/trash", "page");
  return { success: true };
}

export async function inviteMember(input: InviteMemberInput) {
  const validated = inviteMemberSchema.parse(input);
  const { workspaceId, email, role } = validated;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  await requireRole(workspaceId, "ADMIN");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true, plan: true, _count: { select: { members: true } } },
  });
  if (!workspace) throw new Error("Workspace not found");
  const limits = getPlanLimits(workspace.plan);
  if (workspace._count.members >= limits.maxMembers) {
    throw new Error(`PLAN_LIMIT_MEMBERS:${workspace.plan}`);
  }

  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: { email },
    },
  });

  if (existingMember) {
    throw new Error("User is already a member of this workspace");
  }

  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      workspaceId,
      email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvitation) {
    throw new Error("An invitation is already pending for this email");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.invitation.create({
    data: {
      workspaceId,
      email,
      role,
      token,
      status: "PENDING",
      expiresAt,
    },
  });

  void createAuditLog({
    workspaceId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: "MEMBER_INVITED",
    targetType: "user",
    targetLabel: email,
    metadata: { role },
  });

  void sendInvitationEmail({
    to: email,
    workspaceName: workspace.name,
    inviterName: session.user.name,
    role: role,
    inviteToken: token,
    expiresInDays: 7,
  }).catch(() => {});

  revalidatePath(`/[workspaceSlug]/settings`, "page");
  return { success: true };
}

export async function acceptInvitation(input: AcceptInvitationInput) {
  const validated = acceptInvitationSchema.parse(input);
  const { token } = validated;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Not authenticated");

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Invitation is no longer pending");
  }

  if (invitation.email !== session.user.email) {
    throw new Error("This invitation was sent to a different email address");
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("Invitation has expired");
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: session.user.id,
        role: invitation.role,
        joinedAt: new Date(),
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    }),
  ]);

  revalidatePath("/", "layout");
  redirect(`/${invitation.workspace.slug}`);
}
