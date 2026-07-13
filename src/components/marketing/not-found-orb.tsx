"use client";

import { useRef } from "react";

const BASE_ROTATIONS = [15, 45, 75];

export function NotFoundOrb() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);

    layerRefs.current.forEach((layer, index) => {
      if (!layer) return;
      const speed = (index + 1) * 15;
      layer.style.transform = `rotate(${BASE_ROTATIONS[index]}deg) translate(${x / speed}px, ${y / speed}px) scale(${1 + index * 0.05})`;
    });
  }

  function handleMouseLeave() {
    layerRefs.current.forEach((layer, index) => {
      if (!layer) return;
      layer.style.transform = `rotate(${BASE_ROTATIONS[index]}deg)`;
    });
  }

  return (
    <div
      className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] mx-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-[25%] rounded-full bg-primary/15 blur-2xl animate-pulse" />
      <div
        ref={(el) => { layerRefs.current[0] = el; }}
        className="absolute inset-0 border border-primary/20 transition-transform duration-500 ease-out"
        style={{ transform: `rotate(${BASE_ROTATIONS[0]}deg) scale(1.1)` }}
      />
      <div
        ref={(el) => { layerRefs.current[1] = el; }}
        className="absolute inset-0 border border-primary/40 transition-transform duration-500 ease-out"
        style={{ transform: `rotate(${BASE_ROTATIONS[1]}deg)` }}
      />
      <div
        ref={(el) => { layerRefs.current[2] = el; }}
        className="absolute inset-0 border border-primary/10 transition-transform duration-500 ease-out"
        style={{ transform: `rotate(${BASE_ROTATIONS[2]}deg) scale(0.9)` }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[100px] sm:text-[120px] font-black tracking-tight text-on-surface/5 select-none">404</span>
      </div>
    </div>
  );
}
