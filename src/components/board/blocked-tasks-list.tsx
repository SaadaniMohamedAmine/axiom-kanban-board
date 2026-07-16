import { getTranslations } from "next-intl/server";

interface BlockedTasksListProps {
  tasks: { id: string; code: string; title: string }[];
}

export async function BlockedTasksList({ tasks }: BlockedTasksListProps) {
  if (tasks.length === 0) return null;

  const t = await getTranslations("analytics");

  return (
    <div className="rounded-xl border border-error/20 bg-error/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="text-error shrink-0" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
        <span className="text-[11px] font-semibold text-error uppercase tracking-widest">
          {t("blocked")} ({tasks.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2 text-[13px]">
            <span className="font-mono text-[11px] text-on-surface-variant/60 shrink-0">{task.code}</span>
            <span className="text-on-surface truncate">{task.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
