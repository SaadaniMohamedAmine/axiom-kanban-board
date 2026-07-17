"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { unarchiveWorkspace } from "@/lib/actions/workspace.actions";
import { useToast } from "@/contexts/toast-context";

interface ArchivedWorkspace {
  id: string;
  slug: string;
  name: string;
  role: string;
  archivedAt: string;
}

interface ArchivedWorkspaceListProps {
  workspaces: ArchivedWorkspace[];
}

export function ArchivedWorkspaceList({ workspaces: initial }: ArchivedWorkspaceListProps) {
  const t = useTranslations("workspacesPage");
  const [workspaces, setWorkspaces] = useState(initial);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleRestore(id: string, name: string) {
    setRestoringId(id);
    try {
      await unarchiveWorkspace(id);
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      toast(t("restoredToast", { name }));
    } catch (error) {
      toast(error instanceof Error ? error.message : t("restoreFailed"), "error");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="space-y-3">
      {workspaces.map((ws) => (
        <div
          key={ws.id}
          className="onboarding-glass-card flex items-center justify-between rounded-xl p-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-[13px] shrink-0">
              {ws.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-body-md text-on-surface font-medium truncate">{ws.name}</p>
              <p className="text-[12px] text-on-surface-variant/60">
                {t("archivedOn", { date: new Date(ws.archivedAt).toLocaleDateString() })}
              </p>
            </div>
          </div>

          {ws.role === "OWNER" && (
            <button
              onClick={() => handleRestore(ws.id, ws.name)}
              disabled={restoringId === ws.id}
              className="shrink-0 px-4 py-2 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {restoringId === ws.id ? t("restoring") : t("restore")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
