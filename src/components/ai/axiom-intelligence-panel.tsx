"use client";

import { useState } from "react";
import { ReasoningStream } from "./reasoning-stream";
import { FeedbackButtons } from "./feedback-buttons";
import type { TaskWithRelations } from "@/types/task.types";

interface AxiomIntelligencePanelProps {
  task: TaskWithRelations;
  columnName: string;
  boardMembers: { userId: string; name: string; taskCount: number }[];
}

type SuggestionType = "prioritize" | "estimate" | "describe" | "detect-blocker" | "assign";

interface ActiveSuggestion {
  type: SuggestionType;
  logId: string | null;
}

const SUGGESTION_ITEMS: {
  type: SuggestionType;
  label: string;
  description: string;
}[] = [
  { type: "prioritize", label: "Suggest priority", description: "Analyze and recommend the right priority level." },
  { type: "estimate", label: "Estimate effort", description: "Suggest story points based on task scope." },
  { type: "describe", label: "Generate description", description: "Write a professional task description from the title." },
  { type: "detect-blocker", label: "Detect blocker", description: "Assess whether this task may be blocked or at risk." },
  { type: "assign", label: "Suggest assignee", description: "Recommend the best team member based on workload." },
];

export function AxiomIntelligencePanel({
  task,
  columnName,
  boardMembers,
}: AxiomIntelligencePanelProps) {
  const [active, setActive] = useState<ActiveSuggestion | null>(null);

  function getPayload(type: SuggestionType): Record<string, unknown> {
    const base = {
      taskId: task.id,
      title: task.title,
      description: task.description ?? undefined,
    };

    switch (type) {
      case "prioritize":
        return {
          ...base,
          columnName,
          dueDate: task.dueDate?.toISOString(),
        };
      case "estimate":
        return { ...base };
      case "describe":
        return { ...base, columnName };
      case "detect-blocker": {
        const lastActivity = task.activity?.[0]?.createdAt;
        const daysSince = lastActivity
          ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
          : 0;
        return {
          ...base,
          columnName,
          daysSinceLastActivity: daysSince,
          commentCount: task.comments?.length ?? 0,
        };
      }
      case "assign":
        return { ...base, members: boardMembers };
    }
  }

  return (
    <div className="mt-6 border-t border-outline-variant/20 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
        <span className="text-[11px] font-semibold text-[#8B5CF6] uppercase tracking-widest">
          Axiom Intelligence
        </span>
      </div>

      <div className="space-y-2">
        {SUGGESTION_ITEMS.map((item) => {
          const isActive = active?.type === item.type;
          return (
            <div key={item.type} className="rounded-lg border border-outline-variant/20 overflow-hidden">
              <button
                onClick={() => {
                  if (isActive) {
                    setActive(null);
                  } else {
                    setActive({ type: item.type, logId: null });
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-[#8B5CF6]/5 transition-colors"
              >
                <div>
                  <div className="text-[13px] font-medium text-on-surface">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-on-surface-variant/60 mt-0.5">
                    {item.description}
                  </div>
                </div>
                <svg
                  className={`shrink-0 ml-2 text-on-surface-variant/40 transition-transform ${isActive ? "rotate-180" : ""}`}
                  fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isActive && (
                <div className="px-3 pb-3 pt-1 bg-black/20">
                  <ReasoningStream
                    key={`${item.type}-${task.id}`}
                    endpoint={`/api/ai/${item.type}`}
                    payload={getPayload(item.type)}
                    onDone={(logId) => setActive({ type: item.type, logId })}
                    autoStart
                  />
                  {active.logId && (
                    <div className="mt-2 pt-2 border-t border-outline-variant/10">
                      <FeedbackButtons logId={active.logId} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-on-surface-variant/30 text-center">
        Axiom AI Intelligence Engine v0.1
      </p>
    </div>
  );
}
