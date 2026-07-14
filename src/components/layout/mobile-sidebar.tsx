"use client";

import { useState } from "react";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

interface MobileSidebarProps {
  memberships: {
    workspace: {
      id: string;
      name: string;
      slug: string;
      boards: { id: string; name: string }[];
    };
  }[];
  userName: string;
}

export function MobileSidebar({ memberships, userName }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="md:hidden h-14 bg-surface-container border-b border-outline-variant flex items-center px-4 gap-3 sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
          aria-label="Open menu"
        >
          <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </button>
        <span className="text-[16px] font-semibold text-on-surface">Axiom</span>
      </header>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-surface-container border-r border-outline-variant z-50 flex flex-col transform transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-outline-variant flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-on-surface">Axiom</h1>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
          >
            <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="18">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
            Workspaces
          </div>
          {memberships.map((m) => (
            <div key={m.workspace.id} className="mb-4">
              <Link
                href={`/${m.workspace.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
              >
                {m.workspace.name}
              </Link>
              <div className="ml-4 mt-1 space-y-1">
                {m.workspace.boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/${m.workspace.slug}/boards/${board.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                  >
                    {board.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-outline-variant">
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 mb-2 text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16">
              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
              <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
            </svg>
            Pricing
          </Link>
          <div className="flex items-center justify-between">
            <div className="text-[13px] text-on-surface-variant px-3 py-2">
              {userName}
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
