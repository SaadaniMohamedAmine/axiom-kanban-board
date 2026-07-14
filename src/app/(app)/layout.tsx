import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { getLocale, getTranslations } from "next-intl/server";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SettingsLink } from "@/components/layout/settings-link";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
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
  const t = await getTranslations("nav");
  const tSettings = await getTranslations("settings");

  const firstBoard = memberships[0]?.workspace?.boards?.[0];
  const workspaceSlugs = memberships.map((m) => m.workspace.slug);

  return (
    <ToastProvider>
    <ShortcutsProvider>
    <CommandPaletteProvider>
    <div className="flex h-screen bg-background dot-grid-bg">
      <aside className="hidden md:flex w-[260px] bg-surface-container/95 backdrop-blur-sm border-r border-outline-variant/50 flex flex-col">
        <div className="p-6 border-b border-outline-variant/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
              <rect height="7" width="7" x="3" y="3"></rect>
              <rect height="7" width="7" x="14" y="3"></rect>
              <rect height="7" width="7" x="14" y="14"></rect>
              <rect height="7" width="7" x="3" y="14"></rect>
            </svg>
          </div>
          <h1 className="text-h3 font-semibold text-on-surface tracking-tight">Axiom</h1>
        </div>
        <SidebarNav
          memberships={memberships}
          workspacesLabel={t("workspaces")}
          newWorkspaceLabel={t("newWorkspace")}
          analyticsLabel={t("analytics")}
        />
        <div className="p-4 border-t border-outline-variant/50 space-y-1">
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full py-2.5 mb-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-label-md font-semibold transition-all"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
              <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
            </svg>
            {t("pricing")}
          </Link>
          <Link
            href={`/${memberships[0]?.workspace.slug}/audit-log`}
            className="flex items-center gap-2 px-3 py-2 text-body-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            {t("auditLog")}
          </Link>
          <SettingsLink
            workspaceSlugs={workspaceSlugs}
            fallbackSlug={memberships[0]?.workspace.slug}
          />
        </div>
      </aside>

      <MobileSidebar memberships={memberships} userName={session.user.name} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="hidden md:flex h-16 bg-surface-container/80 backdrop-blur-md border-b border-outline-variant/50 items-center px-6 shadow-sm">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell
              workspaceSlugs={workspaceSlugs}
              fallbackSlug={memberships[0]?.workspace.slug}
              unreadCount={unreadNotificationCount}
              notifications={recentNotifications}
              userId={session.user.id}
              labels={{
                title: tSettings("notifications"),
                markAllRead: tSettings("markAllRead"),
                nothingHereYet: tSettings("nothingHereYet"),
                seeAllActivity: tSettings("seeAllActivity"),
              }}
            />
            <LocaleSwitcher currentLocale={locale} />
            <ThemeToggle />
            <span className="text-body-md text-on-surface-variant">
              {session.user.name}
            </span>
            <SignOutButton />
          </div>
        </header>
        <div className="flex-1 overflow-auto scroll-smooth">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
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
