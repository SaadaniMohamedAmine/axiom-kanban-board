"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Membership {
  workspace: {
    id: string;
    slug: string;
    name: string;
    boards: { id: string; name: string }[];
  };
}

interface SidebarNavProps {
  memberships: Membership[];
  workspacesLabel: string;
  newWorkspaceLabel: string;
  analyticsLabel: string;
}

export function SidebarNav({ memberships, workspacesLabel, newWorkspaceLabel, analyticsLabel }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 overflow-y-auto">
      <div id="sidebar-workspaces" className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">
        {workspacesLabel}
      </div>
      {memberships.map((membership) => {
        const workspaceHref = `/${membership.workspace.slug}`;
        const workspaceActive = pathname === workspaceHref;

        return (
          <div key={membership.workspace.id} className="mb-4">
            <Link
              href={workspaceHref}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-body-md transition-all ${
                workspaceActive
                  ? "bg-primary/10 text-primary border-r-2 border-primary translate-x-1"
                  : "text-on-surface hover:bg-surface-container-high"
              }`}
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
              {membership.workspace.boards.map((board) => {
                const boardHref = `/${membership.workspace.slug}/boards/${board.id}`;
                const boardActive = pathname === boardHref;
                const analyticsHref = `${boardHref}/analytics`;
                const analyticsActive = pathname === analyticsHref;

                return (
                  <div key={board.id}>
                    <Link
                      href={boardHref}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-label-md transition-all ${
                        boardActive
                          ? "bg-primary/10 text-primary border-r-2 border-primary translate-x-1"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                      }`}
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
                      href={analyticsHref}
                      className={`flex items-center gap-2 pl-7 pr-3 py-1 text-[12px] rounded transition-all ${
                        analyticsActive
                          ? "text-primary bg-primary/10"
                          : "text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="12">
                        <line x1="18" x2="18" y1="20" y2="10" />
                        <line x1="12" x2="12" y1="20" y2="4" />
                        <line x1="6" x2="6" y1="20" y2="14" />
                      </svg>
                      {analyticsLabel}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Link
        href="/workspaces/new"
        className="flex items-center gap-2 px-3 py-2 text-body-md text-primary hover:bg-primary/10 rounded-lg transition-colors mt-4"
      >
        <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
          <line x1="12" x2="12" y1="5" y2="19"></line>
          <line x1="5" x2="19" y1="12" y2="12"></line>
        </svg>
        {newWorkspaceLabel}
      </Link>
    </nav>
  );
}
