import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    // Brand-new accounts with no workspace yet still get funneled into
    // onboarding — but existing users are allowed to land on the public
    // marketing page too (e.g. clicking the Axiom logo from inside the
    // app), which SiteNav renders in its authenticated state for them.
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!membership) {
      redirect("/workspaces/new");
    }
  }

  const locale = await getLocale();
  return <LandingPage currentLocale={locale as "fr" | "en"} isAuthenticated={!!session} />;
}
