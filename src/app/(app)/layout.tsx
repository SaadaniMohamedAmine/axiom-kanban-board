import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { getLocale, getTranslations } from "next-intl/server";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { WorkspaceSidebarNav } from "@/components/layout/workspace-sidebar-nav";
import { TopNavbar } from "@/components/layout/top-navbar";
import { PlanCard } from "@/components/layout/plan-card";
import { CollapsibleSidebar } from "@/components/layout/collapsible-sidebar";
import { SidebarToggleButton } from "@/components/layout/sidebar-toggle-button";
import { ToastProvider } from "@/contexts/toast-context";
import { NotificationToastListener } from "@/components/layout/notification-toast-listener";
import { SidebarProvider } from "@/contexts/sidebar-context";
import { ShortcutsProvider } from "@/contexts/shortcuts-context";
import { ShortcutsPanel } from "@/components/keyboard/shortcuts-panel";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { CommandPaletteProvider } from "@/contexts/command-palette-context";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { CreateTaskProvider } from "@/contexts/create-task-context";
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

  // These are all independent of each other — running them sequentially
  // (as separate `await`s) previously added one full DB round-trip per
  // query to *every* navigation within the app, since this layout re-runs
  // on every page load.
  const [memberships, user, unreadNotificationCount, recentNotifications, locale, tSettings] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { userId: session.user.id, workspace: { archivedAt: null, deletedAt: null } },
      include: {
        workspace: {
          include: {
            boards: {
              where: { archivedAt: null, deletedAt: null },
              select: { id: true, name: true },
            },
            _count: { select: { members: true } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    getLocale() as Promise<"fr" | "en">,
    getTranslations("settings"),
  ]);

  const firstBoard = memberships[0]?.workspace?.boards?.[0];

  return (
    <ToastProvider>
    <NotificationToastListener userName={session.user.name} />
    <ShortcutsProvider>
    <CommandPaletteProvider>
    <SidebarProvider>
    <CreateTaskProvider>
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
        <CollapsibleSidebar>
          <WorkspaceSidebarNav memberships={memberships} />
          <PlanCard memberships={memberships} />
        </CollapsibleSidebar>

        <MobileSidebar memberships={memberships} userName={session.user.name} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="hidden md:block shrink-0 p-3">
            <SidebarToggleButton />
          </div>
          <div className="flex-1 overflow-auto scroll-smooth">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
    <ShortcutsPanel />
    <CommandPalette memberships={memberships} />
    {!user?.onboardingCompleted && (
      <OnboardingTour boardId={firstBoard?.id} />
    )}
    </CreateTaskProvider>
    </SidebarProvider>
    </CommandPaletteProvider>
    </ShortcutsProvider>
    </ToastProvider>
  );
}
