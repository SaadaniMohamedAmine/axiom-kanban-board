import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { LoginClient } from "./login-client";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/dashboard");
  }

  const locale = await getLocale();

  return (
    <>
      <SiteNav currentLocale={locale as "fr" | "en"} />
      <LoginClient />
      <SiteFooter />
    </>
  );
}
