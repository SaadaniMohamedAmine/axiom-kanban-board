interface SettingsCardProps {
  title: string;
  badge?: { label: string; tone?: "primary" | "tertiary" };
  children: React.ReactNode;
}

/** Gradient-outline panel used across settings pages — see .gradient-border in globals.css. */
export function SettingsCard({ title, badge, children }: SettingsCardProps) {
  return (
    <section className="gradient-border">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-h3 text-on-surface">{title}</h2>
          {badge && (
            <span
              className={`shrink-0 px-3 py-1 rounded-full bg-surface-container-highest font-label-md text-[10px] uppercase tracking-widest ${
                badge.tone === "tertiary" ? "text-tertiary" : "text-primary"
              }`}
            >
              {badge.label}
            </span>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
