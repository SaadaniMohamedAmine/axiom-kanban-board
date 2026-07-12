import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { getLocale, getTranslations } from "next-intl/server";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
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

  const locale = (await getLocale()) as "fr" | "en";
  const t = await getTranslations("nav");

  const firstBoard = memberships[0]?.workspace?.boards?.[0];
  const workspaceSlugs = memberships.map((m) => m.workspace.slug);

  return (
    <ToastProvider>
    <ShortcutsProvider>
    <CommandPaletteProvider>
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex w-[260px] bg-surface-container border-r border-outline-variant flex flex-col">
        <div className="p-6 border-b border-outline-variant">
          <h1 className="text-h3 font-semibold text-on-surface">Axiom</h1>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <div id="sidebar-workspaces" className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
            {t("workspaces")}
          </div>
          {memberships.map((membership) => (
            <div key={membership.workspace.id} className="mb-4">
              <Link
                href={`/${membership.workspace.slug}`}
                className="flex items-center gap-2 px-3 py-2 text-body-md text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
              >
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
                  <rect height="7" width="7" x="3" y="3"></rect>
                  <rect height="7" width="7" x="14" y="3"></rect>
                  <rect height="7" width="7" x="14" y="14"></rect>
                  <rect height="7" width="7" x="3" y="14"></rect>
                </svg>
                {membership.workspace.name}
              </Link>
              <div className="ml-6 mt-1 space-y-1">
                {membership.workspace.boards.map((board) => (
                  <div key={board.id}>
                    <Link
                      href={`/${membership.workspace.slug}/boards/${board.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                    >
                      <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 11l2-2 2 2"></path>
                        <path d="M4 19h16"></path>
                        <path d="M4 5h16"></path>
                        <path d="M4 12h16"></path>
                      </svg>
                      {board.name}
                    </Link>
                    <Link
                      href={`/${membership.workspace.slug}/boards/${board.id}/analytics`}
                      className="flex items-center gap-2 pl-7 pr-3 py-1 text-[12px] text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-container-high rounded transition-colors"
                    >
                      <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="12">
                        <line x1="18" x2="18" y1="20" y2="10" />
                        <line x1="12" x2="12" y1="20" y2="4" />
                        <line x1="6" x2="6" y1="20" y2="14" />
                      </svg>
                      {t("analytics")}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Link
            href="/workspaces/new"
            className="flex items-center gap-2 px-3 py-2 text-body-md text-primary hover:bg-primary/10 rounded-lg transition-colors mt-4"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
            {t("newWorkspace")}
          </Link>
        </nav>
        <div className="p-4 border-t border-outline-variant">
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
        <header className="hidden md:flex h-16 bg-surface-container border-b border-outline-variant items-center px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell
              workspaceSlugs={workspaceSlugs}
              fallbackSlug={memberships[0]?.workspace.slug}
              unreadCount={unreadNotificationCount}
            />
            <LocaleSwitcher currentLocale={locale} />
            <ThemeToggle />
            <span className="text-body-md text-on-surface-variant">
              {session.user.name}
            </span>
            <SignOutButton />
          </div>
        </header>
        <div className="flex-1 overflow-auto">
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
