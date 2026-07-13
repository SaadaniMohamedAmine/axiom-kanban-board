"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DURATION_MS = 2800;
const HOLD_MS = 250;
const FADE_MS = 400;

/** Dispatch this window event to replay the splash (e.g. on sign-out) —
 * it does NOT fire on ordinary client-side link navigation. */
export const SPLASH_EVENT = "axiom:splash";

export function AppSplash() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(true);
  const rafRef = useRef(0);

  const runTick = useCallback(() => {
    document.body.style.overflow = "hidden";
    const start = performance.now();

    function tick(now: number) {
      const ratio = Math.min((now - start) / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - ratio, 3); // ease-out cubic — decelerates like a real boot sequence
      setProgress(Math.round(eased * 100));

      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setHidden(true), HOLD_MS);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const replay = useCallback(() => {
    setMounted(true);
    setHidden(false);
    setProgress(0);
    runTick();
  }, [runTick]);

  useEffect(() => {
    runTick(); // initial boot — state already starts at its defaults
    window.addEventListener(SPLASH_EVENT, replay);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener(SPLASH_EVENT, replay);
    };
  }, [runTick, replay]);

  useEffect(() => {
    if (!hidden) return;
    document.body.style.overflow = "";
    const t = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(t);
  }, [hidden]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-background transition-opacity duration-400 ${
        hidden ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative">
        <div className="absolute -inset-6 bg-primary/20 blur-2xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl border border-primary/40 bg-surface-container/60 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.25)]">
          <span className="font-mono text-2xl font-bold text-primary tracking-tight">AX</span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-[28px] font-semibold text-primary tracking-tight">Axiom</div>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60">
          The intelligence layer for elite teams
        </p>
      </div>

      <div className="w-64">
        <div className="h-0.75 rounded-full bg-outline-variant/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-[#8B5CF6] to-[#22D3EE]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/50">Loading</span>
          <span className="font-mono text-[10px] text-on-surface-variant/50">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
