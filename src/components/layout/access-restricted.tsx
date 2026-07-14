"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestWorkspaceAccess } from "@/lib/actions/access-request.actions";

interface AccessRestrictedProps {
  workspaceId: string;
  resourceLabel: string;
  backHref: string;
  labels: {
    title: string;
    description: string;
    roleBadge: string;
    requestAccess: string;
    requesting: string;
    requestSent: string;
    backToDashboard: string;
    statusCode: string;
  };
}

export function AccessRestricted({
  workspaceId,
  resourceLabel,
  backHref,
  labels,
}: AccessRestrictedProps) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleRequestAccess() {
    startTransition(async () => {
      await requestWorkspaceAccess(workspaceId, resourceLabel);
      setSent(true);
    });
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center rounded-2xl border border-outline-variant/20 bg-surface-container/60 backdrop-blur-sm px-8 py-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative mb-8 inline-block">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-container-highest border border-outline-variant/50 flex items-center justify-center">
            <svg fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="32" className="text-outline">
              <rect height="11" rx="2" width="18" x="3" y="11" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-surface-container rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-outline rounded-full" />
          </div>
        </div>

        <h1 className="text-[26px] font-semibold text-on-surface mb-3 tracking-tight relative">{labels.title}</h1>

        <div className="space-y-4 mb-10 relative">
          <p className="text-on-surface-variant text-[15px]">{labels.description}</p>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="16" className="text-primary shrink-0">
              <path d="M20 13c0 5-3.5 7.5-7.35 8.95a1 1 0 0 1-1.3 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.79 17 5 19 5a1 1 0 0 1 1 1z" />
            </svg>
            <span className="font-mono text-[12px] text-on-surface/80">
              {labels.roleBadge}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
          <button
            onClick={handleRequestAccess}
            disabled={isPending || sent}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-md text-[14px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:brightness-110 transition-all disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
          >
            {sent ? (
              <>
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {labels.requestSent}
              </>
            ) : isPending ? (
              <>
                <svg className="animate-spin" fill="none" height="16" viewBox="0 0 24 24" width="16">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {labels.requesting}
              </>
            ) : (
              <>
                <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                {labels.requestAccess}
              </>
            )}
          </button>
          <Link
            href={backHref}
            className="px-6 py-3 border border-outline-variant text-on-surface rounded-md text-[14px] font-medium hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
          >
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            {labels.backToDashboard}
          </Link>
        </div>

        <p className="mt-10 pt-6 border-t border-outline-variant/10 text-[11px] text-on-surface-variant/50 font-mono uppercase tracking-wide relative">
          {labels.statusCode}
        </p>
      </div>
    </div>
  );
}
