import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    // Authenticated → redirect to the dashboard
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!membership) {
      redirect("/workspaces/new");
    }

    redirect("/dashboard");
  }

  // Not authenticated → show public landing page
  const locale = await getLocale();
  return <LandingPage currentLocale={locale as "fr" | "en"} />;
}
