import { getLocale } from "next-intl/server";
import { SiteNav } from "@/components/marketing/site-nav";
import { SignUpClient } from "./sign-up-client";

export default async function SignUpPage() {
  const locale = await getLocale();

  return (
    <>
      <SiteNav currentLocale={locale as "fr" | "en"} />
      <SignUpClient />
    </>
  );
}
