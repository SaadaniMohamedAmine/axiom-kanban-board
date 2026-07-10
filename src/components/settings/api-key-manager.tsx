"use client";

import { useState, useTransition } from "react";
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
}

export function APIKeyManager({ workspaceId, apiKeys }: Props) {
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<CreatedAPIKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newKeyName.trim()) return;
    startTransition(async () => {
      const result = await createAPIKey(workspaceId, newKeyName.trim());
      setCreatedKey(result);
      setNewKeyName("");
    });
  }

  function handleCopy() {
    if (!createdKey) return;
    void navigator.clipboard.writeText(createdKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRevoke(keyId: string) {
    startTransition(async () => {
      await revokeAPIKey(workspaceId, keyId);
    });
  }

  return (
    <section>
      <h2 className="text-[16px] font-semibold text-on-surface mb-1">API Keys</h2>
      <p className="text-[13px] text-on-surface-variant/70 mb-5">
        Keys authenticate requests to <code className="font-mono text-[12px]">/api/v1/</code>. Store them securely — they are shown only once.
      </p>

      {createdKey && (
        <div className="mb-5 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="text-[12px] font-semibold text-green-400 mb-2">
            Copy your key now — it will not be shown again.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[12px] text-on-surface bg-surface-container-highest px-3 py-2 rounded-lg truncate">
              {createdKey.rawKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-2 text-[12px] bg-primary text-white rounded-lg hover:brightness-110 transition-all"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Key name (e.g. GitHub Actions)"
          className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container text-[13px] text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={handleCreate}
          disabled={!newKeyName.trim() || isPending}
          className="shrink-0 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-medium hover:brightness-110 transition-all disabled:opacity-50"
        >
          Generate
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <p className="text-[13px] text-on-surface-variant/50 text-center py-6">
          No API keys yet.
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
                      Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                disabled={isPending}
                className="text-[12px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
