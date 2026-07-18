import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { LandingPage } from "@/components/marketing/landing-page";
import { JsonLd } from "@/components/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban-board.vercel.app";

const SOFTWARE_APPLICATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Axiom",
  description:
    "AI-powered Kanban board with sprint analytics, real-time collaboration, and Axiom Intelligence Engine. Built for engineering teams that ship.",
  url: APP_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    url: `${APP_URL}/pricing`,
  },
};

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
  return (
    <>
      <JsonLd data={SOFTWARE_APPLICATION_SCHEMA} />
      <LandingPage currentLocale={locale as "fr" | "en"} isAuthenticated={!!session} />
    </>
  );
}
