"use client";

import { useCallback, useState } from "react";

interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

/** Material-style click ripple. Spread `onMouseDown` onto a `relative overflow-hidden`
 * element and render `rippleElements` inside it. */
export function useRipple(color: string = "rgba(255,255,255,0.35)") {
  const [ripples, setRipples] = useState<RippleItem[]>([]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now() + Math.random();
    setRipples((prev) => [
      ...prev,
      { id, size, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2 },
    ]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 650);
  }, []);

  const rippleElements = (
    <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full animate-[ripple_600ms_ease-out_forwards]"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size, backgroundColor: color }}
        />
      ))}
    </span>
  );

  return { onMouseDown, rippleElements };
}
