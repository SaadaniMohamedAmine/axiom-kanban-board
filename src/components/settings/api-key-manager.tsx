"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createAPIKey, revokeAPIKey, type CreatedAPIKey } from "@/lib/actions/api-key.actions";

interface APIKeyRecord {
  id: string;
  name: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
  apiKeys: APIKeyRecord[];
  canManage: boolean;
}

export function APIKeyManager({ workspaceId, apiKeys, canManage }: Props) {
  const t = useTranslations("devManagers");
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<CreatedAPIKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newKeyName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await createAPIKey(workspaceId, newKeyName.trim());
        setCreatedKey(result);
        setNewKeyName("");
      } catch {
        setError(t("createKeyError"));
      }
    });
  }

  function handleCopy() {
    if (!createdKey) return;
    void navigator.clipboard.writeText(createdKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke(keyId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await revokeAPIKey(workspaceId, keyId);
      } catch {
        setError(t("revokeKeyError"));
      }
    });
  }

  return (
    <section>
      <h2 className="text-[16px] font-semibold text-on-surface mb-1">{t("apiKeys")}</h2>
      <p className="text-[13px] text-on-surface-variant/70 mb-5">
        {t("apiKeysDesc")} <code className="font-mono text-[12px]">/api/v1/</code>.
      </p>

      {error && (
        <div className="mb-5 p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {createdKey && (
        <div className="mb-5 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="text-[12px] font-semibold text-green-400 mb-2">
            {t("copyKeyNow")}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[12px] text-on-surface bg-surface-container-highest px-3 py-2 rounded-lg truncate">
              {createdKey.rawKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-2 text-[12px] bg-primary text-white rounded-lg hover:brightness-110 transition-all"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        </div>
      )}

      {canManage ? (
        <div className="flex items-center gap-2 mb-5">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={t("keyNamePlaceholder")}
            className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container text-[13px] text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={handleCreate}
            disabled={!newKeyName.trim() || isPending}
            className="shrink-0 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {t("generate")}
          </button>
        </div>
      ) : (
        <p className="text-[12px] text-on-surface-variant/50 mb-5">
          {t("adminsOnlyKeys")}
        </p>
      )}

      {apiKeys.length === 0 ? (
        <p className="text-[13px] text-on-surface-variant/50 text-center py-6">
          {t("noKeysYet")}
        </p>
      ) : (
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-outline-variant/20 bg-surface-container"
            >
              <div>
                <div className="text-[13px] font-medium text-on-surface">{key.name}</div>
                <div className="text-[11px] text-on-surface-variant/50 font-mono mt-0.5">
                  {key.prefix}••••••••••••••
                  {key.lastUsedAt && (
                    <span className="ml-3 font-sans">
                      {t("lastUsed")} {new Date(key.lastUsedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {canManage && (
                <button
                  onClick={() => handleRevoke(key.id)}
                  disabled={isPending}
                  className="text-[12px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  {t("revoke")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
