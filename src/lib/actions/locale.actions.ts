"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE } from "@/lib/locale";

export async function updateLocale(locale: "fr" | "en"): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });

  // Cookie covers signed-out visitors (landing page) and gives an instant
  // switch; DB is the durable source of truth once a user is signed in.
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  if (session) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale },
    });
  }

  revalidatePath("/", "layout");
}
