"use server";

import { randomBytes } from "crypto";
import { prisma } from "../prisma";
import { requireRole } from "../permissions";
import { getPlanLimits } from "../billing/plan-limits";
import { createAuditLog } from "../audit/log";
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

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  revalidatePath("/", "layout");
  redirect("/");
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

  revalidatePath(`/[workspaceSlug]/settings/members`, "page");
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
