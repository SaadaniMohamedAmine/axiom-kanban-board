import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createNotification } from "@/lib/notifications/create";
import { sendWelcomeEmail } from "@/lib/email/send";
import { notifyLogin } from "@/lib/actions/notification.actions";

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

  const authToast = type === "signup" ? "signup" : "login";
  return NextResponse.redirect(new URL(`/dashboard?authToast=${authToast}`, req.url));
}
