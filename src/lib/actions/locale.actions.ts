"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateLocale(locale: "fr" | "en"): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { locale },
  });

  revalidatePath("/", "layout");
}
