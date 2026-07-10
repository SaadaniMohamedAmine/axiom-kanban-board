"use client";

import { useState } from "react";
import { submitAIFeedback } from "@/lib/actions/ai.actions";

interface FeedbackButtonsProps {
  logId: string;
}

export function FeedbackButtons({ logId }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<"USEFUL" | "NOT_USEFUL" | null>(null);
  const [pending, setPending] = useState(false);

  async function handleFeedback(feedback: "USEFUL" | "NOT_USEFUL") {
    if (submitted || pending) return;
    setPending(true);
    try {
      await submitAIFeedback({ logId, feedback });
      setSubmitted(feedback);
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <span className="text-[11px] text-on-surface-variant/50">
        Feedback recorded
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-on-surface-variant/50">Helpful?</span>
      <button
        onClick={() => void handleFeedback("USEFUL")}
        disabled={pending}
        className="p-1 rounded hover:bg-green-500/10 text-on-surface-variant hover:text-green-400 transition-colors disabled:opacity-40"
        aria-label="Useful"
      >
        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      </button>
      <button
        onClick={() => void handleFeedback("NOT_USEFUL")}
        disabled={pending}
        className="p-1 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-400 transition-colors disabled:opacity-40"
        aria-label="Not useful"
      >
        <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
        </svg>
      </button>
    </div>
  );
}
