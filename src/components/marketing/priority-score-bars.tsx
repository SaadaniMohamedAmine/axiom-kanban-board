"use client";

import { motion } from "framer-motion";

const ROWS = [
  { code: "AX-4012", score: 92, color: "#8B5CF6" },
  { code: "AX-4009", score: 76, color: "#22D3EE" },
  { code: "AX-3998", score: 41, color: "#8b93a8" },
];

export function PriorityScoreBars() {
  return (
    <div className="mt-3 space-y-2.5">
      {ROWS.map((row, i) => (
        <div key={row.code}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] text-on-surface-variant">{row.code}</span>
            <span className="font-mono text-[9px] text-on-surface-variant">{row.score}</span>
          </div>
          <div className="h-1 rounded-full bg-outline-variant/15 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: row.color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${row.score}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.15, ease: [0, 0, 0.2, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
