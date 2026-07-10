import { getRequestConfig } from "next-intl/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default getRequestConfig(async () => {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  let locale: "fr" | "en" = "fr";

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { locale: true },
    });
    if (user?.locale === "en") locale = "en";
  } else {
    const acceptLanguage = (await headers()).get("accept-language") ?? "";
    if (acceptLanguage.toLowerCase().includes("en") && !acceptLanguage.toLowerCase().startsWith("fr")) {
      locale = "en";
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
