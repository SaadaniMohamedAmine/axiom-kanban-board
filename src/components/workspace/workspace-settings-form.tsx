"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { renameWorkspace } from "@/lib/actions/workspace.actions";
import { useToast } from "@/contexts/toast-context";

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
  const tActions = useTranslations("actions");
  const [value, setValue] = useState(name);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || value.trim() === name) return;

    setIsSaving(true);
    try {
      await renameWorkspace({ workspaceId, name: value.trim() });
      toast(t("workspaceUpdated"));
      router.push(`/${generateSlug(value.trim())}/settings/workspace`);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : t("workspaceUpdateFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-surface-container border border-outline-variant rounded-lg space-y-4"
    >
      <div>
        <label className="block text-label-md text-on-surface-variant mb-1">{t("slug")}</label>
        <input
          type="text"
          value={slug}
          disabled
          className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface-variant opacity-60"
        />
        <p className="text-label-md text-on-surface-variant/60 mt-1">
          {t("slugHint")}
        </p>
      </div>
      <div>
        <label className="block text-label-md text-on-surface-variant mb-1">{tAccount("name")}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!canEdit}
          className="w-full px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
        />
      </div>
      {canEdit ? (
        <button
          type="submit"
          disabled={isSaving || !value.trim() || value.trim() === name}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSaving ? tAccount("saving") : tActions("save")}
        </button>
      ) : (
        <p className="text-label-md text-on-surface-variant/60">
          {t("ownerOnlyRename")}
        </p>
      )}
    </form>
  );
}
