import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { getLocale, getTranslations } from "next-intl/server";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { WorkspaceSidebarNav } from "@/components/layout/workspace-sidebar-nav";
import { TopNavbar } from "@/components/layout/top-navbar";
import { WorkspaceSwitcherCard } from "@/components/layout/workspace-switcher-card";
import { PlanCard } from "@/components/layout/plan-card";
import { ToastProvider } from "@/contexts/toast-context";
import { ShortcutsProvider } from "@/contexts/shortcuts-context";
import { ShortcutsPanel } from "@/components/keyboard/shortcuts-panel";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { CommandPaletteProvider } from "@/contexts/command-palette-context";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  Sentry.setUser({
    id: session.user.id,
    email: session.user.email,
  });

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: session.user.id },
    include: {
      workspace: {
        include: {
          boards: {
            select: { id: true, name: true },
          },
          _count: { select: { members: true } },
        },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });

  const unreadNotificationCount = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const locale = (await getLocale()) as "fr" | "en";
  const tSettings = await getTranslations("settings");

  const firstBoard = memberships[0]?.workspace?.boards?.[0];

  return (
    <ToastProvider>
    <ShortcutsProvider>
    <CommandPaletteProvider>
    <div className="flex flex-col h-screen bg-background dot-grid-bg">
      <TopNavbar
        memberships={memberships}
        unreadCount={unreadNotificationCount}
        notifications={recentNotifications}
        userId={session.user.id}
        userName={session.user.name}
        userEmail={session.user.email}
        locale={locale}
        notificationLabels={{
          title: tSettings("notifications"),
          markAllRead: tSettings("markAllRead"),
          nothingHereYet: tSettings("nothingHereYet"),
          seeAllActivity: tSettings("seeAllActivity"),
        }}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-[260px] bg-surface-container/95 backdrop-blur-sm border-r border-outline-variant/50 flex-col">
          <WorkspaceSwitcherCard memberships={memberships} />
          <WorkspaceSidebarNav memberships={memberships} />
          <PlanCard memberships={memberships} />
        </aside>

        <MobileSidebar memberships={memberships} userName={session.user.name} />

        <main className="flex-1 overflow-auto scroll-smooth">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
    <ShortcutsPanel />
    <CommandPalette />
    {!user?.onboardingCompleted && (
      <OnboardingTour boardId={firstBoard?.id} />
    )}
    </CommandPaletteProvider>
    </ShortcutsProvider>
    </ToastProvider>
  );
}
