"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createWorkspace } from "@/lib/actions/workspace.actions";

export function WorkspaceForm() {
  const t = useTranslations("onboarding");
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
      setError(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-6">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)" }}
      />

      <h1 className="relative text-h2 font-semibold tracking-tight text-on-surface mb-10">
        Axiom
      </h1>

      <section className="gradient-border relative w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-h3 text-on-surface">{t("title")}</h2>
            <p className="text-[13px] text-on-surface-variant">{t("description")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                {t("nameLabel")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none input-glow transition-all"
                autoFocus
              />
            </div>

            {error && <p className="text-[13px] text-error">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-3 bg-primary text-on-primary rounded-lg text-[13px] font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting ? t("creating") : t("continue")}
            </button>
          </form>
        </div>
      </section>

      <p className="relative mt-8 text-[12px] text-on-surface-variant/60">{t("footerNote")}</p>
    </div>
  );
}
