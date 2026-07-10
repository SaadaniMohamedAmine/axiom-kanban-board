"use client";

import { useState, useTransition } from "react";
import { createWebhook, deleteWebhook } from "@/lib/actions/webhook.actions";

const AVAILABLE_EVENTS = [
  { id: "task.created", label: "Task created" },
  { id: "task.updated", label: "Task updated" },
  { id: "task.deleted", label: "Task deleted" },
  { id: "sprint.completed", label: "Sprint completed" },
  { id: "ai.suggestion.applied", label: "AI suggestion applied" },
];

interface WebhookRecord {
  id: string;
  url: string;
  events: string[];
  createdAt: Date;
}

interface Props {
  workspaceId: string;
  workspaceSlug: string;
  webhooks: WebhookRecord[];
}

export function WebhookManager({ workspaceId, webhooks }: Props) {
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleEvent(eventId: string) {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  }

  function handleCreate() {
    if (!url || selectedEvents.length === 0) return;
    startTransition(async () => {
      const { secret } = await createWebhook(workspaceId, { url, events: selectedEvents });
      setRevealedSecret(secret);
      setUrl("");
      setSelectedEvents([]);
    });
  }

  function handleDelete(webhookId: string) {
    startTransition(async () => {
      await deleteWebhook(workspaceId, webhookId);
    });
  }

  return (
    <section>
      <h2 className="text-[16px] font-semibold text-on-surface mb-1">Webhooks</h2>
      <p className="text-[13px] text-on-surface-variant/70 mb-5">
        Receive HTTP POST requests when events happen. Payloads are signed with HMAC-SHA256.
      </p>

      {revealedSecret && (
        <div className="mb-5 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
          <div className="text-[12px] font-semibold text-green-400 mb-2">
            Webhook signing secret — copy now, not shown again.
          </div>
          <code className="block font-mono text-[12px] text-on-surface bg-surface-container-highest px-3 py-2 rounded-lg break-all">
            {revealedSecret}
          </code>
        </div>
      )}

      <div className="space-y-3 mb-5 p-4 rounded-xl border border-outline-variant/20 bg-surface-container">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-service.com/webhooks/axiom"
          className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-high text-[13px] text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/50"
        />
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_EVENTS.map((ev) => (
            <button
              key={ev.id}
              onClick={() => toggleEvent(ev.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                selectedEvents.includes(ev.id)
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-surface-container-high text-on-surface-variant border-outline-variant/20"
              }`}
            >
              {ev.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCreate}
          disabled={!url || selectedEvents.length === 0 || isPending}
          className="w-full py-2.5 bg-primary text-white rounded-xl text-[13px] font-medium hover:brightness-110 transition-all disabled:opacity-50"
        >
          Add Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <p className="text-[13px] text-on-surface-variant/50 text-center py-4">
          No webhooks configured.
        </p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div
              key={wh.id}
              className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-outline-variant/20 bg-surface-container"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-mono text-on-surface truncate">{wh.url}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {wh.events.map((ev) => (
                    <span
                      key={ev}
                      className="px-2 py-0.5 rounded bg-surface-container-high text-[11px] text-on-surface-variant font-mono"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleDelete(wh.id)}
                disabled={isPending}
                className="shrink-0 text-[12px] text-red-400 hover:text-red-300 transition-colors mt-0.5 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
