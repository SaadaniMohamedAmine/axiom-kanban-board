import { getRequestConfig } from "next-intl/server";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { LOCALE_COOKIE } from "@/lib/locale";

export default getRequestConfig(async () => {
  let locale: "fr" | "en" = "fr";

  // The cookie is the fastest, session-agnostic signal — set the instant
  // the switcher is used, so it wins even before a signed-in user's DB
  // write has had a chance to matter (and it's the only signal at all for
  // signed-out visitors on the landing page).
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "en" || cookieLocale === "fr") {
    locale = cookieLocale;
  } else {
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

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
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
