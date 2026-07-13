"use client";

import { useRef } from "react";

const DEFAULT_GLOW = "drop-shadow(0 0 12px rgba(59,130,246,0.18))";

/** Wraps its children with a subtle drop-shadow that follows the cursor. */
export function MouseGlow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 20;
    const y = (e.clientY - rect.top - rect.height / 2) / 20;
    el.style.filter = `drop-shadow(${x}px ${y}px 16px rgba(59,130,246,0.25))`;
  }

  function handleMouseLeave() {
    if (ref.current) ref.current.style.filter = DEFAULT_GLOW;
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ filter: DEFAULT_GLOW, transition: "filter 0.15s ease-out" }}
    >
      {children}
    </div>
  );
}
