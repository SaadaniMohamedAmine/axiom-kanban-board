import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createNotification } from "@/lib/notifications/create";
import { sendWelcomeEmail } from "@/lib/email/send";
import { notifyLogin } from "@/lib/actions/notification.actions";
import { prisma } from "@/lib/prisma";

// Better Auth redirects the browser here (GET) once an OAuth callback
// succeeds — there's no client-side "success" moment to hook into like the
// email/password flow has, since signIn.social() navigates away before its
// promise resolves. `type` tells us which page started the flow.
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    if (type === "signup") {
      void sendWelcomeEmail({ to: session.user.email, userName: session.user.name }).catch(() => {});
      const t = await getTranslations("notificationMessages");
      void createNotification({
        userId: session.user.id,
        type: "welcome",
        title: t("welcome.title"),
        message: t("welcome.message", { name: session.user.name }),
      });
    } else {
      void notifyLogin();
    }
  }

  const notifyKey = type === "signup" ? "welcome" : "welcome_back";

  // /dashboard server-redirects to /workspaces/new for a 0-workspace account
  // (true for every fresh signup, and possible for a login too if the user
  // left/deleted all their workspaces). Landing the client mid-transition on
  // /dashboard just to get bounced elsewhere corrupts Next's router state —
  // resolve the real destination here instead.
  const hasWorkspace = session
    ? (await prisma.workspaceMember.count({ where: { userId: session.user.id } })) > 0
    : false;
  const destination = hasWorkspace ? "/dashboard" : "/workspaces/new";

  return NextResponse.redirect(new URL(`${destination}?notify=${notifyKey}`, req.url));
}
