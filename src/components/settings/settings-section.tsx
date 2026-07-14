interface SettingsSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** "ai" is reserved for genuinely AI-related sections (e.g. AI Quota) per brand rules. */
  tone?: "neutral" | "ai";
  children: React.ReactNode;
}

const TONE_CLASSES: Record<NonNullable<SettingsSectionProps["tone"]>, string> = {
  neutral: "bg-surface-container-high text-on-surface-variant",
  ai: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
};

export function SettingsSection({ id, icon, title, description, tone = "neutral", children }: SettingsSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-3 mb-6">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${TONE_CLASSES[tone]}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-h2 text-on-surface">{title}</h2>
          {description && <p className="text-[13px] text-on-surface-variant mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
