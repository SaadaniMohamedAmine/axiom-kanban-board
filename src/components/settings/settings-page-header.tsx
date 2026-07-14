interface SettingsPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
}

export function SettingsPageHeader({ eyebrow, title, description }: SettingsPageHeaderProps) {
  return (
    <header className="mb-12">
      {eyebrow && (
        <div className="text-[11px] font-semibold text-on-surface-variant/50 uppercase tracking-wider mb-2">
          {eyebrow}
        </div>
      )}
      <h1 className="text-h1 text-on-surface mb-2">{title}</h1>
      {description && <p className="text-body-md text-on-surface-variant">{description}</p>}
    </header>
  );
}
