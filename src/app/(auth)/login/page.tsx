import { getLocale } from "next-intl/server";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { LoginClient } from "./login-client";

export default async function LoginPage() {
  const locale = await getLocale();

  return (
    <>
      <SiteNav currentLocale={locale as "fr" | "en"} />
      <LoginClient />
      <SiteFooter />
    </>
  );
}
