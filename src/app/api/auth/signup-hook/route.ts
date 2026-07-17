import { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/send";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { createNotification } from "@/lib/notifications/create";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json() as { email: string; name: string };

  if (!email || !name) {
    return new Response(JSON.stringify({ error: "Missing email or name" }), { status: 400 });
  }

  void sendWelcomeEmail({ to: email, userName: name }).catch(() => {});

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    const t = await getTranslations("notificationMessages");
    void createNotification({
      userId: user.id,
      type: "welcome",
      title: t("welcome.title"),
      message: t("welcome.message", { name }),
    });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
