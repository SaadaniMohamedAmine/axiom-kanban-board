"use client";

import { useEffect, useRef, useState } from "react";

interface ReasoningStreamProps {
  endpoint: string;
  payload: Record<string, unknown>;
  onDone?: (logId: string) => void;
  onError?: (message: string) => void;
  autoStart?: boolean;
}

export function ReasoningStream({
  endpoint,
  payload,
  onDone,
  onError,
  autoStart = false,
}: ReasoningStreamProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  async function startStream() {
    if (status === "streaming") return;
    setText("");
    setStatus("streaming");
    setErrorMsg("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      });

      if (res.status === 429) {
        const data = await res.json() as { error: string };
        setErrorMsg(data.error);
        setStatus("error");
        onError?.(data.error);
        return;
      }

      if (!res.ok || !res.body) {
        setErrorMsg("Axiom Intelligence encountered an error.");
        setStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw) as {
              text?: string;
              done?: boolean;
              logId?: string;
              error?: string;
            };

            if (parsed.error) {
              setErrorMsg(parsed.error);
              setStatus("error");
              onError?.(parsed.error);
              return;
            }

            if (parsed.text) {
              setText((prev) => prev + parsed.text);
            }

            if (parsed.done && parsed.logId) {
              setStatus("done");
              onDone?.(parsed.logId);
              return;
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }

      setStatus("done");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMsg("Connection lost. Please retry.");
        setStatus("error");
      }
    }
  }

  useEffect(() => {
    if (autoStart) {
      void startStream();
    }
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return (
    <div className="space-y-3">
      {status === "idle" && (
        <button
          onClick={() => void startStream()}
          className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#8B5CF6] border border-[#8B5CF6]/30 rounded-lg hover:bg-[#8B5CF6]/10 transition-colors"
        >
          <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run analysis
        </button>
      )}

      {(status === "streaming" || status === "done") && text && (
        <div className="relative">
          <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#8B5CF6] to-[#22D3EE] rounded-full" />
          <p className="text-[13px] leading-relaxed text-on-surface-variant pl-2 whitespace-pre-wrap">
            {text}
            {status === "streaming" && (
              <span className="inline-block w-[2px] h-[14px] bg-[#8B5CF6] ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {errorMsg}
        </div>
      )}

      {status === "done" && (
        <button
          onClick={() => void startStream()}
          className="text-[12px] text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          Regenerate
        </button>
      )}
    </div>
  );
}
