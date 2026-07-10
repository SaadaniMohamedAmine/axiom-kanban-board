"use client";

interface ConflictBadgeProps {
  visible: boolean;
}

export function ConflictBadge({ visible }: ConflictBadgeProps) {
  if (!visible) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container/30 border border-error-container/50">
      <span className="w-1.5 h-1.5 rounded-full bg-error" />
      <span className="text-[11px] font-medium text-error">Edit conflict</span>
    </div>
  );
}
