"use client";

import { useState } from "react";
import { createWorkspace } from "@/lib/actions/workspace.actions";

export function WorkspaceForm() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createWorkspace({ name: name.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-h1 text-on-surface mb-2">Create Workspace</h1>
      <p className="text-body-md text-on-surface-variant mb-8">
        Give your workspace a name to get started.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="text-label-md text-on-surface-variant mb-2 block">
            Workspace Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Engineering Team"
            className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-lg text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full py-3 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? "Creating..." : "Create Workspace"}
        </button>
      </form>
    </div>
  );
}
