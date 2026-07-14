"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { renameWorkspace } from "@/lib/actions/workspace.actions";
import { useToast } from "@/contexts/toast-context";
import { SettingsCard } from "@/components/settings/settings-card";
import { RippleButton } from "@/components/ui/ripple-button";

interface WorkspaceSettingsFormProps {
  workspaceId: string;
  name: string;
  slug: string;
  canEdit: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function WorkspaceSettingsForm({ workspaceId, name, slug, canEdit }: WorkspaceSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("settings");
  const tAccount = useTranslations("accountForm");
  const [value, setValue] = useState(name);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || value.trim() === name) return;

    setIsSaving(true);
    try {
      await renameWorkspace({ workspaceId, name: value.trim() });
      toast(t("workspaceUpdated"));
      router.push(`/${generateSlug(value.trim())}/settings#workspace`);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("workspaceUpdateFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-4 py-2.5 text-on-surface focus:outline-none input-glow transition-all text-body-md";

  return (
    <SettingsCard title={t("workspace")} badge={{ label: tAccount("generalBadge"), tone: "primary" }}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="font-label-md text-label-md text-on-surface-variant ml-1">{t("slug")}</label>
          <input type="text" value={slug} disabled className={`${inputClass} opacity-60`} />
          <p className="text-label-md text-on-surface-variant/60 ml-1">{t("slugHint")}</p>
        </div>
        <div className="space-y-2">
          <label className="font-label-md text-label-md text-on-surface-variant ml-1">{tAccount("name")}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!canEdit}
            className={`${inputClass} disabled:opacity-60`}
          />
        </div>
        <div className="flex justify-end pt-2">
          {canEdit ? (
            <RippleButton
              type="submit"
              disabled={isSaving || !value.trim() || value.trim() === name}
              className="px-6 py-2 bg-primary text-on-primary rounded font-label-md text-label-md hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              {isSaving ? tAccount("saving") : tAccount("saveChanges")}
            </RippleButton>
          ) : (
            <p className="text-label-md text-on-surface-variant/60">{t("ownerOnlyRename")}</p>
          )}
        </div>
      </form>
    </SettingsCard>
  );
}
