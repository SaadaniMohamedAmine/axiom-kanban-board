import { render } from "@react-email/render";
import { getResendClient, FROM_ADDRESS } from "./resend";
import { InvitationEmail } from "./templates/invitation";
import { WelcomeEmail } from "./templates/welcome";
import { TaskAssignedEmail } from "./templates/task-assigned";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban-board.vercel.app";

export async function sendInvitationEmail(params: {
  to: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteToken: string;
  expiresInDays: number;
}) {
  const inviteUrl = `${APP_URL}/accept-invitation?token=${params.inviteToken}`;

  const html = await render(
    InvitationEmail({
      workspaceName: params.workspaceName,
      inviterName: params.inviterName,
      role: params.role,
      inviteUrl,
      expiresInDays: params.expiresInDays,
    })
  );

  return getResendClient().emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `You have been invited to join ${params.workspaceName} on Axiom`,
    html,
  });
}

export async function sendWelcomeEmail(params: { to: string; userName: string }) {
  const html = await render(WelcomeEmail({ userName: params.userName, appUrl: APP_URL }));

  return getResendClient().emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: "Welcome to Axiom",
    html,
  });
}

export async function sendTaskAssignedEmail(params: {
  to: string;
  recipientName: string;
  assignerName: string;
  taskCode: string;
  taskTitle: string;
  boardName: string;
  boardId: string;
  taskId: string;
  workspaceSlug: string;
}) {
  const taskUrl = `${APP_URL}/${params.workspaceSlug}/boards/${params.boardId}?task=${params.taskId}`;

  const html = await render(
    TaskAssignedEmail({
      recipientName: params.recipientName,
      assignerName: params.assignerName,
      taskCode: params.taskCode,
      taskTitle: params.taskTitle,
      boardName: params.boardName,
      taskUrl,
    })
  );

  return getResendClient().emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: `${params.taskCode}: ${params.taskTitle} — assigned to you`,
    html,
  });
}
