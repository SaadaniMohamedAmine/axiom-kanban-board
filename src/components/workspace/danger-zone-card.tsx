"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteWorkspace } from "@/lib/actions/workspace.actions";
import { useToast } from "@/contexts/toast-context";

interface DangerZoneCardProps {
  workspaceId: string;
  workspaceName: string;
  canDelete: boolean;
}

export function DangerZoneCard({ workspaceId, workspaceName, canDelete }: DangerZoneCardProps) {
  const t = useTranslations("settings");
  const tActions = useTranslations("actions");
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteWorkspace(workspaceId);
    } catch (err) {
      toast(err instanceof Error ? err.message : t("deleteWorkspaceFailed"), "error");
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-error/30 bg-error/5 p-6">
      <div className="text-[11px] font-semibold text-error uppercase tracking-wider mb-1">
        {t("dangerZone")}
      </div>
      <p className="text-[13px] text-on-surface-variant mb-4 max-w-lg">
        {t("deleteWorkspaceDesc")}
      </p>

      {!canDelete ? (
        <p className="text-[12px] text-on-surface-variant/60">{t("ownerOnlyDelete")}</p>
      ) : !confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="px-5 py-2 border border-error/40 text-error rounded-lg text-[13px] font-semibold hover:bg-error/10 transition-colors cursor-pointer"
        >
          {t("deleteWorkspace")}
        </button>
      ) : (
        <div className="space-y-3">
          <label className="block text-[12px] text-on-surface-variant">
            {t("deleteWorkspaceConfirmPrompt", { name: workspaceName })}
          </label>
          <input
            type="text"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={workspaceName}
            autoFocus
            className="w-full max-w-xs bg-surface-container-lowest border border-error/30 rounded px-4 py-2 text-[13px] text-on-surface focus:outline-none focus:ring-1 focus:ring-error transition-all"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={confirmValue !== workspaceName || isDeleting}
              className="px-5 py-2 bg-error text-on-error rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isDeleting ? t("deleteWorkspaceConfirming") : t("deleteWorkspace")}
            </button>
            <button
              onClick={() => { setConfirming(false); setConfirmValue(""); }}
              disabled={isDeleting}
              className="px-5 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-[13px] font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              {tActions("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
